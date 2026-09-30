'use strict';
const assert=require('node:assert/strict');
const media=require('../src/host/shino80-foreign-media.js');
const native=require('../src/devices/shino80/shino80-media-profiles.js');
const fs=require('../src/firmware/shino80/shino80-cpm-filesystem.js');
const fixture=require('./fixtures/shino80_phase4_fixtures.cjs');
const {F000,F001,foreign,fdi,d88,dcp}=fixture;
function reject(fn,code){assert.throws(fn,e=>e.code===code);}
function mutate(bytes,fn){const copy=bytes.slice();fn(copy,new DataView(copy.buffer));return copy;}
const source=foreign(),source720=foreign(F001);
assert.deepEqual(media.DESCRIPTORS[0].xlt,F000.xlt);
assert.deepEqual(media.DESCRIPTORS.map(p=>p.dpb),[{spt:26,bsh:3,blm:7,exm:0,dsm:242,drm:63,al0:192,al1:0,cks:16,off:2},{spt:36,bsh:4,blm:15,exm:0,dsm:356,drm:255,al0:240,al1:0,cks:64,off:1}]);
for(const [p,s] of [[F000,source],[F001,source720]]){
  for(const bytes of [fdi(s.raw,p),d88(s.raw,p,{reverse:true}),...(p===F001?[dcp(s.raw,p)]:[])]){
    const original=bytes.slice(),parsed=media.parse(bytes,'not-a-format.txt'),disk=parsed.disks[0];
    const id=p===F000?'F000':'F001';assert.deepEqual(media.candidates(disk),[id]);reject(()=>media.readFilesystem(disk,''),'UNKNOWN_CPM_PROFILE');reject(()=>media.validate(disk,id==='F000'?'F001':'F000'),'PROFILE_MISMATCH');
    const volume=media.readFilesystem(disk,id),file=volume.files[0];assert.equal(file.name,'HELLO.COM');assert.equal(file.records,1);assert.deepEqual(file.bytes.slice(0,s.files[0].bytes.length),s.files[0].bytes);assert(file.bytes.slice(s.files[0].bytes.length).every(b=>b===0x1A));
    bytes.fill(0);parsed.sourceBytes.fill(0);disk.tracks[0].sectors[0].data.fill(0);file.bytes.fill(0);
    assert.deepEqual(parsed.sourceBytes,original);assert.equal(media.readFilesystem(disk,id).files[0].bytes[0],0x0E);assert(Object.isFrozen(disk.tracks));
    for(const dest of native.MEDIA_PROFILES){const built=media.buildNative(volume.files,dest.id);assert.equal(built.bytes.length,dest.imageBytes);const entries=fs.readDirectoryForProfile(built.bytes,dest.id);assert.equal(entries[0].name,file.name);assert.deepEqual(built.bytes.slice(fs.dataOffsetForProfile(dest.id,entries[0].blocks[0]),fs.dataOffsetForProfile(dest.id,entries[0].blocks[0])+128),file.bytes);}
  }
}
// Multi-disk D88, zero offsets and physical non-identity XLT.
const a=d88(source.raw),b=d88(source720.raw,F001),both=new Uint8Array(a.length+b.length);both.set(a);both.set(b,a.length);assert.equal(media.parse(both).disks.length,2);
assert.notDeepEqual(media.reader(media.parse(fdi(source.raw)).disks[0],'F000').record(68),source.raw.slice(68*128,69*128));
for(const bad of [a.slice(0,600),a.slice(0,-1),mutate(a,(_,v)=>v.setUint32(0x20,0x2AF,true)),mutate(a,(_,v)=>v.setUint32(0x24,0x2B0,true)),mutate(a,(_,v)=>v.setUint16(0x2B4,0,true)),mutate(a,(_,v)=>v.setUint16(0x2BE,65535,true))])assert.throws(()=>media.parseD88(bad));
const duplicate=mutate(a,(bytes)=>{bytes[0x2B0+144+2]=1;});const irregular=media.parseD88(duplicate);assert(irregular.disks[0].structuralWarnings.includes('DUPLICATE_SECTOR_ID'));reject(()=>media.validate(irregular.disks[0],'F000'),'PROFILE_MISMATCH');
const missing=mutate(a,(bytes)=>{bytes[0x2B2]=27;});assert(media.parseD88(missing).disks[0].structuralWarnings.length);reject(()=>media.validate(media.parseD88(missing).disks[0],'F000'),'PROFILE_MISMATCH');
const deleted=mutate(a,(bytes)=>{bytes[0x2B7]=1;});reject(()=>media.validate(media.parseD88(deleted).disks[0],'F000'),'PROFILE_MISMATCH');
for(const [c,h,s,bps] of [[80,2,9,512],[80,2,15,512],[80,2,18,512],[77,2,8,1024]])assert.equal(media.parseFdi(fdi(new Uint8Array(c*h*s*bps),{c,h,s,b:bps})).disks[0].tracks.length,c*h);
const valid=fdi(source.raw);for(const [offset,value] of [[8,31],[8,999999],[12,1],[16,129],[20,0],[24,3],[28,78]])assert.throws(()=>media.parseFdi(mutate(valid,(_,v)=>v.setUint32(offset,value,true))));
assert.equal(media.parseD88(d88(new Uint8Array(77*2*8*1024),{c:77,h:2,s:8,b:1024})).disks[0].tracks[0].sectors[0].byteLength,1024);
const variable=mutate(a,bytes=>bytes[0x2B3]=2);assert(media.parseD88(variable).disks[0].structuralWarnings.includes('VARIABLE_SECTOR_SIZE'));reject(()=>media.validate(media.parseD88(variable).disks[0],'F000'),'PROFILE_MISMATCH');
reject(()=>media.reader(media.parse(valid).disks[0],'F000').record(77*26),'MALFORMED_FILESYSTEM');
for(const [type,geometry] of Object.entries(media.DCP_MEDIA)){
  const [c,h,s,bps]=geometry,total=c*h,fullBytes=Number(type)===17?s*128+(total-1)*s*bps:total*s*bps;
  const bytes=new Uint8Array(162+fullBytes);bytes[0]=Number(type);bytes[1+total]=1;
  const parsed=media.parseDcp(bytes);assert.equal(parsed.disks[0].tracks.length,total);assert.equal(parsed.disks[0].tracks[0].sectors[0].byteLength,Number(type)===17?128:bps);
}
const sparse=dcp(source720.raw,F001,{present:Array.from({length:160},(_,i)=>i===0?1:0)});assert.equal(media.parseDcp(sparse).disks[0].tracks.length,1);reject(()=>media.validate(media.parseDcp(sparse).disks[0],'F001'),'PROFILE_MISMATCH');
for(const bad of [new Uint8Array(161),mutate(sparse,bytes=>bytes[1]=2),mutate(sparse,bytes=>bytes.fill(0,1,162)),mutate(sparse,bytes=>bytes[0]=255),sparse.slice(0,-1)])assert.throws(()=>media.parseDcp(bad));
assert.throws(()=>media.parseDcp(mutate(sparse,bytes=>{bytes[0]=1;bytes[161]=1;})));
reject(()=>media.parse(new Uint8Array(20),'valid.d88'),'UNSUPPORTED_CONTAINER');
// Extents, USERs, high filename bits, 16-bit blocks >255 and malformed structures.
for(const p of [F000,F001]){
  const bytes=Uint8Array.from({length:129*128},(_,i)=>i&255),s=foreign(p,[{name:'DATA.BIN',user:15,bytes}]),volume=media.readFilesystem(media.parse(fdi(s.raw,p)).disks[0],p===F000?'F000':'F001');assert.deepEqual(volume.files[0].bytes,bytes);assert.equal(volume.files[0].extents,2);
  const start=p.off*p.s*p.b;
  for(const edit of [(raw)=>raw[start+15]=129,(raw)=>raw[start+32+12]=0,(raw)=>raw[start+32+12]=2,(raw)=>{raw[start+16]=255;if(p.wide)raw[start+17]=255;}]){
    // Modify logical layout, then translate back independently.
    const logical=s.logical.slice();edit(logical);const raw=new Uint8Array(logical.length);for(let t=0;t<p.c*p.h;t++)for(let si=0;si<p.s;si++)raw.set(logical.slice((t*p.s+si)*p.b,(t*p.s+si+1)*p.b),(t*p.s+p.xlt[si]-1)*p.b);
    reject(()=>media.readFilesystem(media.parse(fdi(raw,p)).disks[0],p===F000?'F000':'F001'),'MALFORMED_FILESYSTEM');
  }
}
const same=[{name:'SAME.TXT',user:0,bytes:new Uint8Array(128)},{name:'SAME.TXT',user:15,bytes:new Uint8Array(128).fill(15)}];
assert.equal(fs.readDirectory(media.buildNative(same,0).bytes).length,2);
reject(()=>media.buildNative([same[0],same[0]],0),'INVALID_SELECTION');
{
  const copy=source.raw.slice();copy[52*128+1]|=128;const volume=media.readFilesystem(media.parse(fdi(copy)).disks[0],'F000');assert.equal(volume.files[0].name,'HELLO.COM','filename attribute bits masked');
}
for(const p of native.MEDIA_PROFILES){const layout=fs.filesystemLayout(p.id),max=(layout.totalBlocks-layout.firstDataBlock)*layout.blockSize;const files=[{name:'FULL.BIN',user:0,bytes:new Uint8Array(max)}];assert(media.capacity(files,p.id).ok);assert.equal(media.buildNative(files,p.id).bytes.length,p.imageBytes);files[0].bytes=new Uint8Array(max+128);assert(!media.capacity(files,p.id).ok);reject(()=>media.buildNative(files,p.id),'CAPACITY_EXCEEDED');const many=Array.from({length:layout.directoryEntries+1},(_,i)=>({name:`F${i}.BIN`,user:0,bytes:new Uint8Array()}));reject(()=>media.buildNative(many,p.id),'CAPACITY_EXCEEDED');}
console.log('PHASE 4 FOREIGN: D88/FDI/DCP + F000/XLT + F001/16BIT + IMMUTABILITY + ALL NATIVE CAPACITY PASS');
