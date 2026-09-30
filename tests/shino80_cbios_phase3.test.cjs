'use strict';

const assert=require('node:assert/strict');
const {Shino80Memory,MEMORY_CONTROL_LOW_RAM}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Shino80BlockDevice}=require('../src/devices/shino80/shino80-block-device.js');
const profiles=require('../src/devices/shino80/shino80-media-profiles.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const cbiosModule=require('../src/firmware/shino80/shino80-cbios.js');

const cbios=cbiosModule.buildCbiosV3(),lo=value=>value&255,hi=value=>(value>>8)&255;
const call=address=>[0xCD,lo(address),hi(address)],word=(opcode,value)=>[opcode,lo(value),hi(value)];
const api=name=>cbios.labels[`CBIOS_API_${name}`];
const wordAt=(bytes,address)=>bytes[address-cbios.origin]|(bytes[address-cbios.origin+1]<<8);

assert.equal(cbios.origin,0xF400);assert.equal(cbios.bytes.length,0x0900);
assert(cbios.executableEnd<=0xFA80);assert.equal(cbios.end,0xFD00);
for(const [index,name] of cbiosModule.CBIOS_ENTRY_NAMES.entries()){
  const address=cbios.origin+index*3,target=cbios.labels[`CBIOS_${name}`];
  assert.equal(api(name),address);assert.deepEqual(Array.from(cbios.bytes.slice(address-cbios.origin,address-cbios.origin+3)),[0xC3,lo(target),hi(target)]);
}
for(const [index,dpb] of cbiosModule.DPB_PROFILES.entries()){
  const address=cbiosModule.CBIOS3_DPB_BASE+index*16;
  assert.deepEqual(Array.from(cbios.bytes.slice(address-cbios.origin,address-cbios.origin+15)),[
    lo(dpb.spt),hi(dpb.spt),dpb.bsh,dpb.blm,dpb.exm,lo(dpb.dsm),hi(dpb.dsm),lo(dpb.drm),hi(dpb.drm),dpb.al0,dpb.al1,lo(dpb.cks),hi(dpb.cks),lo(dpb.off),hi(dpb.off)
  ]);
}
assert.equal(wordAt(cbios.bytes,cbiosModule.CBIOS3_DPH_A+8),cbiosModule.CBIOS_DIRBUF);
assert.equal(wordAt(cbios.bytes,cbiosModule.CBIOS3_DPH_B+8),cbiosModule.CBIOS_DIRBUF);

function machine(profileA,profileB=null){
  const disk=new Shino80BlockDevice({image:profiles.createBlankMediaImage(profileA)});
  if(profileB!==null)disk.mountImage(profiles.createBlankMediaImage(profileB),{drive:1});
  const memory=new Shino80Memory(),bus=new Shino80Bus({traceLimit:40000,memoryDevice:memory,ioDevices:[disk]});
  bus.load(cbios.bytes,cbios.origin);bus.cpuIoWrite(0,MEMORY_CONTROL_LOW_RAM,{purpose:'TEST_ALL_RAM'});
  const cpu=new Z80Core(bus);cpu.reset();return {disk,memory,bus,cpu};
}
function run(m,bytes,address=0x7000,limit=500000){
  m.bus.load(bytes,address);Object.assign(m.cpu.state,{pc:address,sp:0xE700,halted:false});let count=0;
  while(!m.cpu.state.halted&&count++<limit)m.cpu.step();assert(count<limit,`CBIOS v3 timeout PC=${m.cpu.state.pc.toString(16)}`);
}
function logicalIo(m,{drive,track,sector,dma,write=false,result=0xE200}){
  run(m,[0x0E,drive,...call(api('SELDSK')),...word(0x01,track),...call(api('SETTRK')),...word(0x01,sector),...call(api('SETSEC')),...word(0x01,dma),...call(api('SETDMA')),0x0E,0,...call(api(write?'WRITE':'READ')),...word(0x32,result),0x76]);
  return m.bus.debugPeek(result);
}
const pattern=(seed,length=128)=>Uint8Array.from({length},(_,index)=>(seed+index*37)&255);

// SELDSK discovers each drive through Bus-visible 32h/38h I/O and rewrites the
// selected DPH pointer to the frozen per-profile DPB slot.
{
  const m=machine(profiles.MEDIA_PROFILE_2HD_JP,profiles.MEDIA_PROFILE_2DD_720);m.bus.clearTrace();
  run(m,[...call(api('BOOT')),0x0E,0,...call(api('SELDSK')),...word(0x22,0xE200),0x0E,1,...call(api('SELDSK')),...word(0x22,0xE202),0x0E,2,...call(api('SELDSK')),...word(0x22,0xE204),0x76]);
  assert.equal(m.bus.debugPeek(0xE200)|(m.bus.debugPeek(0xE201)<<8),cbiosModule.CBIOS3_DPH_A);
  assert.equal(m.bus.debugPeek(0xE202)|(m.bus.debugPeek(0xE203)<<8),cbiosModule.CBIOS3_DPH_B);
  assert.equal(m.bus.debugPeek(0xE204)|(m.bus.debugPeek(0xE205)<<8),0);
  assert.equal(m.bus.debugPeek(cbiosModule.CBIOS3_DEBLOCK_A),profiles.MEDIA_PROFILE_2HD_JP);
  assert.equal(m.bus.debugPeek(cbiosModule.CBIOS3_DEBLOCK_B),profiles.MEDIA_PROFILE_2DD_720);
  assert.equal(m.bus.debugPeek(cbiosModule.CBIOS3_DPH_A+10)|(m.bus.debugPeek(cbiosModule.CBIOS3_DPH_A+11)<<8),cbiosModule.CBIOS3_DPB_BASE+16);
  assert.equal(m.bus.debugPeek(cbiosModule.CBIOS3_DPH_B+10)|(m.bus.debugPeek(cbiosModule.CBIOS3_DPH_B+11)<<8),cbiosModule.CBIOS3_DPB_BASE+32);
  const ports=m.bus.trace.filter(event=>event.space==='IO').map(event=>event.address&255);
  assert(ports.includes(0x32));assert(ports.includes(0x38));
}

// No media is a real SELDSK failure.
{
  const m=machine(profiles.MEDIA_PROFILE_CLASSIC,null);
  run(m,[...call(api('BOOT')),0x0E,1,...call(api('SELDSK')),...word(0x22,0xE200),0x76]);
  assert.equal(m.bus.debugPeek(0xE200)|(m.bus.debugPeek(0xE201)<<8),0);
}

// Every native profile maps logical records to physical C/H/S correctly.
for(const profile of profiles.MEDIA_PROFILES){
  const m=machine(profile.id),target=pattern(0x20+profile.id),neighbor=pattern(0xA0+profile.id);
  const logicalTrack=profile.heads===1?3:5,logicalSector=Math.min(profile.logicalSectorsPerTrack,profile.physicalSectorSize===128?7:6);
  const ratio=profile.physicalSectorSize/128,record=logicalSector-1,physicalSector=Math.floor(record/ratio)+1,recordOffset=(record%ratio)*128;
  const cylinder=Math.floor(logicalTrack/profile.heads),head=logicalTrack%profile.heads;
  const physicalOffset=(((cylinder*profile.heads)+head)*profile.physicalSectorsPerTrack+(physicalSector-1))*profile.physicalSectorSize;
  const image=m.disk.exportImage();if(profile.physicalSectorSize>128)image.set(neighbor,physicalOffset+((recordOffset+128)%profile.physicalSectorSize));m.disk.mountImage(image);
  m.bus.load(target,0x4200);assert.equal(logicalIo(m,{drive:0,track:logicalTrack,sector:logicalSector,dma:0x4200,write:true}),0,`${profile.name} controller=${m.disk.error} C/H/S=${m.disk.track}/${m.disk.head}/${m.disk.sector}`);
  m.memory.ram.fill(0,0x4300,0x4380);assert.equal(logicalIo(m,{drive:0,track:logicalTrack,sector:logicalSector,dma:0x4300}),0,profile.name);
  assert.deepEqual(m.memory.ram.slice(0x4300,0x4380),target,profile.name);
  const after=m.disk.exportImage();assert.deepEqual(after.slice(physicalOffset+recordOffset,physicalOffset+recordOffset+128),target,profile.name);
  if(profile.physicalSectorSize>128)assert.deepEqual(after.slice(physicalOffset+((recordOffset+128)%profile.physicalSectorSize),physicalOffset+((recordOffset+128)%profile.physicalSectorSize)+128),neighbor,`${profile.name} adjacent record`);
}

console.log('SHINO-80 PHASE 3 CHECKPOINT C: PROFILE-AWARE CBIOS + SAFE RMW PASS');
