'use strict';

const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {Shino80Memory,MEMORY_CONTROL_LOW_RAM}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Shino80Keyboard}=require('../src/devices/shino80/shino80-keyboard.js');
const {Shino80BlockDevice,BLOCK_SECTOR_SIZE,BLOCK_SECTORS_PER_TRACK,BLOCK_BLANK_BYTE}=require('../src/devices/shino80/shino80-block-device.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {buildCbios,CBIOS_ORG}=require('../src/firmware/shino80/shino80-cbios.js');
const {buildCpm22,CPM22_CCP_ORIGIN,CPM22_BDOS_ORIGIN,CPM22_BDOS_ENTRY,CPM22_CCP_SHA256,CPM22_BDOS_SHA256}=require('../src/firmware/shino80/shino80-cpm22.js');
const {buildSystemDisk,SYSTEM_DISK_MAGIC,SYSTEM_DISK_VERSION,SYSTEM_ENTRY,SYSTEM_CPM_TRACK,SYSTEM_CPM_SECTOR,SYSTEM_CPM_SECTORS,mediaOffset}=require('../src/firmware/shino80/shino80-system-disk.js');
const {buildSystemRom,TEXT_VRAM_BASE}=require('../src/firmware/shino80/shino80-system-rom.js');

const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const cpm=buildCpm22(),systemDisk=buildSystemDisk(),cbios=buildCbios(),rom=buildSystemRom();
assert.equal(sha256(cpm.ccp),CPM22_CCP_SHA256);assert.equal(sha256(cpm.bdos),CPM22_BDOS_SHA256);
assert.equal(cpm.ccp.length,0x800);assert.equal(cpm.bdos.length,0xE00);
assert.equal(systemDisk.meta.magic,SYSTEM_DISK_MAGIC);assert.equal(SYSTEM_DISK_VERSION,2);
assert.equal(SYSTEM_CPM_SECTORS,44);assert(systemDisk.payload.length<=BLOCK_SECTOR_SIZE);
const cpmOffset=mediaOffset(SYSTEM_CPM_TRACK,SYSTEM_CPM_SECTOR);
assert.deepEqual(systemDisk.image.slice(cpmOffset,cpmOffset+cpm.ccp.length),cpm.ccp);
assert.deepEqual(systemDisk.image.slice(cpmOffset+cpm.ccp.length,cpmOffset+cpm.ccp.length+cpm.bdos.length),cpm.bdos);
assert(systemDisk.image.slice(2*BLOCK_SECTORS_PER_TRACK*BLOCK_SECTOR_SIZE).every(byte=>byte===BLOCK_BLANK_BYTE));

function machine(image=systemDisk.image){
  const keyboard=new Shino80Keyboard({capacity:256}),disk=new Shino80BlockDevice({image});
  const memory=new Shino80Memory();memory.loadFirmware(rom.bytes);
  const bus=new Shino80Bus({traceLimit:150000,memoryDevice:memory,ioDevices:[keyboard,disk]});
  const cpu=new Z80Core(bus);cpu.reset();return {keyboard,disk,memory,bus,cpu};
}
function until(m,predicate,limit=1500000){let count=0;while(!predicate()&&count++<limit)m.cpu.step();assert(count<limit,`CP/M timeout PC=${m.cpu.state.pc.toString(16)}`);return count;}
function input(m,text){for(const char of text)m.keyboard.enqueueByte(char.charCodeAt(0));}
function screen(m){return String.fromCharCode(...m.memory.ram.slice(TEXT_VRAM_BASE,TEXT_VRAM_BASE+2000)).replaceAll('\0',' ');}
function boot(m){m.cpu.runInstructions(rom.meta.instructionsBeforeLoop);input(m,'O\r');until(m,()=>m.cpu.state.pc===cbios.labels.CBIOS_CONIN_WAIT&&screen(m).includes('A>'));}

// Cold boot traverses ROM loader + 44 real CBIOS reads and enters an empty A:.
{
  const m=machine();boot(m);
  assert.equal(m.memory.control,MEMORY_CONTROL_LOW_RAM);
  assert.deepEqual(Array.from(m.memory.ram.slice(0,8)),[0xC3,0x03,0xFA,0,0,0xC3,0x06,0x9C]);
  assert.deepEqual(m.memory.ram.slice(CPM22_CCP_ORIGIN,CPM22_CCP_ORIGIN+64),cpm.ccp.slice(0,64));
  assert.deepEqual(m.memory.ram.slice(CPM22_BDOS_ORIGIN,CPM22_BDOS_ORIGIN+64),cpm.bdos.slice(0,64));
  assert.deepEqual(m.memory.ram.slice(CBIOS_ORG,CBIOS_ORG+64),cbios.bytes.slice(0,64));
  assert.match(screen(m),/^\s*A>/);
  input(m,'DIR\r');m.cpu.step();until(m,()=>screen(m).includes('NO FILE')&&(screen(m).match(/A>/g)||[]).length>=2);
  assert.match(screen(m),/A>DIR\s+NO FILE\s+A>/);
  const commands=m.bus.trace.filter(event=>event.space==='IO'&&event.operation==='WRITE'&&(event.address&255)===0x31&&event.data===1);
  assert(commands.length>=51); // header/payload/CBIOS + CCP/BDOS + directory access
  assert(!m.bus.trace.some(event=>event.meta?.memorySource==='BOOT_ROM'&&event.purpose==='OPCODE_FETCH'&&event.address>=SYSTEM_ENTRY));
}

// Public page-zero BDOS vector reports CP/M 2.2 (function 12 => HL=0022h).
{
  const m=machine();boot(m);m.memory.ram.set([0x0E,0x0C,0xCD,0x05,0x00,0x76],0x0100);
  Object.assign(m.cpu.state,{pc:0x0100,halted:false});until(m,()=>m.cpu.state.halted,100000);
  assert.equal(m.cpu.state.h,0x00);assert.equal(m.cpu.state.l,0x22);
  assert.equal(m.bus.debugPeek(0x0005),0xC3);assert.equal(m.bus.debugPeek(0x0006)|m.bus.debugPeek(0x0007)<<8,CPM22_BDOS_ENTRY);
}

// WBOOT restores destroyed loader, CCP and BDOS from mounted system tracks.
{
  const m=machine();boot(m);
  m.memory.ram.fill(0xFF,SYSTEM_ENTRY,SYSTEM_ENTRY+systemDisk.payload.length);
  m.memory.ram.fill(0xFF,CPM22_CCP_ORIGIN,CPM22_BDOS_ORIGIN+cpm.bdos.length);
  m.bus.clearTrace();Object.assign(m.cpu.state,{pc:0,halted:false});
  until(m,()=>m.cpu.state.pc===cbios.labels.CBIOS_CONIN_WAIT&&screen(m).includes('A>'));
  assert.deepEqual(m.memory.ram.slice(SYSTEM_ENTRY,SYSTEM_ENTRY+systemDisk.payload.length),systemDisk.payload);
  assert.deepEqual(m.memory.ram.slice(CPM22_CCP_ORIGIN,CPM22_CCP_ORIGIN+64),cpm.ccp.slice(0,64));
  assert.deepEqual(m.memory.ram.slice(CPM22_BDOS_ORIGIN,CPM22_BDOS_ORIGIN+64),cpm.bdos.slice(0,64));
  const commands=m.bus.trace.filter(event=>event.space==='IO'&&event.operation==='WRITE'&&(event.address&255)===0x31&&event.data===1);
  assert(commands.length>=45);
  assert(!m.bus.trace.some(event=>event.meta?.memorySource==='BOOT_ROM'||event.meta?.memorySource==='EXTENSION_ROM'));
}

console.log('SHINO-80 CP/M 2.2 BOOT v0.1: LICENSED 44K CCP/BDOS + COLD/WARM BOOT PASS');
