(function(root){
  'use strict';
  const media=root.SHINO_FOREIGN_MEDIA,native=root.SHINO_MEDIA_PROFILES;
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  class ForeignBridgeUI{
    constructor(refresh,send){this.refresh=refresh;this.send=send;this.state='IDLE';this.generation=0;this.container=null;this.diskIndex=0;this.filesystem=null;this.selected=new Set();this.user='all';this.destination=0;this.built=null;this.message='';}
    async open(file){
      if(!file)return;
      const generation=++this.generation;this.state='READING';this.container=null;this.filesystem=null;this.built=null;this.selected.clear();this.message='';this.refresh();
      try{const bytes=new Uint8Array(await file.arrayBuffer());if(generation!==this.generation)return;this.container=media.parse(bytes,file.name);this.diskIndex=0;this.state='PARSED';}
      catch(error){if(generation!==this.generation)return;this.state='FAILED';this.message=error.message;}
      this.refresh();
    }
    get disk(){return this.container?.disks[this.diskIndex];}
    get files(){return this.filesystem?.files.filter(f=>this.selected.has(f.key))||[];}
    update(){this.built=null;const summary=media.capacity(this.files,this.destination);this.state=this.files.length&&summary.ok?'READY_TO_BUILD':'SELECTING';}
    change(field,value){
      try{
        this.message='';
        if(field==='disk'){this.diskIndex=Number(value);this.filesystem=null;this.selected.clear();this.built=null;this.state='PARSED';}
        if(field==='profile'){
          this.filesystem=null;this.selected.clear();this.built=null;
          if(!value)this.state='PARSED';else{this.filesystem=media.readFilesystem(this.disk,value);this.state='PROFILE_MATCHED';}
        }
        if(field==='user')this.user=value;
        if(field==='destination'){this.destination=Number(value);if(this.filesystem)this.update();}
        if(field==='file'){if(this.selected.has(value))this.selected.delete(value);else this.selected.add(value);this.update();}
      }catch(error){this.state='FAILED';this.message=error.message;}
      this.refresh();
    }
    action(action){
      try{
        if(action==='build'){this.built=media.buildNative(this.files,this.destination);this.state='BUILT';this.message='New native data disk built. Source and A:/B: unchanged.';}
        if(action==='download'&&this.built){
          const url=URL.createObjectURL(new Blob([this.built.bytes],{type:'application/octet-stream'})),a=document.createElement('a');a.href=url;a.download='SHINO80_FOREIGN_CONVERTED.s80d';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
        }
        if(action.startsWith('send-')&&this.built){const drive=action==='send-a'?0:1;this.message=this.send(this.built,drive)?'Native IMPORT pending. Select that drive to CONFIRM or CANCEL.':'SEND rejected: POWER must be OFF and no other native IMPORT may be active.';}
      }catch(error){this.state='FAILED';this.message=error.message;this.built=null;}
      this.refresh();
    }
    html(powered,busy){
      const select=(field,label,options)=>`<label class="foreign-control">${label}<select data-foreign-field="${field}">${options}</select></label>`;
      const option=(value,label,current)=>`<option value="${escape(value)}"${String(value)===String(current)?' selected':''}>${escape(label)}</option>`;
      let html=`<section class="foreign-bridge"><p>Read-only host bridge. No foreign boot or direct guest mount.</p><div role="status" class="foreign-status">${escape(this.state)}${this.message?' — '+escape(this.message):''}</div><button type="button" data-foreign-action="open"${this.state==='READING'?' disabled':''}>OPEN FOREIGN IMAGE</button>`;
      if(this.container){
        html+=`<p>${escape(this.container.fileName)} · ${this.container.type} · ${this.container.sourceByteLength.toLocaleString('en-US')} bytes</p>`;
        html+=select('disk','Disk',this.container.disks.map(d=>option(d.index,`${d.index+1}: ${d.name}`,this.diskIndex)).join(''));
        html+=`<p>${this.disk.tracks.length} stored tracks · ${this.disk.tracks.reduce((n,t)=>n+t.sectors.length,0)} sectors · source write protect ${this.disk.writeProtected?'ON':'OFF'}</p>`;
        html+=`<p>Sector bytes: ${[...new Set(this.disk.tracks.flatMap(t=>t.sectors.map(s=>s.byteLength)))].join(' / ')||'none'} · media ${this.disk.mediaType??this.disk.fddType??'n/a'}${this.disk.layout?' · '+this.disk.layout:''}</p>`;
        html+=`<p>Warnings: ${escape(this.disk.structuralWarnings.join(', ')||'none')}</p>`;
        const candidates=media.candidates(this.disk);
        html+=select('profile','CP/M profile — explicit selection required',option('','Select a profile (not automatic)',this.filesystem?.profile.id||'')+candidates.map(id=>option(id,`${id} ${media.DESCRIPTORS.find(p=>p.id===id).name}`,this.filesystem?.profile.id)).join(''));
        if(!candidates.length)html+='<p>UNKNOWN_CPM_PROFILE — container inspection only.</p>';
      }
      if(this.filesystem){
        html+=select('user','USER filter',option('all','All users',this.user)+Array.from({length:16},(_,i)=>option(i,`USER ${i}`,this.user)).join(''));
        html+='<div class="foreign-files" aria-label="Foreign files">';
        for(const f of this.filesystem.files.filter(f=>this.user==='all'||f.user===Number(this.user)))html+=`<label class="foreign-file"><input type="checkbox" data-foreign-field="file" value="${escape(f.key)}"${this.selected.has(f.key)?' checked':''}><span>USER ${f.user} · ${escape(f.name)}<small>${f.records} records · ${f.extents} extents</small></span></label>`;
        html+='</div>';
        if(!this.filesystem.files.length)html+='<p>No files.</p>';
        html+=select('destination','SHINO destination',native.MEDIA_PROFILES.map(p=>option(p.id,p.name,this.destination)).join(''));
        const capacity=media.capacity(this.files,this.destination);
        html+=`<p class="foreign-capacity">${capacity.files} selected · ${capacity.records} records · ${capacity.extents} extents<br>Directory ${capacity.directoryEntries}/${capacity.maxDirectoryEntries} · blocks ${capacity.blocks}/${capacity.maxBlocks}<br>${capacity.ok?'CAPACITY OK':'CAPACITY EXCEEDED — BUILD disabled'}</p>`;
        html+=`<button type="button" data-foreign-action="build"${capacity.ok&&capacity.files?'':' disabled'}>BUILD SHINO DISK</button>`;
      }
      if(this.built)html+=`<div class="disk-actions"><button type="button" data-foreign-action="download">DOWNLOAD .s80d</button><button type="button" data-foreign-action="send-a"${powered||busy?' disabled':''}>SEND TO NATIVE IMPORT A</button><button type="button" data-foreign-action="send-b"${powered||busy?' disabled':''}>SEND TO NATIVE IMPORT B</button></div>`;
      return html+'</section>';
    }
  }
  root.SHINO_FOREIGN_BRIDGE_UI={ForeignBridgeUI};
})(globalThis);
