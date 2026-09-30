'use strict';
const assert=require('node:assert/strict');
const {Shino80Memory}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Shino80Keyboard}=require('../src/devices/shino80/shino80-keyboard.js');
const {Shino80BlockDevice,createBlankBlockImage}=require('../src/devices/shino80/shino80-block-device.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {buildSystemDisk,buildSystemDiskV3}=require('../src/firmware/shino80/shino80-system-disk.js');
const {buildSystemRom}=require('../src/firmware/shino80/shino80-system-rom.js');
const {buildCbios,buildCbiosV3}=require('../src/firmware/shino80/shino80-cbios.js');
const fs=require('../src/firmware/shino80/shino80-cpm-filesystem.js');
const wait=buildCbios().labels.CBIOS_CONIN_WAIT;
const FCB=0x6900,DMA=0x6800;
function until(m,predicate,limit=8000000){let i=0;while(!predicate()&&i++<limit)m.cpu.step();assert(i<limit,`Timeout PC=${m.cpu.state.pc.toString(16)}`);}
function machine(files=[],nativeB=null){
  const keyboard=new Shino80Keyboard({capacity:512}),disk=new Shino80BlockDevice();
  disk.mountImage(nativeB?buildSystemDiskV3().image:buildSystemDisk().image,{drive:0,profileId:nativeB?1:0});
  disk.mountImage(nativeB?nativeB.bytes:fs.buildFilesystem(createBlankBlockImage(),files).image,{drive:1,profileId:nativeB?nativeB.profileId:0});
  const memory=new Shino80Memory();memory.loadFirmware(buildSystemRom().bytes);
  const bus=new Shino80Bus({traceLimit:0,memoryDevice:memory,ioDevices:[keyboard,disk]}),cpu=new Z80Core(bus);cpu.reset();const m={keyboard,disk,memory,bus,cpu};until(m,()=>cpu.state.pc===(nativeB?buildCbiosV3().labels.CBIOS_CONIN_WAIT:wait));return m;
}
// Repository-original transient COM instructions. All calls execute CALL 0005
// through the actual Z80/BDOS/CBIOS/Bus/controller, never a host filesystem mock.
function call(m,fn,de=0){
  const com=Uint8Array.from([0x0E,fn,0x11,de&255,de>>8,0xCD,5,0,0x76]);m.memory.ram.set(com,0x100);
  Object.assign(m.cpu.state,{pc:0x100,sp:0x9000,halted:false});until(m,()=>m.cpu.state.halted);assert.equal(m.cpu.state.sp,0x9000,'CALL/RET stack balanced');return m.cpu.state.a;
}
function fcb(m,name,drive=2){
  const bytes=new Uint8Array(36);bytes[0]=drive;bytes.fill(32,1,12);const [n,e='']=name.split('.');for(let i=0;i<n.length;i++)bytes[1+i]=n.charCodeAt(i);for(let i=0;i<e.length;i++)bytes[9+i]=e.charCodeAt(i);m.memory.ram.set(bytes,FCB);return FCB;
}
const ok=value=>assert(value<=3,`BDOS expected success, got ${value}`);
{
  const m=machine();m.keyboard.enqueueByte(75);assert.notEqual(call(m,0x0B),0);assert.equal(call(m,1),75);assert.equal(call(m,0x0B),0);
  call(m,2,65);m.memory.ram.set([72,73,36],0x6700);call(m,9,0x6700);assert(String.fromCharCode(...m.memory.ram.slice(0xC000,0xC7D0)).includes('KAHI'));
  m.keyboard.enqueueByte(90);assert.equal(call(m,6,0xFF),90);assert.equal(call(m,6,0xFF),0);call(m,6,66);
  assert.equal(call(m,25),0);call(m,14,1);assert.equal(call(m,25),1);call(m,13);assert.equal(call(m,25),0);
  for(const user of [0,1,15]){call(m,32,user);assert.equal(call(m,32,255),user);}
}
for(const records of [0,1,127,128,129]){
  const m=machine();call(m,14,1);call(m,26,DMA);fcb(m,'TEST.BIN');ok(call(m,22,FCB));
  for(let i=0;i<records;i++){m.memory.ram.fill(i&255,DMA,DMA+128);assert.equal(call(m,21,FCB),0);}
  ok(call(m,16,FCB));fcb(m,'TEST.BIN');ok(call(m,15,FCB));
  for(let i=0;i<records;i++){assert.equal(call(m,20,FCB),0);assert(m.memory.ram.slice(DMA,DMA+128).every(v=>v===(i&255)),`record ${i}`);}
  assert.equal(call(m,20,FCB),1,'EOF');ok(call(m,16,FCB));
  const entries=fs.readDirectory(m.disk.exportImage({drive:1})).filter(e=>e.name==='TEST.BIN');assert.equal(entries.reduce((n,e)=>n+e.records,0),records);
  ok(call(m,19,FCB));assert(!fs.readDirectory(m.disk.exportImage({drive:1})).some(e=>e.name==='TEST.BIN'));
  fcb(m,'REUSED.BIN');ok(call(m,22,FCB));m.memory.ram.fill(0x5A,DMA,DMA+128);assert.equal(call(m,21,FCB),0);ok(call(m,16,FCB));assert.equal(fs.readDirectory(m.disk.exportImage({drive:1})).find(e=>e.name==='REUSED.BIN').blocks[0],2,'Deleted allocation reused');
}
{
  const m=machine();call(m,14,1);call(m,26,DMA);
  for(const user of [0,1,15]){
    call(m,32,user);fcb(m,'SAME.BIN');ok(call(m,22,FCB));m.memory.ram.fill(user,DMA,DMA+128);assert.equal(call(m,21,FCB),0);ok(call(m,16,FCB));
  }
  for(const user of [0,1,15]){call(m,32,user);fcb(m,'SAME.BIN');ok(call(m,15,FCB));assert.equal(call(m,20,FCB),0);assert.equal(m.memory.ram[DMA],user);}
  call(m,32,0);fcb(m,'SAME.BIN',1);ok(call(m,22,FCB));m.memory.ram.fill(0xA0,DMA,DMA+128);assert.equal(call(m,21,FCB),0);ok(call(m,16,FCB));
  fcb(m,'SAME.BIN',2);ok(call(m,15,FCB));assert.equal(call(m,20,FCB),0);assert.equal(m.memory.ram[DMA],0);
  fcb(m,'RANDOM.BIN');ok(call(m,22,FCB));m.memory.ram[FCB+33]=1;m.memory.ram.fill(0xB6,DMA,DMA+128);assert.equal(call(m,34,FCB),0);ok(call(m,16,FCB));
  fcb(m,'RANDOM.BIN');ok(call(m,15,FCB));m.memory.ram[FCB+33]=1;assert.equal(call(m,33,FCB),0);assert(m.memory.ram.slice(DMA,DMA+128).every(v=>v===0xB6));
  fcb(m,'RANDOM.BIN');const rename=new Uint8Array(16);rename[0]=2;rename.fill(32,1,12);rename.set([82,69,78,65,77,69,68],1);rename.set([66,73,78],9);m.memory.ram.set(rename,FCB+16);ok(call(m,23,FCB));
  fcb(m,'????????.???');ok(call(m,17,FCB));ok(call(m,18,FCB));assert.equal(call(m,18,FCB),255);
  assert(fs.readDirectory(m.disk.exportImage({drive:1})).some(e=>e.name==='RENAMED.BIN'));
}
{
  const fullDir=Array.from({length:64},(_,i)=>({name:`F${i}.BIN`,bytes:[],user:0})),m=machine(fullDir);call(m,14,1);fcb(m,'EXTRA.BIN');assert.equal(call(m,22,FCB),255,'directory full');
  const full=machine([{name:'FULL.BIN',bytes:new Uint8Array(241*1024),padding:0}]);call(full,14,1);call(full,26,DMA);fcb(full,'EXTRA.BIN');ok(call(full,22,FCB));assert.equal(call(full,21,FCB),2,'disk full');
}
// Real CCP loading of an original COM and its RET-to-CCP/WBOOT entry contracts.
{
  const com=Uint8Array.from([0x0E,9,0x11,9,1,0xCD,5,0,0xC9,65,66,73,32,79,75,36]);
  const m=machine([{name:'ABI.COM',bytes:com}]);for(const char of 'B:\r')m.keyboard.enqueueByte(char.charCodeAt(0));m.cpu.step();until(m,()=>m.keyboard.depth===0&&m.cpu.state.pc===wait);
  for(const char of 'ABI\r')m.keyboard.enqueueByte(char.charCodeAt(0));m.cpu.step();until(m,()=>m.keyboard.depth===0&&m.cpu.state.pc===wait);
  assert(String.fromCharCode(...m.memory.ram.slice(0xC000,0xC7D0)).includes('ABI OK'));assert.equal(m.memory.ram[4]&15,1);
  Object.assign(m.cpu.state,{pc:0,halted:false});m.cpu.step();until(m,()=>m.cpu.state.pc===wait);assert.equal(m.memory.ram[4]&15,1,'WBOOT retains B');
}
console.log('PHASE 4 CPM COMPAT: COM ABI / CONSOLE / FCB / RANDOM / USER / EXTENTS / A-B / FULL / REUSE PASS');
// Independently generated F001 -> bridge -> all five native profiles -> actual
// guest BDOS reads every record across 128-record and physical-sector boundaries.
{
  const media=require('../src/host/shino80-foreign-media.js'),profiles=require('../src/devices/shino80/shino80-media-profiles.js');
  const {F001,foreign,fdi}=require('./fixtures/shino80_phase4_fixtures.cjs');
  const data=Uint8Array.from({length:1025*128},(_,i)=>(Math.floor(i/128)+i)%256),fixture=foreign(F001,[{name:'LARGE.BIN',user:0,bytes:data}]);
  const volume=media.readFilesystem(media.parse(fdi(fixture.raw,F001)).disks[0],'F001');
  for(const profile of profiles.MEDIA_PROFILES){
    const built=media.buildNative(volume.files,profile.id),m=machine([],built);call(m,14,1);call(m,26,DMA);fcb(m,'LARGE.BIN');ok(call(m,15,FCB));
    for(let i=0;i<129;i++){assert.equal(call(m,20,FCB),0,`profile ${profile.id} record ${i}`);assert.deepEqual(m.memory.ram.slice(DMA,DMA+128),data.slice(i*128,(i+1)*128));}
    for(const index of [511,1023,1024]){m.memory.ram[FCB+33]=index&255;m.memory.ram[FCB+34]=index>>8;assert.equal(call(m,33,FCB),0);assert.deepEqual(m.memory.ram.slice(DMA,DMA+128),data.slice(index*128,(index+1)*128));}
    console.log(`PHASE 4 CONVERTED -> GUEST profile ${profile.id}: 129 sequential + 1025-record multi-entry random boundary PASS`);
  }
}
