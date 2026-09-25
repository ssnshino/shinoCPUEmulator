'use strict';

const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {
  buildSystemRom,
  TEXT_VRAM_BASE,TEXT_VRAM_END,
  BIOS_JUMP_TABLE,BIOS_WORK_CURSOR,BIOS_WORK_COLUMN,IPL_ENTRY
}=require('../src/firmware/shino80/shino80-system-rom.js');

const rom=buildSystemRom();
const wordAt=address=>rom.bytes[address]|(rom.bytes[address+1]<<8);

function assertJump(address,target){
  assert.equal(rom.bytes[address],0xC3,`JP opcode at ${address.toString(16)}h`);
  assert.equal(wordAt(address+1),target,`JP target at ${address.toString(16)}h`);
}

assertJump(0x0000,IPL_ENTRY);
assertJump(0x0008,rom.labels.BIOS_PUTCHAR);
for(const vector of [0x0010,0x0018,0x0020,0x0028,0x0030,0x0038,0x0066]){
  assertJump(vector,rom.labels.BIOS_UNIMPLEMENTED);
}
assertJump(BIOS_JUMP_TABLE+0x00,rom.labels.BIOS_PUTCHAR);
assertJump(BIOS_JUMP_TABLE+0x03,rom.labels.BIOS_NEWLINE);
assertJump(BIOS_JUMP_TABLE+0x06,rom.labels.BIOS_CLS);
assertJump(BIOS_JUMP_TABLE+0x09,rom.labels.BIOS_PRINT_STRING);

function machine(){
  const bus=new Shino80Bus({traceLimit:20000,romRanges:[[0x0000,0x1FFF]]});
  const cpu=new Z80Core(bus);
  bus.load(rom.bytes,0);
  cpu.reset();
  cpu.state.pc=0x2000;cpu.state.sp=0xF000;
  return {bus,cpu};
}

function loadProgram(bus,bytes){
  bytes.forEach((byte,index)=>bus.debugPoke(0x2000+index,byte));
}

function runToHalt(cpu,limit=20000){
  let count=0;
  while(!cpu.state.halted&&count++<limit)cpu.step();
  assert(cpu.state.halted,`program did not HALT within ${limit} instructions`);
  return count;
}

function setCursor(bus,address,column){
  bus.debugPoke(BIOS_WORK_CURSOR,address&0xFF);
  bus.debugPoke(BIOS_WORK_CURSOR+1,(address>>8)&0xFF);
  bus.debugPoke(BIOS_WORK_COLUMN,column);
}

function cursor(bus){
  return bus.debugPeek(BIOS_WORK_CURSOR)|(bus.debugPeek(BIOS_WORK_CURSOR+1)<<8);
}

// CLS clears the full eight-page text region, initializes the cursor, and
// preserves its documented registers and caller stack.
{
  const {bus,cpu}=machine();
  for(let address=TEXT_VRAM_BASE;address<TEXT_VRAM_BASE+0x800;address++)bus.debugPoke(address,0xA5);
  setCursor(bus,0xC123,0x23);
  cpu.state.a=0x5A;cpu.state.f=0xA5;cpu.state.b=0x12;cpu.state.c=0x34;cpu.state.h=0x56;cpu.state.l=0x78;
  loadProgram(bus,[0xCD,(BIOS_JUMP_TABLE+6)&0xFF,(BIOS_JUMP_TABLE+6)>>8,0x76]);
  runToHalt(cpu);
  for(let address=TEXT_VRAM_BASE;address<TEXT_VRAM_BASE+0x800;address++)assert.equal(bus.debugPeek(address),0);
  assert.equal(cursor(bus),TEXT_VRAM_BASE);assert.equal(bus.debugPeek(BIOS_WORK_COLUMN),0);
  assert.equal(cpu.state.a,0x5A);assert.equal(cpu.state.f,0xA5);
  assert.equal(cpu.state.b,0x12);assert.equal(cpu.state.c,0x34);
  assert.equal(cpu.state.h,0x56);assert.equal(cpu.state.l,0x78);assert.equal(cpu.state.sp,0xF000);
}

// RST 08 PUTCHAR writes through the CPU Bus and preserves AF/BC/HL.
{
  const {bus,cpu}=machine();
  setCursor(bus,TEXT_VRAM_BASE,0);
  cpu.state.a='Z'.charCodeAt(0);cpu.state.f=0xA5;cpu.state.b=0x12;cpu.state.c=0x34;cpu.state.h=0x56;cpu.state.l=0x78;
  loadProgram(bus,[0xCF,0x76]);
  bus.clearTrace();runToHalt(cpu);
  assert.equal(bus.debugPeek(TEXT_VRAM_BASE),'Z'.charCodeAt(0));
  assert.equal(cursor(bus),TEXT_VRAM_BASE+1);assert.equal(bus.debugPeek(BIOS_WORK_COLUMN),1);
  assert.equal(cpu.state.a,'Z'.charCodeAt(0));assert.equal(cpu.state.f,0xA5);
  assert.equal(cpu.state.b,0x12);assert.equal(cpu.state.c,0x34);
  assert.equal(cpu.state.h,0x56);assert.equal(cpu.state.l,0x78);assert.equal(cpu.state.sp,0xF000);
  assert(bus.trace.some(event=>event.actor==='CPU'&&event.operation==='WRITE'&&event.address===TEXT_VRAM_BASE&&event.data==='Z'.charCodeAt(0)));
}

// PRINT_STRING uses PUTCHAR for CR/LF handling and preserves BC/DE.
{
  const {bus,cpu}=machine();
  setCursor(bus,TEXT_VRAM_BASE,0);
  const text=[...'A\r\nB'].map(ch=>ch.charCodeAt(0));
  text.push(0);
  text.forEach((byte,index)=>bus.debugPoke(0x2100+index,byte));
  cpu.state.h=0x21;cpu.state.l=0x00;cpu.state.b=0x12;cpu.state.c=0x34;cpu.state.d=0x56;cpu.state.e=0x78;
  loadProgram(bus,[0xCD,(BIOS_JUMP_TABLE+9)&0xFF,(BIOS_JUMP_TABLE+9)>>8,0x76]);
  runToHalt(cpu);
  assert.equal(bus.debugPeek(TEXT_VRAM_BASE),'A'.charCodeAt(0));
  assert.equal(bus.debugPeek(TEXT_VRAM_BASE+80),'B'.charCodeAt(0));
  assert.equal(cursor(bus),TEXT_VRAM_BASE+81);assert.equal(bus.debugPeek(BIOS_WORK_COLUMN),1);
  assert.equal((cpu.state.h<<8)|cpu.state.l,0x2104);
  assert.equal((cpu.state.b<<8)|cpu.state.c,0x1234);assert.equal((cpu.state.d<<8)|cpu.state.e,0x5678);
  assert.equal(cpu.state.sp,0xF000);
}

// The last visible cell advances and wraps to the top-left cursor position.
{
  const {bus,cpu}=machine();
  setCursor(bus,TEXT_VRAM_END-1,79);
  cpu.state.a='X'.charCodeAt(0);
  loadProgram(bus,[0xCF,0x76]);runToHalt(cpu);
  assert.equal(bus.debugPeek(TEXT_VRAM_END-1),'X'.charCodeAt(0));
  assert.equal(cursor(bus),TEXT_VRAM_BASE);assert.equal(bus.debugPeek(BIOS_WORK_COLUMN),0);
}

// Public NEWLINE advances from an arbitrary column to the next row start.
{
  const {bus,cpu}=machine();
  setCursor(bus,TEXT_VRAM_BASE+82,2);
  loadProgram(bus,[0xCD,(BIOS_JUMP_TABLE+3)&0xFF,(BIOS_JUMP_TABLE+3)>>8,0x76]);runToHalt(cpu);
  assert.equal(cursor(bus),TEXT_VRAM_BASE+160);assert.equal(bus.debugPeek(BIOS_WORK_COLUMN),0);
}

console.log('SHINO-80 MINIMUM BIOS + MONITOR FOUNDATION: ALL TESTS PASS');
