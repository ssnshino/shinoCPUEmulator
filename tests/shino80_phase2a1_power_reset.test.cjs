'use strict';
const assert=require('node:assert/strict');
const {Shino80Memory,MEMORY_CONTROL_LOW_RAM}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {buildSystemRom,TEXT_VRAM_BASE}=require('../src/firmware/shino80/shino80-system-rom.js');
const {CG_ROM_IMAGE,GLYPH_HEIGHT}=require('../src/firmware/shino80/shino80-cgrom.js');

const rom=buildSystemRom();
assert.equal(rom.labels.IPL_ENTRY,0x0200);
assert.equal(rom.labels.VRAM_TEST_LOOP,0x020B);
assert.equal(rom.labels.VRAM_TEST_DONE,0x0213);
assert.equal(rom.labels.VRAM_TEST_HOLD_LOOP,0x0215);
assert.equal(rom.labels.VRAM_TEST_HOLD_DONE,0x0217);
assert.equal(rom.labels.MONITOR_LOOP,0x0220);
assert.equal(rom.meta.vramBytes,2048);
assert.equal(rom.meta.testPageInstructions,771);
assert.equal(rom.meta.clearPageInstructions,770);
assert.equal(rom.meta.instructionsBeforeLoop,14096);

const memory=new Shino80Memory();memory.loadFirmware(rom.bytes);
const bus=new Shino80Bus({traceLimit:256,memoryDevice:memory});
const cpu=new Z80Core(bus);

// Deterministic power-loss model clears writable memory but preserves ROM.
bus.clearWritableMemory(0xA5);
assert.equal(bus.debugPeek(0x0000),rom.bytes[0]);
assert.equal(bus.debugPeek(TEXT_VRAM_BASE),0xA5);

// Run through the full-screen display test.
cpu.reset();bus.clearTrace();
let guard=0;
while(cpu.state.pc!==rom.labels.VRAM_TEST_DONE && guard++<7000)cpu.step();
assert(guard<7000);
for(let page=0;page<8;page++){
  const expected='A'.charCodeAt(0)+page;
  assert.equal(bus.debugPeek(TEXT_VRAM_BASE+page*0x100),expected);
  assert.equal(bus.debugPeek(TEXT_VRAM_BASE+page*0x100+0xFF),expected);
}
assert.equal(bus.debugPeek(TEXT_VRAM_BASE+0x800),0xA5);

// Continue through hold, clear, and boot banner.
while(cpu.state.pc!==rom.labels.MONITOR_LOOP && guard++<15000)cpu.step();
assert(guard<15000);
assert.equal(bus.debugPeek(TEXT_VRAM_BASE+0x7FF),0x00);
assert.equal(bus.debugPeek(TEXT_VRAM_BASE+0x800),0xA5);
assert.equal(cpu.state.pc,rom.labels.MONITOR_LOOP);
assert.equal(cpu.state.sp,0xF000);

function textAt(row,len){
  let s='';
  for(let i=0;i<len;i++)s+=String.fromCharCode(bus.debugPeek(TEXT_VRAM_BASE+row*80+i));
  return s;
}
assert.equal(textAt(0,12),'SHINO-80 IPL');
assert.equal(textAt(1,8),'VIDEO OK');
assert.equal(textAt(2,3),'MON');
assert.equal(textAt(3,1),'*');

// RESET is CPU-only: it must not clear text VRAM.
const saved=bus.debugPeek(TEXT_VRAM_BASE);
cpu.reset();
assert.equal(bus.debugPeek(TEXT_VRAM_BASE),saved);
assert.equal(cpu.state.pc,0x0000);

// Machine RESET resets the mapper as well as the CPU.
bus.cpuIoWrite(0x0000,MEMORY_CONTROL_LOW_RAM);assert(memory.lowRamEnabled);
bus.resetIoDevices();cpu.reset();assert.equal(memory.control,0);assert.equal(bus.debugPeek(0),rom.bytes[0]);

// CG cell keeps blank scanlines above and below the glyph.
for(const ch of ['S','A','H','0','*']){
  const base=ch.charCodeAt(0)*GLYPH_HEIGHT;
  assert.equal(CG_ROM_IMAGE[base],0x00);
  assert.equal(CG_ROM_IMAGE[base+15],0x00);
}

// Native CG-ROM regression: exact selected digits and common vertical bounds.
const glyph=ch=>[...CG_ROM_IMAGE.slice(ch.charCodeAt(0)*GLYPH_HEIGHT,(ch.charCodeAt(0)+1)*GLYPH_HEIGHT)];
assert.deepEqual(glyph('1'),[0x00,0x00,0x10,0x10,0x30,0x10,0x10,0x10,0x10,0x10,0x10,0x10,0x10,0x7E,0x00,0x00]);
assert.deepEqual(glyph('4'),[0x00,0x00,0x08,0x18,0x28,0x48,0x48,0x48,0x7C,0x08,0x08,0x08,0x08,0x08,0x00,0x00]);
assert.deepEqual(glyph('7'),[0x00,0x00,0x7E,0x42,0x04,0x04,0x08,0x08,0x10,0x10,0x20,0x20,0x20,0x20,0x00,0x00]);
const verticalBounds=bytes=>{const ys=bytes.flatMap((v,i)=>v?[i]:[]);return [Math.min(...ys),Math.max(...ys)]};
assert.deepEqual(verticalBounds(glyph('4')),[2,13]);
assert.deepEqual(verticalBounds(glyph('7')),[2,13]);

console.log('SHINO-80 PHASE 2A.1 POWER/RESET/CRT/DISPLAY TEST: ALL TESTS PASS');
