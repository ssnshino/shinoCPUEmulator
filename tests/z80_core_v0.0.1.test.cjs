'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const bus=new Shino80Bus();const cpu=new Z80Core(bus);bus.load([0x00]);cpu.reset();bus.clearTrace();cpu.state.f=0xA5;const r=cpu.step();
assert.equal(r.mnemonic,'NOP');assert.equal(cpu.state.pc,1);assert.equal(cpu.state.r,1);assert.equal(cpu.state.tStates,4);assert.equal(cpu.state.f,0xA5);assert.equal(bus.trace.length,2);
console.log('Z80 v0.0.1 NOP regression PASS');
