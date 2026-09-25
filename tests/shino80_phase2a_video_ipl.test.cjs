'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {buildSystemRom,TEXT_VRAM_BASE,TEXT_COLS}=require('../src/firmware/shino80/shino80-system-rom.js');
const {CG_ROM_IMAGE,CG_ROM_BYTES,GLYPH_HEIGHT}=require('../src/firmware/shino80/shino80-cgrom.js');

const rom=buildSystemRom();
assert.equal(rom.bytes.length,0x2000);
assert.equal(rom.bytes[0],0xC3);
assert.equal(rom.bytes[1]|(rom.bytes[2]<<8),rom.labels.IPL_ENTRY);
assert.equal(rom.meta.romSize,0x2000);
assert(rom.meta.instructionsBeforeLoop>0);

const bus=new Shino80Bus({traceLimit:50000,romRanges:[[0x0000,0x1FFF]]});
const cpu=new Z80Core(bus);
bus.load(rom.bytes,0);cpu.reset();bus.clearTrace();
cpu.runInstructions(rom.meta.instructionsBeforeLoop);
assert.equal(cpu.state.pc,rom.labels.MONITOR_LOOP);
assert.equal(cpu.state.sp,0xF000);

function textAt(row,len){
  let s='';
  for(let i=0;i<len;i++)s+=String.fromCharCode(bus.debugPeek(TEXT_VRAM_BASE+row*TEXT_COLS+i));
  return s;
}
assert.equal(textAt(0,12),'SHINO-80 IPL');
assert.equal(textAt(1,8),'VIDEO OK');
assert.equal(textAt(2,3),'MON');
assert.equal(textAt(3,1),'*');

assert(bus.trace.some(e=>e.operation==='WRITE'&&e.address===0xC000&&e.data===0x53));
assert(bus.trace.some(e=>e.operation==='WRITE'&&e.address===0xC050&&e.data===0x56));

const rom0=bus.debugPeek(0);
bus.cpuWrite(0,0x00,{purpose:'TEST_ROM_WRITE'});
assert.equal(bus.debugPeek(0),rom0);
assert.equal(bus.trace.at(-1).purpose,'ROM_WRITE_BLOCKED');
assert.equal(bus.trace.at(-1).operation,'WRITE_BLOCKED');

assert.equal(CG_ROM_BYTES,4096);
assert.equal(CG_ROM_IMAGE.length,4096);
const sBase='S'.charCodeAt(0)*GLYPH_HEIGHT;
const spaceBase=' '.charCodeAt(0)*GLYPH_HEIGHT;
assert([...CG_ROM_IMAGE.slice(sBase,sBase+GLYPH_HEIGHT)].some(v=>v!==0));
assert([...CG_ROM_IMAGE.slice(spaceBase,spaceBase+GLYPH_HEIGHT)].every(v=>v===0));

console.log('SHINO-80 PHASE 2A VIDEO + IPL: ALL TESTS PASS');
