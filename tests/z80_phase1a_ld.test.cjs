'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const decoder=require('../src/cpu/z80/z80-decoder.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');

function fresh(bytes=[0x00]){
  const bus=new Shino80Bus({traceLimit:2048});
  const cpu=new Z80Core(bus);
  bus.load(bytes,0x0000);cpu.reset();bus.clearTrace();return {bus,cpu};
}

{
  const d=decoder.decodeBase(0x78);
  assert.equal(d.kind,'LD_R_R');assert.equal(d.mnemonic,'LD A,B');assert.equal(d.tStates,4);
}
{
  const d=decoder.decodeBase(0x3E);
  assert.equal(d.kind,'LD_R_N');assert.equal(d.dstCode,7);assert.equal(d.tStates,7);
}
{
  const d=decoder.decodeBase(0x21);
  assert.equal(d.kind,'LD_DD_NN');assert.equal(d.pairCode,2);assert.equal(d.tStates,10);
}
assert.equal(decoder.decodeBase(0x36).kind,'LD_MEM_HL_N');
assert.equal(decoder.decodeBase(0x76).kind,'HALT');

{
  const opcodes=[0x06,0x0E,0x16,0x1E,0x26,0x2E,0x3E];
  const keys=['b','c','d','e','h','l','a'];
  for(let i=0;i<opcodes.length;i++){
    const {bus,cpu}=fresh([opcodes[i],0xA0+i]);
    cpu.state.f=0xD7;const r=cpu.step();
    assert.equal(cpu.state[keys[i]],0xA0+i);assert.equal(cpu.state.f,0xD7);
    assert.equal(cpu.state.pc,2);assert.equal(cpu.state.r,1);assert.equal(cpu.state.tStates,7);assert.equal(r.bytes.length,2);
    assert.deepEqual(bus.trace.map(x=>x.purpose),['OPCODE_FETCH','MEMORY_REFRESH','OPERAND_READ']);
    assert.deepEqual(bus.trace.map(x=>x.tState),[0,2,4]);
  }
}

{
  for(const dst of [0,1,2,3,4,5,7]){
    for(const src of [0,1,2,3,4,5,7]){
      const opcode=0x40|(dst<<3)|src,{cpu}=fresh([opcode]);
      const sourceValue=(0x31+src*7+dst)&0xFF,srcKey=decoder.REG8_KEYS[src],dstKey=decoder.REG8_KEYS[dst];
      cpu.state[srcKey]=sourceValue;cpu.state[dstKey]=dst===src?sourceValue:0;cpu.state.f=0x95;
      cpu.step();
      assert.equal(cpu.state[dstKey],sourceValue,`opcode ${opcode.toString(16)}`);
      assert.equal(cpu.state.f,0x95);assert.equal(cpu.state.tStates,4);assert.equal(cpu.state.r,1);
    }
  }
}

{
  const ops=[0x01,0x11,0x21,0x31];
  for(let p=0;p<4;p++){
    const {bus,cpu}=fresh([ops[p],0x34,0x12]);cpu.state.f=0xA5;const r=cpu.step();
    assert.equal(cpu.getPair16(p),0x1234);assert.equal(cpu.state.f,0xA5);assert.equal(cpu.state.pc,3);assert.equal(cpu.state.r,1);assert.equal(cpu.state.tStates,10);
    assert.equal(r.mnemonic,`LD ${decoder.REG16_DD_NAMES[p]},1234h`);assert.deepEqual(bus.trace.map(x=>x.tState),[0,2,4,7]);
  }
}

{
  const {bus,cpu}=fresh([0x4E,0x70,0x36,0x55]);
  cpu.state.h=0;cpu.state.l=0x80;cpu.state.b=0x2A;cpu.state.f=0x5A;bus.debugPoke(0x0080,0x41);
  let r=cpu.step();assert.equal(r.mnemonic,'LD C,(HL)');assert.equal(cpu.state.c,0x41);assert.equal(cpu.state.tStates,7);
  r=cpu.step();assert.equal(r.mnemonic,'LD (HL),B');assert.equal(bus.debugPeek(0x0080),0x2A);assert.equal(cpu.state.tStates,14);
  r=cpu.step();assert.equal(r.mnemonic,'LD (HL),55h');assert.equal(bus.debugPeek(0x0080),0x55);assert.equal(cpu.state.tStates,24);assert.equal(cpu.state.f,0x5A);
}

{
  const program=[0x01,0x80,0x00,0x11,0x90,0x00,0x3E,0x66,0x02,0x12,0x0A,0x1A,0x32,0xA0,0x00,0x3A,0xA0,0x00];
  const {bus,cpu}=fresh(program);cpu.state.f=0xC3;for(let i=0;i<9;i++)cpu.step();
  assert.equal(bus.debugPeek(0x0080),0x66);assert.equal(bus.debugPeek(0x0090),0x66);assert.equal(bus.debugPeek(0x00A0),0x66);assert.equal(cpu.state.a,0x66);
  assert.equal(cpu.state.f,0xC3);assert.equal(cpu.state.r,9);assert.equal(cpu.state.pc,program.length);assert.equal(cpu.state.tStates,81);
}

{
  const program=[0x3E,0x41,0x06,0x22,0x21,0x80,0x00,0x77,0x4E,0x11,0x90,0x00,0x12,0x3A,0x90,0x00,0x00];
  const {bus,cpu}=fresh(program);cpu.state.f=0xA5;let last;for(let i=0;i<9;i++)last=cpu.step();
  assert.equal(cpu.state.a,0x41);assert.equal(cpu.state.b,0x22);assert.equal(cpu.state.c,0x41);assert.equal(cpu.getHL(),0x0080);assert.equal(cpu.getDE(),0x0090);
  assert.equal(bus.debugPeek(0x0080),0x41);assert.equal(bus.debugPeek(0x0090),0x41);assert.equal(cpu.state.f,0xA5);assert.equal(cpu.state.pc,17);assert.equal(cpu.state.r,9);assert.equal(cpu.state.tStates,72);assert.equal(last.mnemonic,'NOP');
}

{
  const {cpu}=fresh([0x76]);
  assert.throws(()=>cpu.step(),/UNIMPLEMENTED HALT OPCODE 76h/);
}

console.log('SHINO Z80 PHASE 1A LD: ALL TESTS PASS');
