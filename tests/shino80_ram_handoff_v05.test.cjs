'use strict';
const assert=require('node:assert/strict');
const {Shino80Memory}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Shino80Keyboard}=require('../src/devices/shino80/shino80-keyboard.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {
  buildSystemRom,TEXT_VRAM_BASE,TEXT_COLS,MEMORY_CONTROL_PORT,
  RAM_HANDOFF_TRAMPOLINE,RAM_HANDOFF_DEMO_ENTRY,RAM_HANDOFF_SIGNATURE
}=require('../src/firmware/shino80/shino80-system-rom.js');

const rom=buildSystemRom();
assert.equal(rom.labels.BIOS_API_RAM_HANDOFF,0x011E);
assert.deepEqual(Array.from(rom.bytes.slice(rom.labels.BIOS_API_RAM_HANDOFF,rom.labels.BIOS_API_RAM_HANDOFF+3)),
  [0xC3,rom.labels.BIOS_RAM_HANDOFF&255,rom.labels.BIOS_RAM_HANDOFF>>8]);
assert.deepEqual(Array.from(rom.bytes.slice(rom.labels.RAM_HANDOFF_TRAMPOLINE_TEMPLATE,rom.labels.RAM_HANDOFF_TRAMPOLINE_TEMPLATE+3)),[0xD3,0x00,0xE9]);

function machine(traceLimit=20000){
  const keyboard=new Shino80Keyboard({capacity:128});
  const memory=new Shino80Memory();memory.loadFirmware(rom.bytes);
  const bus=new Shino80Bus({traceLimit,memoryDevice:memory,ioDevices:[keyboard]});
  const cpu=new Z80Core(bus);cpu.reset();return {keyboard,memory,bus,cpu};
}
function until(cpu,predicate,limit=500000){let count=0;while(!predicate()&&count++<limit)cpu.step();assert(count<limit,'RAM handoff execution timeout');return count;}
function textAt(bus,address,length){return String.fromCharCode(...Array.from({length},(_,i)=>bus.debugPeek(address+i)));}

// Invalid entry below 4000h returns to the caller and leaves ROM visible.
{
  const m=machine();
  m.bus.load([0x21,0xFF,0x3F,0x3E,0x01,0xCD,0x1E,0x01,0x76],0x4000);
  Object.assign(m.cpu.state,{pc:0x4000,sp:0xF000,halted:false});until(m.cpu,()=>m.cpu.state.halted);
  assert.equal(m.memory.control,0);assert.equal(m.bus.debugPeek(0),rom.bytes[0]);
}

// Valid use copies the trampoline, pages out ROM and fetches continuation from RAM.
{
  const m=machine();
  m.bus.load([0x3E,0x5A,0x32,RAM_HANDOFF_SIGNATURE&255,RAM_HANDOFF_SIGNATURE>>8,0x76],RAM_HANDOFF_DEMO_ENTRY);
  m.bus.load([0x21,RAM_HANDOFF_DEMO_ENTRY&255,RAM_HANDOFF_DEMO_ENTRY>>8,0x3E,0x01,0xCD,0x1E,0x01],0x4000);
  Object.assign(m.cpu.state,{pc:0x4000,sp:0xF000,halted:false});until(m.cpu,()=>m.cpu.state.halted);
  assert.equal(m.memory.control,1);assert.equal(m.bus.debugPeek(RAM_HANDOFF_SIGNATURE),0x5A);
  assert.deepEqual(Array.from({length:3},(_,i)=>m.bus.debugPeek(RAM_HANDOFF_TRAMPOLINE+i)),[0xD3,0x00,0xE9]);
  const pageout=m.bus.trace.findIndex(e=>e.space==='IO'&&e.operation==='WRITE'&&(e.address&255)===MEMORY_CONTROL_PORT&&e.data===1);
  assert(pageout>=0,'LOW_RAM I/O write');
  const fetches=m.bus.trace.slice(pageout+1).filter(e=>e.purpose==='OPCODE_FETCH');
  assert.equal(fetches[0].address,RAM_HANDOFF_TRAMPOLINE+2);assert.equal(fetches[0].meta.memorySource,'RAM');
  assert(fetches.some(e=>e.address===RAM_HANDOFF_DEMO_ENTRY&&e.meta.memorySource==='RAM'));
  assert(!m.bus.trace.slice(pageout+1).some(e=>e.meta?.memorySource==='BOOT_ROM'||e.meta?.memorySource==='EXTENSION_ROM'));
}

// MON B uses shadow page-zero writes and the same ABI, then runs without ROM.
{
  const m=machine(50000);m.cpu.runInstructions(rom.meta.instructionsBeforeLoop);
  assert.equal(m.cpu.state.pc,rom.labels.MONITOR_LOOP);m.bus.clearTrace();
  m.keyboard.enqueueByte(0x42);m.keyboard.enqueueByte(13);until(m.cpu,()=>m.cpu.state.halted);
  assert.equal(m.memory.control,1);assert.deepEqual(Array.from({length:3},(_,i)=>m.bus.debugPeek(i)),[0xC3,0x00,0x80]);
  assert.equal(textAt(m.bus,RAM_HANDOFF_SIGNATURE,4),'R80!');
  assert.equal(textAt(m.bus,TEXT_VRAM_BASE,17),'SHINO-80 RAM BOOT');
  assert.equal(textAt(m.bus,TEXT_VRAM_BASE+TEXT_COLS,18),'ALL 64K RAM ONLINE');
  assert(m.bus.trace.some(e=>e.operation==='WRITE_SHADOW'&&e.address===0));
  assert(m.bus.trace.some(e=>e.space==='IO'&&(e.address&255)===0&&e.data===1));

  m.bus.resetIoDevices();m.cpu.reset();m.cpu.runInstructions(rom.meta.instructionsBeforeLoop);
  assert.equal(m.memory.control,0);assert.equal(m.cpu.state.halted,false);assert.equal(m.cpu.state.pc,rom.labels.MONITOR_LOOP);
  assert.equal(m.bus.debugPeek(0),rom.bytes[0]);
}

console.log('SHINO-80 RAM HANDOFF v0.5: SHADOW PAGE ZERO + FULL-RAM CONTINUATION + RESET RECOVERY PASS');
