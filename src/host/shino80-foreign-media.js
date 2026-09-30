(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=factory(node?require('../firmware/shino80/shino80-cpm-filesystem.js'):root.SHINO_CPM_FILESYSTEM,node?require('../devices/shino80/shino80-media-profiles.js'):root.SHINO_MEDIA_PROFILES);
  if(node)module.exports=api;
  root.SHINO_FOREIGN_MEDIA=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(fs,native){
  'use strict';
  const fail=(code,message)=>{const error=new Error(`${code}: ${message}`);error.code=code;throw error;};
  const frozen=list=>Object.freeze(list);
  // Typed arrays cannot be frozen. Every public byte accessor returns a copy.
  function bytesProperty(object,key,bytes){const copy=new Uint8Array(bytes);Object.defineProperty(object,key,{enumerable:true,get:()=>new Uint8Array(copy)});return object;}
  function sector(c,h,r,n,bytes,offset,status=0){return Object.freeze(bytesProperty({cylinder:c,head:h,sectorId:r,sizeCode:n,byteLength:bytes.length,status,sourceOffset:offset},'data',bytes));}
  function track(c,h,ordinal,sectors){return Object.freeze({cylinder:c,head:h,ordinal,sectors:frozen(sectors)});}
  function disk(index,name,writeProtected,tracks,warnings=[],comment='',metadata={}){return Object.freeze({index,name,writeProtected,comment,...metadata,tracks:frozen(tracks),structuralWarnings:frozen(warnings)});}
  function container(type,fileName,bytes,disks){return Object.freeze(bytesProperty({type,fileName,sourceByteLength:bytes.length,disks:frozen(disks),warnings:frozen([])},'sourceBytes',bytes));}
  function input(value){if(!(value instanceof Uint8Array))fail('INVALID_INPUT','Expected Uint8Array');return new Uint8Array(value);}
  function bounds(bytes,offset,length){if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||length<0||offset+length>bytes.length)fail('MALFORMED_CONTAINER','Out-of-range header/payload');}
  function u16(bytes,offset){bounds(bytes,offset,2);return bytes[offset]|bytes[offset+1]<<8;}
  function u32(bytes,offset){bounds(bytes,offset,4);return new DataView(bytes.buffer,bytes.byteOffset+offset,4).getUint32(0,true);}
  const sizeCode=size=>Math.log2(size/128);
  const validSize=size=>[128,256,512,1024,2048,4096,8192].includes(size);
  function linear(bytes,start,cylinders,heads,spt,bps,present=null){
    const tracks=[];let offset=start;
    for(let i=0;i<cylinders*heads;i++){
      if(present&&!present(i))continue;
      const c=Math.floor(i/heads),h=i%heads,size=typeof bps==='function'?bps(i):bps,sectors=[];
      for(let r=1;r<=spt;r++){bounds(bytes,offset,size);sectors.push(sector(c,h,r,sizeCode(size),bytes.slice(offset,offset+size),offset));offset+=size;}
      tracks.push(track(c,h,i,sectors));
    }
    if(offset!==bytes.length)fail('MALFORMED_CONTAINER','Trailing or missing payload');
    return tracks;
  }
  function parseFdi(value,fileName=''){
    const bytes=input(value);bounds(bytes,0,32);
    const header=u32(bytes,8),data=u32(bytes,12),bps=u32(bytes,16),spt=u32(bytes,20),heads=u32(bytes,24),cylinders=u32(bytes,28);
    if(header<32||header>bytes.length||header+data!==bytes.length||!validSize(bps)||spt<1||spt>255||heads<1||heads>2||cylinders<1||cylinders>256||cylinders*heads*spt*bps!==data)fail('MALFORMED_CONTAINER','Invalid FDI geometry/header');
    return container('FDI',fileName,bytes,[disk(0,'FDI disk',false,linear(bytes,header,cylinders,heads,spt,bps),[],'',{fddType:u32(bytes,4),reserved:u32(bytes,0),diskByteLength:data})]);
  }
  const DCP_MEDIA=Object.freeze({1:[77,2,8,1024],2:[80,2,15,512],3:[80,2,18,512],4:[80,2,8,512],5:[80,2,9,512],8:[80,2,9,1024],17:[77,2,26,256],25:[80,2,16,256],33:[80,2,26,256]});
  Object.values(DCP_MEDIA).forEach(Object.freeze);
  function parseDcp(value,fileName=''){
    const bytes=input(value);bounds(bytes,0,162);
    const geometry=DCP_MEDIA[bytes[0]];if(!geometry)fail('UNSUPPORTED_CONTAINER','Unknown DCP/DCU media type');
    const [c,h,s,b]=geometry,vector=bytes.slice(1,162),sentinel=vector.lastIndexOf(1);
    if(vector.some(v=>v!==0&&v!==1)||sentinel<0||sentinel>c*h)fail('MALFORMED_CONTAINER','Invalid DCP/DCU sentinel/vector');
    const bps=i=>bytes[0]===17&&i===0?128:b;
    let full=0,sparse=0;for(let i=0;i<c*h;i++){full+=s*bps(i);if(i<sentinel&&vector[i]===1)sparse+=s*bps(i);}
    const isFull=bytes.length===162+full;
    if(!isFull&&bytes.length!==162+sparse)fail('MALFORMED_CONTAINER','DCP/DCU payload size mismatch');
    const tracks=linear(bytes,162,c,h,s,bps,isFull?null:i=>i<sentinel&&vector[i]===1);
    return container('DCP/DCU',fileName,bytes,[disk(0,'DCP/DCU disk',false,tracks,isFull?[]:['SPARSE_LAYOUT: absent tracks remain absent'],'',{mediaType:bytes[0],layout:isFull?'FULL':'SPARSE',diskByteLength:bytes.length-162})]);
  }
  function parseD88(value,fileName=''){
    const bytes=input(value),disks=[];let base=0;
    while(base<bytes.length){
      bounds(bytes,base,0x2B0);const length=u32(bytes,base+0x1C);
      if(length<0x2B0||base+length>bytes.length)fail('MALFORMED_CONTAINER','D88 disk size');
      const offsets=[];for(let i=0;i<164;i++){const offset=u32(bytes,base+0x20+i*4);if(offset){if(offset<0x2B0||offset>=length)fail('MALFORMED_CONTAINER','D88 track offset');offsets.push({offset,ordinal:i});}}
      offsets.sort((a,b)=>a.offset-b.offset);
      if(new Set(offsets.map(t=>t.offset)).size!==offsets.length)fail('MALFORMED_CONTAINER','D88 overlapping tracks');
      const tracks=[],warnings=[];
      for(let ti=0;ti<offsets.length;ti++){
        const item=offsets[ti],end=base+(offsets[ti+1]?.offset??length);let pos=base+item.offset;
        bounds(bytes,pos,16);const count=u16(bytes,pos+4);if(!count||count>255)fail('MALFORMED_CONTAINER','D88 impossible sector count');
        const sectors=[],ids=new Set();let c=null,h=null;
        for(let si=0;si<count;si++){
          if(pos+16>end)fail('MALFORMED_CONTAINER','D88 truncated sector header');
          const sc=bytes[pos],sh=bytes[pos+1],r=bytes[pos+2],n=bytes[pos+3],size=u16(bytes,pos+14),status=bytes[pos+8]||bytes[pos+7];
          if(u16(bytes,pos+4)!==count||!size||pos+16+size>end)fail('MALFORMED_CONTAINER','D88 count/payload bounds');
          if(c===null){c=sc;h=sh;}else if(c!==sc||h!==sh)warnings.push('INCONSISTENT_CH');
          if(ids.has(r))warnings.push('DUPLICATE_SECTOR_ID');ids.add(r);
          if(n>6||size!==128*2**n)warnings.push('VARIABLE_SECTOR_SIZE');
          if(status)warnings.push('SECTOR_STATUS_OR_DELETED');
          sectors.push(sector(sc,sh,r,n,bytes.slice(pos+16,pos+16+size),pos+16,status));pos+=16+size;
        }
        if(pos!==end)fail('MALFORMED_CONTAINER','D88 overlapping/trailing track payload');
        if(new Set(sectors.map(s=>s.byteLength)).size>1)warnings.push('VARIABLE_SECTOR_SIZE');
        if(Array.from({length:count},(_,i)=>i+1).some(id=>!ids.has(id)))warnings.push('NONCONTIGUOUS_SECTOR_IDS');
        tracks.push(track(c,h,item.ordinal,sectors));
      }
      tracks.sort((a,b)=>a.ordinal-b.ordinal);
      const name=String.fromCharCode(...bytes.slice(base,base+17)).split('\0')[0];
      disks.push(disk(disks.length,name||`Disk ${disks.length+1}`,bytes[base+0x1A]!==0,tracks,[...new Set(warnings)],'',{mediaType:bytes[base+0x1B],diskByteLength:length}));base+=length;
    }
    if(!disks.length)fail('MALFORMED_CONTAINER','Empty D88');
    return container('D88',fileName,bytes,disks);
  }
  function parse(value,fileName=''){
    const bytes=input(value),matches=[];
    for(const parser of [parseD88,parseFdi,parseDcp]){try{matches.push(parser(bytes,fileName));}catch(error){if(!error.code)throw error;}}
    if(!matches.length)fail('UNSUPPORTED_CONTAINER','No structurally valid D88, FDI or DCP/DCU reader');
    if(matches.length>1)fail('AMBIGUOUS_CONTAINER','More than one structural reader matched');
    return matches[0];
  }
  const XLT=frozen([1,7,13,19,25,5,11,17,23,3,9,15,21,2,8,14,20,26,6,12,18,24,4,10,16,22]);
  function descriptor(id,name,cylinders,heads,spt,bps,dpb,pointerBytes,xlt){return Object.freeze({id,name,cylinders,heads,sectorsPerTrack:spt,sectorBytes:bps,dpb:Object.freeze(dpb),pointerBytes,xlt:frozen(xlt),blockSize:128*2**dpb.bsh});}
  const DESCRIPTORS=frozen([
    descriptor('F000','IBM3740-CPM22',77,1,26,128,{spt:26,bsh:3,blm:7,exm:0,dsm:242,drm:63,al0:192,al1:0,cks:16,off:2},1,XLT),
    descriptor('F001','SINCLAIR-PLUS3-CPM22-720',80,2,9,512,{spt:36,bsh:4,blm:15,exm:0,dsm:356,drm:255,al0:240,al1:0,cks:64,off:1},2,Array.from({length:9},(_,i)=>i+1))
  ]);
  function validate(disk,id){
    const profile=DESCRIPTORS.find(p=>p.id===id);if(!profile)fail('UNKNOWN_CPM_PROFILE','Explicit F000/F001 selection required');
    const total=profile.cylinders*profile.heads;
    if(!disk||disk.tracks.length!==total)fail('PROFILE_MISMATCH','Required track count');
    for(let i=0;i<total;i++){
      const c=Math.floor(i/profile.heads),h=i%profile.heads,t=disk.tracks[i];
      if(t.cylinder!==c||t.head!==h||t.sectors.length!==profile.sectorsPerTrack)fail('PROFILE_MISMATCH','Track order/sector count');
      const ids=new Set();for(const s of t.sectors){
        if(s.cylinder!==c||s.head!==h||s.sectorId<1||s.sectorId>profile.sectorsPerTrack||ids.has(s.sectorId)||s.byteLength!==profile.sectorBytes||s.sizeCode!==sizeCode(profile.sectorBytes)||s.status)fail('PROFILE_MISMATCH','Unsafe required sector');ids.add(s.sectorId);
      }
    }
    return profile;
  }
  function candidates(disk){return frozen(DESCRIPTORS.filter(p=>{try{validate(disk,p.id);return true;}catch(_){return false;}}).map(p=>p.id));}
  function reader(disk,id){
    const p=validate(disk,id),maps=disk.tracks.map(t=>new Map(t.sectors.map(s=>[s.sectorId,s.data])));
    const recordsPerSector=p.sectorBytes/128;
    return {profile:p,record(index){
      if(!Number.isInteger(index)||index<0||index>=maps.length*p.dpb.spt)fail('MALFORMED_FILESYSTEM','Record out of range');
      const logicalTrack=Math.floor(index/p.dpb.spt),within=index%p.dpb.spt,physical=Math.floor(within/recordsPerSector),sectorId=p.xlt[physical],offset=(within%recordsPerSector)*128;
      const data=maps[logicalTrack].get(sectorId);if(!data||offset+128>data.length)fail('MALFORMED_FILESYSTEM','Missing logical record');
      return data.slice(offset,offset+128);
    }};
  }
  function readFilesystem(disk,id){
    const read=reader(disk,id),p=read.profile,start=p.dpb.off*p.dpb.spt,dir=new Uint8Array((p.dpb.drm+1)*32);
    for(let i=0;i<dir.length/128;i++)dir.set(read.record(start+i),i*128);
    const groups=new Map(),used=new Set(),directoryBlocks=Math.ceil(dir.length/p.blockSize);
    for(let i=0;i<=p.dpb.drm;i++){
      const e=dir.slice(i*32,i*32+32);if(e[0]===0xE5)continue;
      if(e[0]>15||e[15]>128||e[13]!==0||e[14]>63)fail('MALFORMED_FILESYSTEM',`Directory entry ${i}: USER/RC/S1/S2`);
      const part=(start,length)=>String.fromCharCode(...e.slice(start,start+length).map(v=>v&127)).trimEnd();
      let name;try{name=fs.normalizeName(part(1,8)+(part(9,3)?'.'+part(9,3):'')).full;}catch(_){fail('MALFORMED_FILESYSTEM',`Directory entry ${i}: filename`);}
      const extent=(e[14]<<5)|(e[12]&31),blocks=[],needed=Math.ceil(e[15]*128/p.blockSize);
      for(let ai=0;ai<16/p.pointerBytes;ai++){
        const number=p.pointerBytes===1?e[16+ai]:u16(e,16+ai*2);
        if(number>p.dpb.dsm)fail('MALFORMED_FILESYSTEM','Allocation exceeds DSM');
        if(ai<needed){if(number<directoryBlocks||used.has(number))fail('MALFORMED_FILESYSTEM','Missing/reserved/crosslinked allocation');used.add(number);blocks.push(number);}
        else if(number!==0)fail('MALFORMED_FILESYSTEM','Unexpected allocation after RC');
      }
      const key=`${e[0]}:${name}`,group=groups.get(key)||{key,user:e[0],name,extents:[]};
      group.extents.push({extent,records:e[15],blocks});groups.set(key,group);
    }
    const files=[];
    for(const group of groups.values()){
      group.extents.sort((a,b)=>a.extent-b.extent);let records=0;
      group.extents.forEach((e,i)=>{if(e.extent!==i||(i<group.extents.length-1&&e.records!==128))fail('MALFORMED_FILESYSTEM',`Duplicate/gapped/short extent: ${group.key}`);records+=e.records;});
      const bytes=new Uint8Array(records*128);let offset=0;
      for(const e of group.extents){let remaining=e.records;for(const b of e.blocks){for(let r=0;r<p.blockSize/128&&remaining>0;r++,remaining--){bytes.set(read.record(start+b*p.blockSize/128+r),offset);offset+=128;}}}
      files.push(Object.freeze(bytesProperty({key:group.key,user:group.user,name:group.name,records,extents:group.extents.length},'bytes',bytes)));
    }
    return Object.freeze({profile:p,files:frozen(files),directoryEntries:[...groups.values()].reduce((n,g)=>n+g.extents.length,0)});
  }
  function capacity(files,profileId){
    const layout=fs.filesystemLayout(profileId);let records=0,extents=0,entries=0,blocks=0;const keys=new Set();
    for(const file of files){
      const name=fs.normalizeName(file.name).full,user=file.user;
      if(!Number.isInteger(user)||user<0||user>15||keys.has(`${user}:${name}`))fail('INVALID_SELECTION','Duplicate filename/USER');keys.add(`${user}:${name}`);
      const bytes=file.bytes;if(!(bytes instanceof Uint8Array)||bytes.length%128)fail('INVALID_SELECTION','Raw files must contain whole CP/M records');
      const count=bytes.length/128;records+=count;extents+=Math.max(1,Math.ceil(count/128));
      entries+=Math.max(1,Math.ceil(count/(128*(layout.dpb.exm+1))));
      for(let first=0;first<count;first+=128)blocks+=Math.ceil(Math.min(128,count-first)*128/layout.blockSize);
    }
    const maxBlocks=layout.totalBlocks-layout.firstDataBlock,ok=entries<=layout.directoryEntries&&blocks<=maxBlocks;
    return Object.freeze({ok,files:files.length,records,extents,directoryEntries:entries,blocks,maxDirectoryEntries:layout.directoryEntries,maxBlocks,profileId});
  }
  function buildNative(files,profileId){
    if(!files.length)fail('INVALID_SELECTION','Select at least one file');
    const summary=capacity(files,profileId);if(!summary.ok)fail('CAPACITY_EXCEEDED','No partial conversion is produced');
    const result=fs.buildFilesystemForProfile(native.createBlankMediaImage(profileId),profileId,files.map(f=>({name:f.name,user:f.user,bytes:f.bytes,padding:0})));
    return Object.freeze(bytesProperty({profileId,summary},'bytes',result.image));
  }
  return {parse,parseD88,parseFdi,parseDcp,DESCRIPTORS,DCP_MEDIA,candidates,validate,reader,readFilesystem,capacity,buildNative};
});
