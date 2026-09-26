'use strict';
const assert=require('node:assert/strict');
const {ExecutionPace}=require('../src/app/shino80-execution-pace.js');
function fake(cost=7){return {state:{tStates:0},step(){this.state.tStates+=cost;}};}
// Different frame rates produce the same T-state target, to one instruction.
for(const fps of [30,60,120]){
  const cpu=fake(),pace=new ExecutionPace(cpu,{now:()=>0});
  for(let n=1;n<=fps;n++)pace.advance(n*1000/fps,'REALTIME');
  assert(cpu.state.tStates>=4000000&&cpu.state.tStates<4000007);
  assert(pace.mhz>3.99&&pace.mhz<4.01);
}
{
  const cpu=fake(11),pace=new ExecutionPace(cpu,{now:()=>0});
  pace.advance(0.001,'REALTIME');assert.equal(cpu.state.tStates,11);
  pace.advance(0.002,'REALTIME');assert.equal(cpu.state.tStates,11,'overshoot must carry');
  pace.advance(0.003,'REALTIME');assert.equal(cpu.state.tStates,22);
  pace.advance(10000,'REALTIME');assert.equal(cpu.state.tStates,22,'discard suspended debt');
  pace.reset(20000);pace.advance(20001,'REALTIME');assert(cpu.state.tStates<4033);
}
{
  let clock=0;const cpu=fake(),pace=new ExecutionPace(cpu,{now:()=>clock,workMs:1});
  cpu.step=function(){clock+=0.1;this.state.tStates+=7;};
  const n=pace.advance(16,'REALTIME');assert.equal(n,32,'yield within one check chunk');
  assert(clock<4);pace.advance(216,'REALTIME');assert(pace.credit<=400000,'bounded catch-up');
  pace.reset(clock);assert.equal(pace.credit,0);assert.equal(pace.mhz,0);
}
{
  const cpu=fake(),pace=new ExecutionPace(cpu,{now:()=>0,maxInstructions:100});
  assert.equal(pace.advance(16,'TURBO'),100);assert.equal(cpu.state.tStates,700);
  assert.throws(()=>pace.advance(17,'INVALID'));
}
// Host batching must not change machine state, RAM or CPU Bus event ordering.
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Shino80Memory}=require('../src/machine/shino80/shino80-memory.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {buildSystemRom}=require('../src/firmware/shino80/shino80-system-rom.js');
const rom=buildSystemRom();
function machine(){const memory=new Shino80Memory();memory.loadFirmware(rom.bytes);const bus=new Shino80Bus({traceLimit:256,memoryDevice:memory});const cpu=new Z80Core(bus);cpu.reset();return {bus,cpu};}
for(const mode of ['REALTIME','TURBO']){
  const a=machine(),b=machine(),pace=new ExecutionPace(a.cpu,{now:()=>0});
  pace.advance(16,mode);b.cpu.runInstructions(a.cpu.state.instructions);
  assert.deepEqual(a.cpu.state,b.cpu.state);assert.deepEqual(a.bus.memory,b.bus.memory);assert.deepEqual(a.bus.trace,b.bus.trace);
}
console.log('SHINO-80 EXECUTION PACE: frame-rate, overshoot, suspend, bounds and CPU equivalence PASS');
