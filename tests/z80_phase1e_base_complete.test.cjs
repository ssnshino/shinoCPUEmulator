'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {FLAG_MASK}=require('../src/cpu/z80/z80-flags.js');
const decoder=require('../src/cpu/z80/z80-decoder.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');

const PREFIXES=new Set([0xCB,0xDD,0xED,0xFD]);

function fresh(bytes=[0x00]){
  const bus=new Shino80Bus({traceLimit:4096});
  const cpu=new Z80Core(bus);
  bus.load(bytes,0);
  cpu.reset();bus.clearTrace();
  cpu.state.sp=0x9000;
  cpu.state.h=0x80;cpu.state.l=0x00;
  return {bus,cpu};
}

function flags(f){return f&0xD7;} // documented S/Z/H/PV/N/C only

// Every BASE slot must decode. Only the four prefix introducers are deferred.
{
  const missing=[];
  for(let op=0;op<256;op++)if(!decoder.decodeBase(op))missing.push(op);
  assert.deepEqual(missing,[]);
  for(const op of PREFIXES)assert.equal(decoder.decodeBase(op).kind,'PREFIX');
}

// Every non-prefix BASE opcode must execute one instruction without throwing.
{
  const failures=[];
  for(let op=0;op<256;op++){
    if(PREFIXES.has(op))continue;
    const {bus,cpu}=fresh([op,0x00,0x80,0x00]);
    cpu.state.a=0x12;cpu.state.f=FLAG_MASK.C;
    bus.debugPoke(0x9000,0x34);bus.debugPoke(0x9001,0x12);
    try{
      const r=cpu.step();
      if(!Number.isFinite(r.tStates))failures.push([op,'timing']);
    }catch(e){failures.push([op,String(e.message||e)]);}
  }
  assert.deepEqual(failures,[]);
}

// Prefixes are recognized but intentionally delegated to later phases.
for(const op of [0xDD,0xED,0xFD]){
  const {cpu}=fresh([op,0x00]);
  assert.throws(()=>cpu.step(),/UNIMPLEMENTED PREFIX/);
}

// 8-bit ALU boundary behavior.
{
  let x=fresh([0x3E,0x7F,0xC6,0x01]);x.cpu.step();x.cpu.step();
  assert.equal(x.cpu.state.a,0x80);assert.equal(flags(x.cpu.state.f),0x94);

  x=fresh([0x3E,0xFF,0x37,0xCE,0x00]);for(let i=0;i<4;i++)x.cpu.step();
  assert.equal(x.cpu.state.a,0x00);assert.equal(flags(x.cpu.state.f),0x51);

  x=fresh([0x3E,0x80,0xD6,0x01]);x.cpu.step();x.cpu.step();
  assert.equal(x.cpu.state.a,0x7F);assert.equal(flags(x.cpu.state.f),0x16);

  x=fresh([0x3E,0x00,0x37,0xDE,0x00]);for(let i=0;i<4;i++)x.cpu.step();
  assert.equal(x.cpu.state.a,0xFF);assert.equal(flags(x.cpu.state.f),0x93);

  x=fresh([0x3E,0xF0,0xE6,0x0F]);x.cpu.step();x.cpu.step();
  assert.equal(x.cpu.state.a,0);assert.equal(flags(x.cpu.state.f),0x54);

  x=fresh([0x3E,0xFF,0xEE,0xFF]);x.cpu.step();x.cpu.step();
  assert.equal(x.cpu.state.a,0);assert.equal(flags(x.cpu.state.f),0x44);

  x=fresh([0x3E,0x80,0xF6,0x01]);x.cpu.step();x.cpu.step();
  assert.equal(x.cpu.state.a,0x81);assert.equal(flags(x.cpu.state.f),0x84);

  x=fresh([0x3E,0x00,0xFE,0x01]);x.cpu.step();x.cpu.step();
  assert.equal(x.cpu.state.a,0);assert.equal(flags(x.cpu.state.f),0x93);
}

// DAA: 15 + 27 BCD -> 42.
{
  const {cpu}=fresh([0x3E,0x15,0xC6,0x27,0x27]);
  cpu.step();cpu.step();cpu.step();
  assert.equal(cpu.state.a,0x42);
}

// Accumulator rotates preserve S/Z/PV and update carry.
{
  const {cpu}=fresh([0x07]);
  cpu.state.a=0x81;cpu.state.f=FLAG_MASK.Z|FLAG_MASK.PV;
  cpu.step();
  assert.equal(cpu.state.a,0x03);
  assert.equal(flags(cpu.state.f),FLAG_MASK.Z|FLAG_MASK.PV|FLAG_MASK.C);
}

// CPL / SCF / CCF documented bits.
{
  let x=fresh([0x2F]);x.cpu.state.a=0x55;x.cpu.state.f=FLAG_MASK.Z|FLAG_MASK.C;x.cpu.step();
  assert.equal(x.cpu.state.a,0xAA);assert.equal(flags(x.cpu.state.f),0x53);

  x=fresh([0x37]);x.cpu.state.f=FLAG_MASK.Z|FLAG_MASK.H|FLAG_MASK.N;x.cpu.step();
  assert.equal(flags(x.cpu.state.f),FLAG_MASK.Z|FLAG_MASK.C);

  x=fresh([0x3F]);x.cpu.state.f=FLAG_MASK.Z|FLAG_MASK.C;x.cpu.step();
  assert.equal(flags(x.cpu.state.f),FLAG_MASK.Z|FLAG_MASK.H);
}

// 16-bit INC/DEC do not alter flags; ADD HL updates H/N/C while preserving S/Z/PV.
{
  let x=fresh([0x03,0x0B]);x.cpu.state.b=0x12;x.cpu.state.c=0xFF;x.cpu.state.f=0xA5;
  x.cpu.step();assert.equal((x.cpu.state.b<<8)|x.cpu.state.c,0x1300);assert.equal(x.cpu.state.f,0xA5);
  x.cpu.step();assert.equal((x.cpu.state.b<<8)|x.cpu.state.c,0x12FF);assert.equal(x.cpu.state.f,0xA5);

  x=fresh([0x09]);x.cpu.state.h=0x0F;x.cpu.state.l=0xFF;x.cpu.state.b=0;x.cpu.state.c=1;
  x.cpu.state.f=FLAG_MASK.S|FLAG_MASK.Z|FLAG_MASK.PV|FLAG_MASK.N|FLAG_MASK.C;
  x.cpu.step();
  assert.equal(x.cpu.getHL(),0x1000);
  assert.equal(flags(x.cpu.state.f),FLAG_MASK.S|FLAG_MASK.Z|FLAG_MASK.PV|FLAG_MASK.H);
}

// Absolute 16-bit HL load/store and LD SP,HL.
{
  let x=fresh([0x22,0x00,0x80]);x.cpu.state.h=0x12;x.cpu.state.l=0x34;x.cpu.step();
  assert.equal(x.bus.debugPeek(0x8000),0x34);assert.equal(x.bus.debugPeek(0x8001),0x12);assert.equal(x.cpu.state.tStates,16);

  x=fresh([0x2A,0x00,0x80]);x.bus.debugPoke(0x8000,0x78);x.bus.debugPoke(0x8001,0x56);x.cpu.step();
  assert.equal(x.cpu.getHL(),0x5678);assert.equal(x.cpu.state.tStates,16);

  x=fresh([0xF9]);x.cpu.state.h=0xAB;x.cpu.state.l=0xCD;x.cpu.step();
  assert.equal(x.cpu.state.sp,0xABCD);assert.equal(x.cpu.state.tStates,6);
}

// Exchange family.
{
  let x=fresh([0x08]);x.cpu.state.a=1;x.cpu.state.f=2;x.cpu.state.aAlt=3;x.cpu.state.fAlt=4;x.cpu.step();
  assert.deepEqual([x.cpu.state.a,x.cpu.state.f,x.cpu.state.aAlt,x.cpu.state.fAlt],[3,4,1,2]);

  x=fresh([0xD9]);Object.assign(x.cpu.state,{b:1,c:2,d:3,e:4,h:5,l:6,bAlt:7,cAlt:8,dAlt:9,eAlt:10,hAlt:11,lAlt:12});x.cpu.step();
  assert.deepEqual([x.cpu.state.b,x.cpu.state.c,x.cpu.state.d,x.cpu.state.e,x.cpu.state.h,x.cpu.state.l],[7,8,9,10,11,12]);

  x=fresh([0xEB]);Object.assign(x.cpu.state,{d:0x12,e:0x34,h:0x56,l:0x78});x.cpu.step();
  assert.equal(x.cpu.getDE(),0x5678);assert.equal(x.cpu.getHL(),0x1234);

  x=fresh([0xE3]);x.cpu.state.sp=0x9000;x.cpu.state.h=0x12;x.cpu.state.l=0x34;
  x.bus.debugPoke(0x9000,0x78);x.bus.debugPoke(0x9001,0x56);x.cpu.step();
  assert.equal(x.cpu.getHL(),0x5678);assert.equal(x.bus.debugPeek(0x9000),0x34);assert.equal(x.bus.debugPeek(0x9001),0x12);
  assert.equal(x.cpu.state.tStates,19);
}

// PUSH / POP all qq pairs.
{
  const pushOps=[0xC5,0xD5,0xE5,0xF5],popOps=[0xC1,0xD1,0xE1,0xF1];
  for(let p=0;p<4;p++){
    const {cpu}=fresh([pushOps[p],popOps[p]]);
    cpu.state.sp=0x9000;
    cpu.setStackPair(p,0xA100+p);
    cpu.step();
    assert.equal(cpu.state.sp,0x8FFE);
    cpu.setStackPair(p,0);
    cpu.step();
    assert.equal(cpu.getStackPair(p),0xA100+p);
    assert.equal(cpu.state.sp,0x9000);
  }
}

// All eight conditions for JP/CALL/RET.
const conds=['NZ','Z','NC','C','PO','PE','P','M'];
function setCond(cpu,cond,truth){
  cpu.state.f=0;
  const map={NZ:['Z',false],Z:['Z',true],NC:['C',false],C:['C',true],PO:['PV',false],PE:['PV',true],P:['S',false],M:['S',true]};
  const [bitName,positive]=map[cond],mask=FLAG_MASK[bitName];
  const bit=truth?positive:!positive;
  if(bit)cpu.state.f|=mask;
}
for(let i=0;i<8;i++){
  const jp=0xC2+(i<<3),call=0xC4+(i<<3),ret=0xC0+(i<<3),cond=conds[i];

  let x=fresh([jp,0x34,0x12]);setCond(x.cpu,cond,true);let r=x.cpu.step();
  assert.equal(x.cpu.state.pc,0x1234);assert.equal(r.branchTaken,true);assert.equal(x.cpu.state.tStates,10);
  x=fresh([jp,0x34,0x12]);setCond(x.cpu,cond,false);r=x.cpu.step();
  assert.equal(x.cpu.state.pc,3);assert.equal(r.branchTaken,false);assert.equal(x.cpu.state.tStates,10);

  x=fresh([call,0x34,0x12]);x.cpu.state.sp=0x9000;setCond(x.cpu,cond,true);r=x.cpu.step();
  assert.equal(x.cpu.state.pc,0x1234);assert.equal(x.cpu.state.sp,0x8FFE);assert.equal(x.cpu.state.tStates,17);
  x=fresh([call,0x34,0x12]);x.cpu.state.sp=0x9000;setCond(x.cpu,cond,false);r=x.cpu.step();
  assert.equal(x.cpu.state.pc,3);assert.equal(x.cpu.state.sp,0x9000);assert.equal(x.cpu.state.tStates,10);

  x=fresh([ret]);x.cpu.state.sp=0x9000;x.bus.debugPoke(0x9000,0x34);x.bus.debugPoke(0x9001,0x12);setCond(x.cpu,cond,true);r=x.cpu.step();
  assert.equal(x.cpu.state.pc,0x1234);assert.equal(x.cpu.state.sp,0x9002);assert.equal(x.cpu.state.tStates,11);
  x=fresh([ret]);x.cpu.state.sp=0x9000;setCond(x.cpu,cond,false);r=x.cpu.step();
  assert.equal(x.cpu.state.pc,1);assert.equal(x.cpu.state.sp,0x9000);assert.equal(x.cpu.state.tStates,5);
}

// RST vectors.
for(let i=0;i<8;i++){
  const op=0xC7+(i<<3),vector=i*8;
  const {bus,cpu}=fresh([op]);cpu.state.sp=0x9000;cpu.step();
  assert.equal(cpu.state.pc,vector);assert.equal(cpu.state.sp,0x8FFE);
  assert.equal(bus.debugPeek(0x8FFE),0x01);assert.equal(bus.debugPeek(0x8FFF),0x00);
  assert.equal(cpu.state.tStates,11);
}

// I/O address uses A as upper byte and immediate n as lower byte. Flags unaffected.
{
  let x=fresh([0xDB,0x34]);x.cpu.state.a=0x12;x.cpu.state.f=0xA5;x.bus.debugIoPoke(0x1234,0xA5);x.cpu.step();
  assert.equal(x.cpu.state.a,0xA5);assert.equal(x.cpu.state.f,0xA5);
  assert.equal(x.bus.trace.find(e=>e.space==='IO').address,0x1234);

  x=fresh([0xD3,0x34]);x.cpu.state.a=0x12;x.cpu.state.f=0xA5;x.cpu.step();
  assert.equal(x.bus.debugIoPeek(0x1234),0x12);assert.equal(x.cpu.state.f,0xA5);
  assert.equal(x.bus.trace.find(e=>e.space==='IO').address,0x1234);
}

// HALT executes, then repeats 4T HALT cycles without advancing PC.
{
  const {bus,cpu}=fresh([0x76,0x00]);
  cpu.step();assert.equal(cpu.state.halted,true);assert.equal(cpu.state.pc,1);assert.equal(cpu.state.tStates,4);assert.equal(cpu.state.r,1);
  cpu.step();assert.equal(cpu.state.pc,1);assert.equal(cpu.state.tStates,8);assert.equal(cpu.state.r,2);
  assert(bus.trace.some(e=>e.purpose==='HALT_FETCH'));
}

// DI / EI functional state plus EI-delay marker for future interrupt phase.
{
  const {cpu}=fresh([0xFB,0x00,0xF3]);
  cpu.step();assert.equal(cpu.state.iff1,true);assert.equal(cpu.state.iff2,true);assert.equal(cpu.state.eiDelay,1);
  cpu.step();assert.equal(cpu.state.eiDelay,0);
  cpu.step();assert.equal(cpu.state.iff1,false);assert.equal(cpu.state.iff2,false);
}

console.log('SHINO Z80 PHASE 1E BASE: 252/252 NON-PREFIX OPCODES PASS');
