'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core,coldState}=require('../src/cpu/z80/z80-core.js');
const {decodeED}=require('../src/cpu/z80/z80-decoder.js');
const {carryArithmetic16}=require('../src/cpu/z80/z80-flags.js');
const bus=new Shino80Bus({traceLimit:32}),cpu=new Z80Core(bus);
const parity=v=>v.toString(2).split('1').length%2===1;
function setup(op,state={}){
  Object.assign(cpu.state,coldState(),{pc:0x2000,h:0x40,l:0,sp:0xF000,r:0xFE,eiDelay:1},state);
  bus.load([0xED,op,0x00,0x50],0x2000);bus.clearTrace();return cpu.state;
}
const counts={};
for(let op=0;op<256;op++){
  const d=decodeED(op);counts[d.classification]=(counts[d.classification]||0)+1;
  const active=(op>=0x40&&op<=0x7F&&op!==0x77&&op!==0x7F)||[0xA0,0xA1,0xA2,0xA3,0xA8,0xA9,0xAA,0xAB,0xB0,0xB1,0xB2,0xB3,0xB8,0xB9,0xBA,0xBB].includes(op);
  assert.equal(d.classification==='unused',!active);
  const s=setup(op,{a:0xA5,f:0xFF,b:1,c:0x23,d:0x60,e:0});
  const before={...s};const result=cpu.step();
  assert.equal(s.instructions,1);assert.equal(s.eiDelay,0);
  assert.deepEqual(result.bytes.slice(0,2),[0xED,op]);
  assert.equal(s.r,op===0x4F?0xA5:0x80);
  assert.deepEqual(bus.trace.slice(0,4).map(e=>[e.purpose,e.tState]),[['OPCODE_FETCH',0],['MEMORY_REFRESH',2],['OPCODE_FETCH',4],['MEMORY_REFRESH',6]]);
  if(d.classification==='unused'){
    assert.equal(s.pc,0x2002);assert.equal(s.tStates,8);assert.equal(bus.trace.length,4);
    for(const key of Object.keys(before))if(!['pc','r','instructions','eiDelay','tStates'].includes(key))assert.equal(s[key],before[key]);
  }
}
assert.deepEqual(counts,{unused:178,defined:58,alias:18,undocumented:2});
// Independent signed arithmetic reference; all 16-bit left operands and edge right operands.
const signed=v=>v<32768?v:v-65536;let arithmeticCases=0;
for(let a=0;a<65536;a++)for(const b of [0,1,0xFFF,0x7FFF,0x8000,0xFFFF])for(const carry of [0,1])for(const subtract of [false,true]){
  const n=subtract?a-b-carry:a+b+carry,result=((n%65536)+65536)%65536;
  const sn=subtract?signed(a)-signed(b)-carry:signed(a)+signed(b)+carry;
  const half=subtract?a%4096<b%4096+carry:a%4096+b%4096+carry>4095;
  const f=(result>=32768?128:0)+(result===0?64:0)+(half?16:0)+(sn< -32768||sn>32767?4:0)+(subtract?2:0)+(n<0||n>65535?1:0);
  const got=carryArithmetic16(0xFE|carry,a,b,subtract);
  assert.equal(got.result,result);assert.equal(got.f&0xD7,f);arithmeticCases++;
}
for(const op of [0x42,0x52,0x62,0x72,0x4A,0x5A,0x6A,0x7A]){
  setup(op,{h:0x80,l:0,b:0,c:1,d:0,e:1,sp:1,f:1});const rhs=cpu.getPair16((op>>4)&3);
  const s=cpu.state;cpu.step();assert.equal(cpu.getHL(),(op&8?0x8000+rhs+1:0x8000-rhs-1)&65535);assert.equal(s.tStates,15);
}
// All A/memory byte combinations in both nibble directions.
for(const op of [0x67,0x6F])for(let a=0;a<256;a++)for(let v=0;v<256;v++){
  const s=setup(op,{a,f:1});bus.memory[0x4000]=v;cpu.step();
  const expectedA=Math.floor(a/16)*16+(op===0x67?v%16:Math.floor(v/16));
  const expectedM=op===0x67?(a%16)*16+Math.floor(v/16):(v%16)*16+a%16;
  assert.equal(s.a,expectedA);assert.equal(bus.memory[0x4000],expectedM);
  assert.equal(s.f&0xD7,(expectedA&128)|(expectedA===0?64:0)|(parity(expectedA)?4:0)|1);
  assert.equal(s.tStates,18);
}
// NEG aliases, full byte domain.
for(const op of [0x44,0x4C,0x54,0x5C,0x64,0x6C,0x74,0x7C])for(let a=0;a<256;a++){
  const s=setup(op,{a});cpu.step();assert.equal(s.a,(-a)&255);
  assert.equal(s.f&0xD7,(s.a&128)|(a===0?64:0)|(a%16?16:0)|(a===128?4:0)|2|(a?1:0));
}
// I/R use post-fetch R; parity is IFF2, not arithmetic parity.
for(const op of [0x47,0x4F,0x57,0x5F])for(const iff2 of [false,true]){
  const s=setup(op,{a:0x35,i:0,iff2,f:0xFF});cpu.step();assert.equal(s.tStates,9);
  if(op===0x47){assert.equal(s.i,0x35);assert.equal(s.f,255);}
  if(op===0x4F){assert.equal(s.r,0x35);assert.equal(s.f,255);}
  if(op===0x57||op===0x5F){assert.equal(s.a,op===0x57?0:128);assert.equal(s.f&0xD7,(op===0x57?64:128)|(iff2?4:0)|1);}
}
for(const [op,mode] of [[0x46,0],[0x4E,0],[0x56,1],[0x5E,2],[0x66,0],[0x6E,0],[0x76,1],[0x7E,2]]){const s=setup(op,{f:255});cpu.step();assert.equal(s.im,mode);assert.equal(s.f,255);}
for(const op of [0x45,0x4D,0x55,0x5D,0x65,0x6D,0x75,0x7D])for(const iff2 of [false,true]){
  const s=setup(op,{sp:65535,iff1:!iff2,iff2,f:255});bus.memory[65535]=0x34;bus.memory[0]=0x12;
  cpu.step();assert.equal(s.pc,0x1234);assert.equal(s.sp,1);assert.equal(s.iff1,iff2);assert.equal(s.iff2,iff2);assert.equal(s.f,255);assert.equal(s.tStates,14);
}
// Word memory transfers include SP and address wrap; all flags retained.
for(const pair of [0,1,2,3])for(const load of [false,true]){
  const s=setup(0x43+pair*16+(load?8:0),{f:255});bus.load([255,255],0x2002);
  cpu.setPair16(pair,0xABCD);bus.memory[65535]=0x34;bus.memory[0]=0x12;cpu.step();
  if(load)assert.equal(cpu.getPair16(pair),0x1234);else{assert.equal(bus.memory[65535],0xCD);assert.equal(bus.memory[0],0xAB);}
  assert.equal(s.pc,0x2004);assert.equal(s.tStates,20);assert.equal(s.f,255);
}
// Input captures the original BC even when B/C is the destination; output 71 is zero (NMOS).
for(let reg=0;reg<8;reg++)for(const output of [false,true]){
  const s=setup(0x40+reg*8+(output?1:0),{b:0x31,c:0x20,f:255});bus.ioPorts[0x3120]=0x80;
  const value=reg===6?0:cpu.getReg8(reg);cpu.step();const event=bus.trace.find(e=>e.space==='IO');
  assert.equal(event.address,0x3120);assert.equal(event.data,output?value:0x80);assert.equal(event.tState,8);assert.equal(s.tStates,12);
  if(output)assert.equal(s.f,255);else{assert.equal(s.f&0xD7,129);if(reg!==6)assert.equal(cpu.getReg8(reg),128);else assert.equal(cpu.getHL(),0x4000);}
}
// Transfer/search: both directions, repeat/terminal, zero count wraps, and early match.
for(const op of [0xA0,0xA8,0xB0,0xB8,0xA1,0xA9,0xB1,0xB9])for(const count of [0,1,2])for(const equal of [false,true]){
  const dir=op&8?-1:1,search=!!(op&1),s=setup(op,{a:0x10,b:count>>8,c:count&255,d:0x60,e:0,f:0xFF});bus.memory[0x4000]=equal?0x10:0x01;
  cpu.step();const remaining=(count-1)&65535,repeat=!!(op&16)&&remaining!==0&&(!search||!equal);
  assert.equal(cpu.getBC(),remaining);assert.equal(cpu.getHL(),0x4000+dir);assert.equal(s.a,0x10);
  assert.equal(s.pc,repeat?0x2000:0x2002);assert.equal(s.tStates,repeat?21:16);assert.equal(s.f&1,1);assert.equal(!!(s.f&4),remaining!==0);
  if(search){assert.equal(cpu.getDE(),0x6000);assert.equal(!!(s.f&64),equal);assert(!bus.trace.some(e=>e.operation==='WRITE'));}
  else{assert.equal(cpu.getDE(),0x6000+dir);assert.equal(bus.memory[0x6000],equal?0x10:1);assert.equal(s.f&0xD3,0xC1);}
}
// End-to-end two-iteration LDIR, then fetched next instruction.
setup(0xB0,{b:0,c:2,d:0x60,e:0});bus.load([0x12,0x34],0x4000);bus.memory[0x2002]=0;
cpu.step();assert.equal(cpu.state.pc,0x2000);cpu.step();assert.equal(cpu.state.pc,0x2002);assert.equal(cpu.state.tStates,37);assert.deepEqual([...bus.memory.slice(0x6000,0x6002)],[0x12,0x34]);cpu.step();assert.equal(cpu.state.pc,0x2003);
// Block I/O order: input old B, output decremented B. Only one operation per step.
for(const op of [0xA2,0xAA,0xB2,0xBA,0xA3,0xAB,0xB3,0xBB])for(const b of [0,1,2,16,128,255]){
  const out=!!(op&1),dir=op&8?-1:1,s=setup(op,{b,c:0xFF,h:0x40,l:dir===1?255:0});
  const address=cpu.getHL(),newB=(b-1)&255,port=((out?newB:b)<<8)|255;bus.ioPorts[port]=0x81;bus.memory[address]=0x81;
  cpu.step();const events=bus.trace.filter(e=>e.space==='IO');assert.equal(events.length,1);assert.equal(events[0].address,port);assert.equal(events[0].data,0x81);
  assert.equal(s.b,newB);assert.equal(cpu.getHL(),(address+dir)&65535);assert.equal(s.pc,(op&16)&&newB?0x2000:0x2002);assert.equal(s.tStates,(op&16)&&newB?21:16);
  const dataEvents=bus.trace.filter(e=>e.space==='IO'||e.purpose==='DATA_READ'||e.purpose==='DATA_WRITE');
  assert.deepEqual(dataEvents.map(e=>e.operation),['READ','WRITE']);assert.equal(dataEvents[0].space,out?'MEMORY':'IO');
}
// PC prefix wrap and protected writes (word, nibble, transfer, block input).
setup(0x44,{pc:65535,a:1});bus.memory[65535]=0xED;bus.memory[0]=0x44;cpu.step();assert.equal(cpu.state.pc,1);
for(const op of [0x43,0x67,0xA0,0xA2]){
  const protectedBus=new Shino80Bus({romRanges:[[0,8191]]}),c=new Z80Core(protectedBus);
  protectedBus.load([0xED,op,0,0x10],0x2000);protectedBus.memory[0x1000]=0xA5;
  Object.assign(c.state,{pc:0x2000,h:0x10,l:0,d:0x10,e:0,b:1,c:0,a:0});c.step();
  assert.equal(protectedBus.memory[0x1000],0xA5);assert(protectedBus.trace.some(e=>e.operation==='WRITE_BLOCKED'));
}
console.log(`PHASE 1G ED: 256 classified slots, ${arithmeticCases} arithmetic cases, 131072 nibble cases, semantic/bus regressions PASS`);
