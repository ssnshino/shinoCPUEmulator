'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {FLAG_MASK}=require('../src/cpu/z80/z80-flags.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');

function fresh(bytes,start=0){
  const bus=new Shino80Bus({traceLimit:2048});
  const cpu=new Z80Core(bus);
  bus.load(bytes,start);cpu.reset();cpu.state.pc=start;bus.clearTrace();return {bus,cpu};
}

// JP nn
{
  const {bus,cpu}=fresh([0xC3,0x34,0x12]);cpu.state.f=0xA5;const r=cpu.step();
  assert.equal(cpu.state.pc,0x1234);assert.equal(cpu.state.f,0xA5);assert.equal(cpu.state.tStates,10);assert.equal(cpu.state.r,1);
  assert.equal(r.branchTaken,true);assert.equal(r.branchTarget,0x1234);assert.equal(r.fallThrough,3);
  assert.deepEqual(bus.trace.map(e=>e.tState),[0,2,4,7]);
}

// JR signed positive and negative.
{
  const {cpu}=fresh([0x18,0x05]);const r=cpu.step();
  assert.equal(cpu.state.pc,7);assert.equal(cpu.state.tStates,12);assert.equal(r.branchTarget,7);
}
{
  const {cpu}=fresh([0x18,0xFE],0x0100);const r=cpu.step();
  assert.equal(cpu.state.pc,0x0100);assert.equal(r.branchTarget,0x0100);
}

// 16-bit wrap.
{
  const {cpu}=fresh([0x18,0x02],0xFFFE);cpu.step();assert.equal(cpu.state.pc,0x0002);
}

const cases=[
  {op:0x20,name:'NZ',takenF:0,notF:FLAG_MASK.Z},
  {op:0x28,name:'Z',takenF:FLAG_MASK.Z,notF:0},
  {op:0x30,name:'NC',takenF:0,notF:FLAG_MASK.C},
  {op:0x38,name:'C',takenF:FLAG_MASK.C,notF:0}
];

for(const c of cases){
  {
    const {cpu}=fresh([c.op,0x02]);cpu.state.f=c.takenF|0x28;const before=cpu.state.f;const r=cpu.step();
    assert.equal(r.mnemonic,`JR ${c.name},+2`);
    assert.equal(r.branchTaken,true);assert.equal(cpu.state.pc,4);assert.equal(cpu.state.tStates,12);assert.equal(cpu.state.f,before);
  }
  {
    const {cpu}=fresh([c.op,0x02]);cpu.state.f=c.notF|0x28;const before=cpu.state.f;const r=cpu.step();
    assert.equal(r.branchTaken,false);assert.equal(cpu.state.pc,2);assert.equal(cpu.state.tStates,7);assert.equal(cpu.state.f,before);
  }
}

// DJNZ taken/not-taken. Flags must remain untouched.
{
  const {bus,cpu}=fresh([0x10,0xFE]);cpu.state.b=2;cpu.state.f=0xD7;const r=cpu.step();
  assert.equal(cpu.state.b,1);assert.equal(cpu.state.pc,0);assert.equal(cpu.state.tStates,13);assert.equal(cpu.state.f,0xD7);
  assert.equal(r.branchTaken,true);assert.deepEqual(bus.trace.map(e=>e.tState),[0,2,5]);
}
{
  const {cpu}=fresh([0x10,0x7F]);cpu.state.b=1;cpu.state.f=0xD7;const r=cpu.step();
  assert.equal(cpu.state.b,0);assert.equal(cpu.state.pc,2);assert.equal(cpu.state.tStates,8);assert.equal(cpu.state.f,0xD7);assert.equal(r.branchTaken,false);
}

// Teaching program and visible non-linear PC sequence.
{
  const program=[
    0x06,0x04,0x3E,0x7E,0x3C,0x10,0xFD,0x0E,0xFF,0x0C,
    0x20,0x02,0x28,0x02,0x16,0x11,0x16,0x22,0x18,0x02,
    0x1E,0x33,0x1E,0x44,0xC3,0x1C,0x00,0x00,0x00
  ];
  const {cpu}=fresh(program);
  const pcs=[];
  for(let i=0;i<19;i++){cpu.step();pcs.push(cpu.state.pc);}
  assert.deepEqual(pcs.slice(0,10),[2,4,5,4,5,4,5,4,5,7]);
  assert.equal(cpu.state.a,0x82);assert.equal(cpu.state.b,0);assert.equal(cpu.state.c,0);
  assert.equal(cpu.state.d,0x22);assert.equal(cpu.state.e,0x44);assert.equal(cpu.state.f,0x50);
  assert.equal(cpu.state.pc,0x001D);assert.equal(cpu.state.r,19);assert.equal(cpu.state.tStates,147);
}

console.log('SHINO Z80 PHASE 1C CONTROL FLOW: ALL TESTS PASS');
