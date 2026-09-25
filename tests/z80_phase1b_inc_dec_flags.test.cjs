'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const decoder=require('../src/cpu/z80/z80-decoder.js');
const flags=require('../src/cpu/z80/z80-flags.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');

function fresh(bytes=[0x00]){
  const bus=new Shino80Bus({traceLimit:2048});
  const cpu=new Z80Core(bus);
  bus.load(bytes,0);cpu.reset();bus.clearTrace();return {bus,cpu};
}

function checkBits(f,expected){
  const s=flags.flagState(f);
  for(const [k,v] of Object.entries(expected))assert.equal(s[k],v,`flag ${k}`);
}

// Direct flags-engine boundary tests.
{
  const x=flags.inc8(0x01,0x7F);
  assert.equal(x.result,0x80);
  checkBits(x.f,{S:true,Z:false,H:true,PV:true,N:false,C:true});
}
{
  const x=flags.inc8(0x01,0xFF);
  assert.equal(x.result,0x00);
  checkBits(x.f,{S:false,Z:true,H:true,PV:false,N:false,C:true});
}
{
  const x=flags.dec8(0x01,0x80);
  assert.equal(x.result,0x7F);
  checkBits(x.f,{S:false,Z:false,H:true,PV:true,N:true,C:true});
}
{
  const x=flags.dec8(0x01,0x00);
  assert.equal(x.result,0xFF);
  checkBits(x.f,{S:true,Z:false,H:true,PV:false,N:true,C:true});
}
{
  // Undocumented Y/X are deliberately preserved in PHASE 1B.
  const old=flags.FLAG_MASK.Y|flags.FLAG_MASK.X|flags.FLAG_MASK.C;
  const i=flags.inc8(old,0x01),d=flags.dec8(old,0x02);
  assert.equal(i.f&(flags.FLAG_MASK.Y|flags.FLAG_MASK.X|flags.FLAG_MASK.C),old);
  assert.equal(d.f&(flags.FLAG_MASK.Y|flags.FLAG_MASK.X|flags.FLAG_MASK.C),old);
}

// Decoder: 7 register forms + (HL) for each instruction.
for(let code=0;code<8;code++){
  const inc=decoder.decodeBase(0x04|(code<<3));
  const dec=decoder.decodeBase(0x05|(code<<3));
  if(code===6){
    assert.equal(inc.kind,'INC_MEM_HL');assert.equal(inc.tStates,11);
    assert.equal(dec.kind,'DEC_MEM_HL');assert.equal(dec.tStates,11);
  }else{
    assert.equal(inc.kind,'INC_R');assert.equal(inc.targetCode,code);assert.equal(inc.tStates,4);
    assert.equal(dec.kind,'DEC_R');assert.equal(dec.targetCode,code);assert.equal(dec.tStates,4);
  }
}

// Execute all register INC/DEC forms and preserve carry.
for(const code of [0,1,2,3,4,5,7]){
  const key=decoder.REG8_KEYS[code];
  {
    const {cpu}=fresh([0x04|(code<<3)]);
    cpu.state[key]=0x7F;cpu.state.f=flags.FLAG_MASK.C;
    const r=cpu.step();
    assert.equal(cpu.state[key],0x80);assert.equal(cpu.state.tStates,4);assert.equal(cpu.state.r,1);
    assert.equal(r.mnemonic,`INC ${decoder.REG8_NAMES[code]}`);
    checkBits(cpu.state.f,{S:true,Z:false,H:true,PV:true,N:false,C:true});
  }
  {
    const {cpu}=fresh([0x05|(code<<3)]);
    cpu.state[key]=0x80;cpu.state.f=flags.FLAG_MASK.C;
    const r=cpu.step();
    assert.equal(cpu.state[key],0x7F);assert.equal(cpu.state.tStates,4);assert.equal(cpu.state.r,1);
    assert.equal(r.mnemonic,`DEC ${decoder.REG8_NAMES[code]}`);
    checkBits(cpu.state.f,{S:false,Z:false,H:true,PV:true,N:true,C:true});
  }
}

// Memory read-modify-write: 11T = M1(4) + read(4) + write(3).
{
  const {bus,cpu}=fresh([0x34]);
  cpu.state.h=0;cpu.state.l=0x80;cpu.state.f=flags.FLAG_MASK.C;bus.debugPoke(0x0080,0x7F);
  cpu.step();
  assert.equal(bus.debugPeek(0x0080),0x80);assert.equal(cpu.state.tStates,11);assert.equal(cpu.state.r,1);
  assert.deepEqual(bus.trace.map(x=>x.purpose),['OPCODE_FETCH','MEMORY_REFRESH','DATA_READ','DATA_WRITE']);
  assert.deepEqual(bus.trace.map(x=>x.tState),[0,2,4,8]);
  checkBits(cpu.state.f,{S:true,Z:false,H:true,PV:true,N:false,C:true});
}
{
  const {bus,cpu}=fresh([0x35]);
  cpu.state.h=0;cpu.state.l=0x80;cpu.state.f=flags.FLAG_MASK.C;bus.debugPoke(0x0080,0x80);
  cpu.step();
  assert.equal(bus.debugPeek(0x0080),0x7F);assert.equal(cpu.state.tStates,11);assert.equal(cpu.state.r,1);
  assert.deepEqual(bus.trace.map(x=>x.tState),[0,2,4,8]);
  checkBits(cpu.state.f,{S:false,Z:false,H:true,PV:true,N:true,C:true});
}

// Teaching program: visible flag transitions.
{
  const program=[
    0x3E,0x7F,0x3C,
    0x06,0xFF,0x04,
    0x0E,0x80,0x0D,
    0x16,0x00,0x15,
    0x21,0x80,0x00,
    0x36,0x7F,0x34,0x35,0x00
  ];
  const {bus,cpu}=fresh(program);
  const mn=[];for(let i=0;i<13;i++)mn.push(cpu.step().mnemonic);
  assert.equal(cpu.state.a,0x80);
  assert.equal(cpu.state.b,0x00);
  assert.equal(cpu.state.c,0x7F);
  assert.equal(cpu.state.d,0xFF);
  assert.equal(cpu.getHL(),0x0080);
  assert.equal(bus.debugPeek(0x0080),0x7F);
  assert.equal(cpu.state.pc,program.length);
  assert.equal(cpu.state.r,13);
  assert.equal(cpu.state.tStates,90);
  assert.equal(mn[1],'INC A');
  assert.equal(mn[3],'INC B');
  assert.equal(mn[5],'DEC C');
  assert.equal(mn[7],'DEC D');
  assert.equal(mn[10],'INC (HL)');
  assert.equal(mn[11],'DEC (HL)');
  checkBits(cpu.state.f,{S:false,Z:false,H:true,PV:true,N:true,C:false});
}

console.log('SHINO Z80 PHASE 1B INC/DEC FLAGS: ALL TESTS PASS');
