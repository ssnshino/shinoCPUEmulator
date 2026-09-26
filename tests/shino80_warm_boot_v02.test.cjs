'use strict';

const assert=require('node:assert/strict');
const {Shino80Memory,MEMORY_CONTROL_LOW_RAM}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Shino80Keyboard}=require('../src/devices/shino80/shino80-keyboard.js');
const {Shino80BlockDevice}=require('../src/devices/shino80/shino80-block-device.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {buildCbios,CBIOS_SYSTEM_ENTRY}=require('../src/firmware/shino80/shino80-cbios.js');
const {buildSystemDisk,SYSTEM_SIGNATURE,SYSTEM_MESSAGE}=require('../src/firmware/shino80/shino80-system-disk.js');
const {buildSystemRom,TEXT_VRAM_BASE,TEXT_COLS}=require('../src/firmware/shino80/shino80-system-rom.js');

const cbios=buildCbios(),systemDisk=buildSystemDisk(),rom=buildSystemRom();
function machine(){
  const keyboard=new Shino80Keyboard({capacity:256}),disk=new Shino80BlockDevice({image:systemDisk.image});
  const memory=new Shino80Memory();memory.loadFirmware(rom.bytes);
  const bus=new Shino80Bus({traceLimit:60000,memoryDevice:memory,ioDevices:[keyboard,disk]});
  const cpu=new Z80Core(bus);cpu.reset();return {keyboard,disk,memory,bus,cpu};
}
function until(cpu,predicate,limit=800000){let count=0;while(!predicate()&&count++<limit)cpu.step();assert(count<limit,'warm boot timeout');return count;}
function bootMonitor(m){m.cpu.runInstructions(rom.meta.instructionsBeforeLoop);assert.equal(m.cpu.state.pc,rom.labels.MONITOR_LOOP);}
function command(m,text){for(const char of text+'\r')m.keyboard.enqueueByte(char.charCodeAt(0));}
function screen(m,row=0,length=80){return String.fromCharCode(...Array.from({length},(_,index)=>m.bus.debugPeek(TEXT_VRAM_BASE+row*TEXT_COLS+index)));}
function coldBoot(m){bootMonitor(m);command(m,'O');until(m.cpu,()=>m.cpu.state.halted);assert.equal(m.memory.control,MEMORY_CONTROL_LOW_RAM);}

// Page zero enters CBIOS WBOOT. It must restore a destroyed system payload
// through the public sector-2 READ path and execute that restored RAM image.
{
  const m=machine();coldBoot(m);
  m.memory.ram.fill(0xFF,CBIOS_SYSTEM_ENTRY,CBIOS_SYSTEM_ENTRY+systemDisk.payload.length);
  m.memory.ram.fill(0,SYSTEM_SIGNATURE,SYSTEM_SIGNATURE+4);
  m.bus.clearTrace();Object.assign(m.cpu.state,{pc:0,halted:false});
  until(m.cpu,()=>m.cpu.state.halted);
  assert.deepEqual(m.memory.ram.slice(CBIOS_SYSTEM_ENTRY,CBIOS_SYSTEM_ENTRY+systemDisk.payload.length),systemDisk.payload);
  assert.equal(String.fromCharCode(...m.memory.ram.slice(SYSTEM_SIGNATURE,SYSTEM_SIGNATURE+4)),'DSK!');
  const [line1,line2]=SYSTEM_MESSAGE.trim().split('\r\n');
  assert.equal(screen(m,0,line1.length),line1);assert.equal(screen(m,1,line2.length),line2);
  const io=m.bus.trace.filter(event=>event.space==='IO'&&event.meta.device===m.disk.id);
  assert.equal(io.filter(event=>event.operation==='WRITE'&&(event.address&255)===0x31&&event.data===1).length,1);
  assert.equal(io.filter(event=>event.operation==='READ'&&(event.address&255)===0x35).length,128);
  assert(m.bus.trace.some(event=>event.purpose==='OPCODE_FETCH'&&event.address===0&&event.meta.memorySource==='RAM'));
  assert(m.bus.trace.some(event=>event.purpose==='OPCODE_FETCH'&&event.address===CBIOS_SYSTEM_ENTRY&&event.meta.memorySource==='RAM'));
  assert(!m.bus.trace.some(event=>event.meta?.memorySource==='BOOT_ROM'||event.meta?.memorySource==='EXTENSION_ROM'));
}

// A missing medium cannot fall into damaged RAM. WBOOT reports through its own
// loaded console routine and reaches a stable HALT in all-RAM mode.
{
  const m=machine();coldBoot(m);m.disk.eject();m.bus.clearTrace();
  Object.assign(m.cpu.state,{pc:0,halted:false});until(m.cpu,()=>m.cpu.state.halted);
  assert.equal(m.memory.control,MEMORY_CONTROL_LOW_RAM);
  assert.equal(screen(m,0,'WBOOT DISK ERROR'.length),'WBOOT DISK ERROR');
  assert(!m.bus.trace.some(event=>event.meta?.memorySource==='BOOT_ROM'||event.meta?.memorySource==='EXTENSION_ROM'));
}

console.log('SHINO-80 WARM BOOT v0.2: PAGE ZERO + SECTOR RELOAD + ERROR HALT PASS');
