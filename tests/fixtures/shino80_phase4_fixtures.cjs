'use strict';
// Original synthetic media, generated from independent frozen format constants.
const F000={c:77,h:1,s:26,b:128,off:2,block:1024,drm:63,wide:false,xlt:[1,7,13,19,25,5,11,17,23,3,9,15,21,2,8,14,20,26,6,12,18,24,4,10,16,22]};
const F001={c:80,h:2,s:9,b:512,off:1,block:2048,drm:255,wide:true,xlt:[1,2,3,4,5,6,7,8,9]};
function foreign(profile=F000,files=[{name:'HELLO.COM',user:0,bytes:Uint8Array.from([0x0E,9,0x11,9,1,0xCD,5,0,0xC9,72,73,36])}]){
  const raw=new Uint8Array(profile.c*profile.h*profile.s*profile.b);raw.fill(0xE5);
  const trackBytes=profile.s*profile.b,logical=new Uint8Array(raw.length);logical.fill(0xE5);
  const start=profile.off*trackBytes;let entry=0,block=profile.wide?260:2;
  for(const file of files){
    const records=Math.ceil(file.bytes.length/128),extents=Math.max(1,Math.ceil(records/128));
    for(let ex=0;ex<extents;ex++){
      const base=start+entry++*32;logical.fill(0,base,base+32);logical.fill(32,base+1,base+12);
      const [name,extension='']=file.name.split('.');logical[base]=file.user;for(let i=0;i<name.length;i++)logical[base+1+i]=name.charCodeAt(i);for(let i=0;i<extension.length;i++)logical[base+9+i]=extension.charCodeAt(i);
      logical[base+12]=ex&31;logical[base+14]=ex>>5;logical[base+15]=Math.min(128,records-ex*128);
      const count=Math.ceil(logical[base+15]*128/profile.block);
      for(let i=0;i<count;i++){
        const pointer=base+16+i*(profile.wide?2:1);logical[pointer]=block&255;if(profile.wide)logical[pointer+1]=block>>8;
        const target=start+block++*profile.block;logical.fill(0x1A,target,target+profile.block);
        logical.set(file.bytes.slice(ex*16384+i*profile.block,Math.min(file.bytes.length,(ex+1)*16384,ex*16384+(i+1)*profile.block)),target);
      }
    }
  }
  for(let t=0;t<profile.c*profile.h;t++)for(let s=0;s<profile.s;s++)raw.set(logical.slice(t*trackBytes+s*profile.b,t*trackBytes+(s+1)*profile.b),t*trackBytes+(profile.xlt[s]-1)*profile.b);
  return {raw,logical,files,profile};
}
function fdi(raw,p=F000){const out=new Uint8Array(32+raw.length),v=new DataView(out.buffer);[0,0,32,raw.length,p.b,p.s,p.h,p.c].forEach((n,i)=>v.setUint32(i*4,n,true));out.set(raw,32);return out;}
function d88(raw,p=F000,{reverse=false}={}){
  const trackBytes=p.s*(16+p.b),out=new Uint8Array(0x2B0+p.c*p.h*trackBytes),v=new DataView(out.buffer);out.set([83,72,73,78,79,0]);v.setUint32(0x1C,out.length,true);
  for(let t=0;t<p.c*p.h;t++){
    let pos=0x2B0+t*trackBytes;v.setUint32(0x20+t*4,pos,true);
    for(let i=0;i<p.s;i++){const r=reverse?p.s-i:i+1;out.set([Math.floor(t/p.h),t%p.h,r,Math.log2(p.b/128)],pos);v.setUint16(pos+4,p.s,true);v.setUint16(pos+14,p.b,true);out.set(raw.slice((t*p.s+r-1)*p.b,(t*p.s+r)*p.b),pos+16);pos+=16+p.b;}
  }return out;
}
function dcp(raw,p=F001,{type=5,present=null,full=false}={}){
  const total=p.c*p.h,flags=present||Array.from({length:total},()=>1),chunks=[];
  for(let i=0;i<total;i++)if(full||flags[i])chunks.push(raw.slice(i*p.s*p.b,(i+1)*p.s*p.b));
  const out=new Uint8Array(162+chunks.reduce((n,c)=>n+c.length,0));out[0]=type;out.set(flags,1);out[1+total]=1;let pos=162;for(const c of chunks){out.set(c,pos);pos+=c.length;}return out;
}
module.exports={F000,F001,foreign,fdi,d88,dcp};
