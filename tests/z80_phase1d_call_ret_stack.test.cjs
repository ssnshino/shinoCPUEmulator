'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');

function fresh(bytes,start=0){
  const bus=new Shino80Bus({traceLimit:2048}),cpu=new Z80Core(bus);
  bus.load(bytes,start);cpu.reset();cpu.state.pc=start;bus.clearTrace();return {bus,cpu};
}

{
  const {bus,cpu}=fresh([0xCD,0x10,0x00]);bus.debugPoke(0x0010,0xC9);
  cpu.state.sp=0xF000;cpu.state.f=0xA5;
  const call=cpu.step();
  assert.equal(call.mnemonic,'CALL 0010h');
  assert.equal(cpu.state.pc,0x0010);assert.equal(cpu.state.sp,0xEFFE);assert.equal(cpu.state.f,0xA5);assert.equal(cpu.state.tStates,17);
  assert.equal(bus.debugPeek(0xEFFE),0x03);assert.equal(bus.debugPeek(0xEFFF),0x00);
  assert.deepEqual(bus.trace.map(e=>e.purpose),['OPCODE_FETCH','MEMORY_REFRESH','OPERAND_READ','OPERAND_READ','STACK_WRITE','STACK_WRITE']);
  assert.deepEqual(bus.trace.map(e=>e.tState),[0,2,4,7,11,14]);

  bus.clearTrace();
  const ret=cpu.step();
  assert.equal(ret.mnemonic,'RET');assert.equal(cpu.state.pc,0x0003);assert.equal(cpu.state.sp,0xF000);assert.equal(cpu.state.f,0xA5);assert.equal(cpu.state.tStates,27);
  assert.deepEqual(bus.trace.map(e=>e.purpose),['OPCODE_FETCH','MEMORY_REFRESH','STACK_READ','STACK_READ']);
  assert.deepEqual(bus.trace.map(e=>e.tState),[17,19,21,24]);
}

{
  const {bus,cpu}=fresh([0xCD,0x00,0x10]);cpu.state.sp=0x0000;cpu.step();
  assert.equal(cpu.state.sp,0xFFFE);assert.equal(bus.debugPeek(0xFFFE),0x03);assert.equal(bus.debugPeek(0xFFFF),0x00);
}

{
  const p=new Uint8Array(0x40);
  p.set([0x31,0x00,0xF0,0x3E,0x10,0xCD,0x10,0x00,0x06,0x55,0xC3,0x30,0x00],0x0000);
  p.set([0x3C,0xCD,0x20,0x00,0x3C,0xC9],0x0010);
  p.set([0x3C,0xC9],0x0020);
  p.set([0x0E,0x77,0x00],0x0030);
  const {bus,cpu}=fresh(p);
  const pcs=[],sps=[];
  for(let i=0;i<13;i++){cpu.step();pcs.push(cpu.state.pc);sps.push(cpu.state.sp);}
  assert.deepEqual(sps.slice(2,9),[0xEFFE,0xEFFE,0xEFFC,0xEFFC,0xEFFE,0xEFFE,0xF000]);
  assert.equal(cpu.state.a,0x13);assert.equal(cpu.state.b,0x55);assert.equal(cpu.state.c,0x77);
  assert.equal(cpu.state.sp,0xF000);assert.equal(cpu.state.pc,0x0033);assert.equal(cpu.state.r,13);assert.equal(cpu.state.tStates,111);
  assert.equal(bus.debugPeek(0xEFFC),0x14);assert.equal(bus.debugPeek(0xEFFD),0x00);
  assert.equal(bus.debugPeek(0xEFFE),0x08);assert.equal(bus.debugPeek(0xEFFF),0x00);
}

console.log('SHINO Z80 PHASE 1D CALL/RET STACK: ALL TESTS PASS');
