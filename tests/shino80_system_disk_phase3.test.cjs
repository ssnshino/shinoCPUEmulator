'use strict';

const assert=require('node:assert/strict');
const {Shino80Memory,MEMORY_CONTROL_LOW_RAM}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Shino80Keyboard}=require('../src/devices/shino80/shino80-keyboard.js');
const {Shino80BlockDevice}=require('../src/devices/shino80/shino80-block-device.js');
const profiles=require('../src/devices/shino80/shino80-media-profiles.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {buildCbiosV3,CBIOS3_ORG,CBIOS3_DEBLOCK_B}=require('../src/firmware/shino80/shino80-cbios.js');
const {buildSystemDiskV3}=require('../src/firmware/shino80/shino80-system-disk.js');
const {readDirectoryForProfile}=require('../src/firmware/shino80/shino80-cpm-filesystem.js');
const {buildSystemRom,TEXT_VRAM_BASE}=require('../src/firmware/shino80/shino80-system-rom.js');
const {S80B_V3_HEADER}=require('./fixtures/shino80_phase3_contract_fixtures.cjs');

const diskImage=buildSystemDiskV3(),cbios=buildCbiosV3(),rom=buildSystemRom();
assert.equal(diskImage.image.length,1261568);assert.deepEqual(diskImage.header,S80B_V3_HEADER);
assert.deepEqual(diskImage.image.slice(0x40,0xC0),diskImage.payload);
assert.deepEqual(diskImage.image.slice(0x100,0xA00),cbios.bytes);
assert.deepEqual(readDirectoryForProfile(diskImage.image,profiles.MEDIA_PROFILE_2HD_JP).map(file=>file.name),['WELCOME.TXT','HELLO.COM','S80INFO.COM']);

function machine(image=diskImage.image,imageB=null,profileB=null){
  const keyboard=new Shino80Keyboard({capacity:256}),disk=new Shino80BlockDevice();disk.mountImage(image,{drive:0,profileId:profiles.MEDIA_PROFILE_2HD_JP});
  if(imageB)disk.mountImage(imageB,{drive:1,profileId:profileB});
  const memory=new Shino80Memory();memory.loadFirmware(rom.bytes);const bus=new Shino80Bus({traceLimit:400000,memoryDevice:memory,ioDevices:[keyboard,disk]});
  const cpu=new Z80Core(bus);cpu.reset();return {keyboard,disk,memory,bus,cpu};
}

// WBOOT always reloads the v3 system from A: while retaining a mixed-profile
// B: selection in Page Zero and rediscovering B:'s own DPB afterward.
{
  const b=profiles.createBlankMediaImage(profiles.MEDIA_PROFILE_2DD_720),m=machine(diskImage.image,b,profiles.MEDIA_PROFILE_2DD_720);boot(m);
  input(m,'B:\r');m.cpu.step();until(m,()=>m.cpu.state.pc===cbios.labels.CBIOS_CONIN_WAIT&&screen(m).includes('B>'));
  assert.equal(m.memory.ram[4]&0x0F,1);
  assert.deepEqual(Array.from(m.memory.ram.slice(0,3)),[0xC3,0x03,0xF4]);
  assert.deepEqual(Array.from(m.memory.ram.slice(0xF403,0xF406)),[0xC3,cbios.labels.CBIOS_WBOOT&255,cbios.labels.CBIOS_WBOOT>>8]);
  m.memory.ram.fill(0xFF,0x9400,0xAA00);Object.assign(m.cpu.state,{pc:0,sp:0xF000,halted:false});
  m.cpu.step();assert.equal(m.cpu.state.pc,0xF403);m.cpu.step();assert.equal(m.cpu.state.pc,cbios.labels.CBIOS_WBOOT);
  until(m,()=>m.cpu.state.pc===cbios.labels.CBIOS_CONIN_WAIT);
  assert.equal(m.memory.ram[4],1);assert.equal(m.memory.ram[CBIOS3_DEBLOCK_B],profiles.MEDIA_PROFILE_2DD_720);
  assert.deepEqual(m.memory.ram.slice(0x9400,0x9440),diskImage.cpm.ccp.slice(0,0x40));
}
function screen(m){return String.fromCharCode(...m.memory.ram.slice(TEXT_VRAM_BASE,TEXT_VRAM_BASE+2000)).replaceAll('\0',' ');}
function until(m,predicate,limit=15000000){let count=0;while(!predicate()&&count++<limit)m.cpu.step();assert(count<limit,`v3 boot timeout PC=${m.cpu.state.pc.toString(16)}`);}
function boot(m){until(m,()=>m.cpu.state.pc===cbios.labels.CBIOS_CONIN_WAIT&&screen(m).includes('A>'));}
function input(m,text){for(const char of text)m.keyboard.enqueueByte(char.charCodeAt(0));}

{
  const m=machine();boot(m);assert.equal(m.memory.control,MEMORY_CONTROL_LOW_RAM);
  assert.deepEqual(m.memory.ram.slice(CBIOS3_ORG,cbios.executableEnd),cbios.bytes.slice(0,cbios.executableEnd-CBIOS3_ORG));
  assert.deepEqual(Array.from(m.memory.ram.slice(0,8)),[0xC3,0x03,0xF4,0,0,0xC3,0x06,0x9C]);
  input(m,'DIR\r');m.cpu.step();until(m,()=>screen(m).includes('WELCOME')&&(screen(m).match(/A>/g)||[]).length>=2);
  assert.match(screen(m),/WELCOME\s+TXT/);
  assert.equal(m.disk.mediaProfileIdAt(0),profiles.MEDIA_PROFILE_2HD_JP);
  assert(m.bus.trace.some(event=>event.space==='IO'&&event.operation==='READ'&&(event.address&255)===0x35));
}

{
  const corrupt=new Uint8Array(diskImage.image);corrupt[0x3F]^=1;const m=machine(corrupt);
  until(m,()=>m.cpu.state.pc===rom.labels.MONITOR_LOOP,100000);assert.equal(m.memory.control,0);assert(screen(m).includes('MON'));
}

console.log('SHINO-80 PHASE 3 CHECKPOINT D: S80B v3 ROM BOOT + CP/M PASS');
