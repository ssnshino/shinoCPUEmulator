'use strict';

const assert=require('node:assert/strict');
const {Shino80Memory,MEMORY_CONTROL_LOW_RAM}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Shino80Keyboard}=require('../src/devices/shino80/shino80-keyboard.js');
const {Shino80BlockDevice,BLOCK_SECTOR_SIZE,BLOCK_BLANK_BYTE}=require('../src/devices/shino80/shino80-block-device.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {buildCbios}=require('../src/firmware/shino80/shino80-cbios.js');
const {
  buildSystemDisk,SYSTEM_DISK_MAGIC,SYSTEM_DISK_VERSION,SYSTEM_HEADER_SECTOR,
  SYSTEM_PAYLOAD_SECTOR,SYSTEM_CBIOS_SECTOR,SYSTEM_CBIOS_SECTORS,SYSTEM_ENTRY
}=require('../src/firmware/shino80/shino80-system-disk.js');
const {CPM22_CCP_ORIGIN,CPM22_BDOS_ORIGIN}=require('../src/firmware/shino80/shino80-cpm22.js');
const {buildSystemRom,TEXT_VRAM_BASE,TEXT_COLS,RAM_HANDOFF_TRAMPOLINE}=require('../src/firmware/shino80/shino80-system-rom.js');

const systemDisk=buildSystemDisk(),cbios=buildCbios(),rom=buildSystemRom();
const offset=sector=>(sector-1)*BLOCK_SECTOR_SIZE;

assert.equal(String.fromCharCode(...systemDisk.header.slice(0,4)),SYSTEM_DISK_MAGIC);
assert.equal(systemDisk.header[4],SYSTEM_DISK_VERSION);
assert.equal(systemDisk.header[5],SYSTEM_PAYLOAD_SECTOR);
assert.equal(systemDisk.header[6],SYSTEM_CBIOS_SECTOR);
assert.equal(systemDisk.header[7],SYSTEM_CBIOS_SECTORS);
assert.equal(systemDisk.header[8]|(systemDisk.header[9]<<8),SYSTEM_ENTRY);
assert.equal(systemDisk.header[10]|(systemDisk.header[11]<<8),cbios.origin);
assert.equal(systemDisk.header[12]|(systemDisk.header[13]<<8),systemDisk.payload.length);
assert.equal(systemDisk.header[14]|(systemDisk.header[15]<<8),cbios.bytes.length);
assert.equal(systemDisk.header[16],systemDisk.header.slice(0,16).reduce((sum,value)=>(sum+value)&255,0));
assert.deepEqual(systemDisk.image.slice(offset(SYSTEM_PAYLOAD_SECTOR),offset(SYSTEM_PAYLOAD_SECTOR)+systemDisk.payload.length),systemDisk.payload);
assert.deepEqual(systemDisk.image.slice(offset(SYSTEM_CBIOS_SECTOR),offset(SYSTEM_CBIOS_SECTOR)+cbios.bytes.length),cbios.bytes);
assert(systemDisk.image.slice(offset(SYSTEM_CBIOS_SECTOR)+cbios.bytes.length,offset(SYSTEM_CBIOS_SECTOR)+SYSTEM_CBIOS_SECTORS*128).every(byte=>byte===BLOCK_BLANK_BYTE));

function machine(image=systemDisk.image,traceLimit=150000){
  const keyboard=new Shino80Keyboard({capacity:256}),disk=new Shino80BlockDevice({image});
  const memory=new Shino80Memory();memory.loadFirmware(rom.bytes);
  const bus=new Shino80Bus({traceLimit,memoryDevice:memory,ioDevices:[keyboard,disk]});
  const cpu=new Z80Core(bus);cpu.reset();return {keyboard,disk,memory,bus,cpu};
}
function until(cpu,predicate,limit=800000){let count=0;while(!predicate()&&count++<limit)cpu.step();assert(count<limit,'system disk loader timeout');return count;}
function bootMonitor(m){m.cpu.runInstructions(rom.meta.instructionsBeforeLoop);assert.equal(m.cpu.state.pc,rom.labels.MONITOR_LOOP);}
function command(m,text){for(const char of text+'\r')m.keyboard.enqueueByte(char.charCodeAt(0));}
function screen(m,row=0,length=80){return String.fromCharCode(...Array.from({length},(_,index)=>m.bus.debugPeek(TEXT_VRAM_BASE+row*TEXT_COLS+index)));}

// Missing media and corrupt headers fail visibly before page zero or mapping is changed.
{
  const m=machine();bootMonitor(m);m.disk.eject();command(m,'O');m.cpu.step();until(m.cpu,()=>m.cpu.state.pc===rom.labels.MONITOR_LOOP);
  assert.equal(m.memory.control,0);assert.equal(m.bus.debugPeekRam(0),0);
  assert(Array.from({length:25},(_,row)=>screen(m,row)).join('').includes('DISK BOOT ERROR'));
}
for(const headerOffset of [0,16]){
  const corrupt=new Uint8Array(systemDisk.image);corrupt[offset(SYSTEM_HEADER_SECTOR)+headerOffset]^=0xFF;
  const m=machine(corrupt);bootMonitor(m);command(m,'O');m.cpu.step();until(m.cpu,()=>m.cpu.state.pc===rom.labels.MONITOR_LOOP);
  assert.equal(m.memory.control,0);assert.equal(m.bus.debugPeekRam(0),0);
  assert(Array.from({length:25},(_,row)=>screen(m,row)).join('').includes('DISK BOOT ERROR'));
}

// MON O performs seven ROM reads, pages ROM out, then the loaded original
// payload reads the 44 CP/M sectors through CBIOS and reaches the CCP prompt.
{
  const m=machine();bootMonitor(m);m.bus.clearTrace();command(m,'O');
  until(m.cpu,()=>m.cpu.state.pc===SYSTEM_ENTRY);
  assert.equal(m.memory.control,MEMORY_CONTROL_LOW_RAM);
  assert.deepEqual(Array.from(m.memory.ram.slice(0,3)),[0xC3,0x03,0xFA]);
  assert.deepEqual(m.memory.ram.slice(cbios.origin,cbios.origin+cbios.bytes.length),cbios.bytes);
  assert.deepEqual(m.memory.ram.slice(SYSTEM_ENTRY,SYSTEM_ENTRY+systemDisk.payload.length),systemDisk.payload);

  until(m.cpu,()=>m.cpu.state.pc===cbios.labels.CBIOS_CONIN_WAIT&&Array.from({length:25},(_,row)=>screen(m,row)).join('').includes('A>'),1500000);
  assert.equal(m.memory.ram[CPM22_CCP_ORIGIN],systemDisk.cpm.ccp[0]);
  assert.equal(m.memory.ram[CPM22_BDOS_ORIGIN],systemDisk.cpm.bdos[0]);

  const diskEvents=m.bus.trace.filter(event=>event.space==='IO'&&event.meta.device===m.disk.id);
  assert(diskEvents.filter(event=>event.operation==='WRITE'&&(event.address&255)===0x31&&event.data===1).length>=51);
  assert(diskEvents.filter(event=>event.operation==='READ'&&(event.address&255)===0x35).length>=51*128);
  const pageout=m.bus.trace.findIndex(event=>event.space==='IO'&&(event.address&255)===0&&event.data===1);
  assert(pageout>=0);
  const after=m.bus.trace.slice(pageout+1),fetches=after.filter(event=>event.purpose==='OPCODE_FETCH');
  assert.equal(fetches[0].address,RAM_HANDOFF_TRAMPOLINE+2);assert.equal(fetches[0].meta.memorySource,'RAM');
  assert(fetches.some(event=>event.address===SYSTEM_ENTRY&&event.meta.memorySource==='RAM'));
  assert(!after.some(event=>event.meta?.memorySource==='BOOT_ROM'||event.meta?.memorySource==='EXTENSION_ROM'));

  m.bus.resetIoDevices();m.cpu.reset();m.cpu.runInstructions(rom.meta.instructionsBeforeLoop);
  assert.equal(m.memory.control,0);assert.equal(m.cpu.state.pc,rom.labels.MONITOR_LOOP);
  assert.equal(m.disk.mounted,true);assert.equal(String.fromCharCode(...m.disk.exportImage().slice(0,4)),SYSTEM_DISK_MAGIC);
}

console.log('SHINO-80 SYSTEM DISK / MON O LOADER v0.2: CP/M MULTI-SECTOR ALL-RAM BOOT PASS');
