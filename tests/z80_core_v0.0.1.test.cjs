'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');

function fresh(){
  const bus=new Shino80Bus();
  const cpu=new Z80Core(bus);
  bus.load([0x00,0x00,0x00,0x00],0x0000);
  cpu.reset();
  bus.clearTrace();
  return {bus,cpu};
}

{
  const {cpu}=fresh();
  cpu.state.a=0x5A;
  cpu.state.sp=0xBEEF;
  cpu.state.pc=0x1234;
  cpu.state.i=0x77;
  cpu.state.r=0xE5;
  cpu.state.iff1=true;
  cpu.state.iff2=true;
  cpu.state.im=2;
  cpu.reset();
  assert.equal(cpu.state.pc,0x0000,'RESET clears PC');
  assert.equal(cpu.state.i,0x00,'RESET clears I');
  assert.equal(cpu.state.r,0x00,'RESET clears R');
  assert.equal(cpu.state.iff1,false,'RESET clears IFF1');
  assert.equal(cpu.state.iff2,false,'RESET clears IFF2');
  assert.equal(cpu.state.im,0,'RESET selects interrupt mode 0');
  assert.equal(cpu.state.a,0x5A,'RESET does not invent a documented value for A');
  assert.equal(cpu.state.sp,0xBEEF,'RESET does not invent a documented value for SP');
}

{
  const {bus,cpu}=fresh();
  const fBefore=cpu.state.f=0xA5;
  const result=cpu.step();
  assert.deepEqual(result,{address:0,opcode:0,mnemonic:'NOP',tStates:4,startTState:0,endTState:4});
  assert.equal(cpu.state.pc,1,'NOP advances PC after opcode fetch');
  assert.equal(cpu.state.r,1,'M1 opcode fetch increments lower seven R bits');
  assert.equal(cpu.state.tStates,4,'NOP consumes 4 T-states');
  assert.equal(cpu.state.instructions,1,'instruction counter advances');
  assert.equal(cpu.state.f,fBefore,'NOP affects no flags');
  assert.equal(bus.trace.length,2,'NOP emits abstract fetch + refresh bus events');
  assert.deepEqual(bus.trace[0].signals,['M1','MREQ','RD']);
  assert.equal(bus.trace[0].purpose,'OPCODE_FETCH');
  assert.deepEqual(bus.trace[1].signals,['MREQ','RFSH']);
  assert.equal(bus.trace[1].purpose,'MEMORY_REFRESH');
}

{
  const {cpu}=fresh();
  cpu.step();
  cpu.step();
  assert.equal(cpu.state.pc,2);
  assert.equal(cpu.state.r,2);
  assert.equal(cpu.state.tStates,8);
}

{
  const {cpu}=fresh();
  cpu.state.r=0xFF;
  cpu.step();
  assert.equal(cpu.state.r,0x80,'R bit 7 is preserved while lower seven bits wrap');
}

{
  const {bus,cpu}=fresh();
  bus.debugPoke(0,0xFF);
  assert.throws(()=>cpu.step(),/UNIMPLEMENTED OPCODE FFh at 0000h/);
}

console.log('SHINO Z80 CORE v0.0.1: ALL TESTS PASS');
