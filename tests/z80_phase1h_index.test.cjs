'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core,coldState}=require('../src/cpu/z80/z80-core.js');
const {decodeIndex}=require('../src/cpu/z80/z80-decoder.js');
const bus=new Shino80Bus({traceLimit:32}),cpu=new Z80Core(bus);
function setup(prefix,op,state={},extra=[0,0x50]){
  Object.assign(cpu.state,coldState(),{pc:0x2000,ix:0x4100,iy:0x4200,h:0x30,l:0x10,sp:0xF000,r:0xFE,eiDelay:1},state);
  bus.load([prefix,op,...extra],0x2000);bus.clearTrace();return cpu.state;
}
const special=new Set([0x09,0x19,0x21,0x22,0x23,0x24,0x25,0x26,0x29,0x2A,0x2B,0x2C,0x2D,0x2E,0x34,0x35,0x36,0x39,0xE1,0xE3,0xE5,0xE9,0xF9]);
function affected(op){return special.has(op)||(op>=0x40&&op<0x80&&op!==0x76&&([4,5,6].includes((op>>3)&7)||[4,5,6].includes(op&7)))||(op>=0x80&&op<0xC0&&[4,5,6].includes(op&7));}
let slotCases=0,displacementCases=0;
for(const [prefix,key,other] of [[0xDD,'ix','iy'],[0xFD,'iy','ix']]){
  const index=key.toUpperCase();
  for(let op=0;op<256;op++){
    if([0xCB,0xDD,0xED,0xFD].includes(op))continue;
    const desc=decodeIndex(op,index);assert.equal(desc.affected,affected(op));
    const s=setup(prefix,op,{a:0x36,b:1,c:2,d:0x60,e:0});const saved=s[other];
    cpu.step();assert.equal(s[other],saved);assert.equal(s.instructions,1);assert.equal(s.r,0x80);assert.equal(s.eiDelay,op===0xFB?1:0);
    assert.deepEqual(bus.trace.slice(0,4).map(e=>[e.purpose,e.tState]),[['OPCODE_FETCH',0],['MEMORY_REFRESH',2],['OPCODE_FETCH',4],['MEMORY_REFRESH',6]]);
    slotCases++;
    // Unaffected instructions must match ordinary BASE, including taken/untaken timings.
    if(!affected(op))for(const flags of [0,0xD7]){
      const b0=new Shino80Bus({traceLimit:32}),b1=new Shino80Bus({traceLimit:32});
      b0.memory.fill(0x55);b1.memory.fill(0x55);b0.load([op,0,0x50],0x2001);b1.load([prefix,op,0,0x50],0x2000);
      const c0=new Z80Core(b0),c1=new Z80Core(b1);const initial={a:0x36,f:flags,b:2,c:0,d:0x60,e:0,h:0x30,l:0,ix:0x4100,iy:0x4200,sp:0xF000,r:10};
      Object.assign(c0.state,initial,{pc:0x2001});Object.assign(c1.state,initial,{pc:0x2000});c0.step();c1.step();
      for(const k of Object.keys(c0.state))assert.equal(c1.state[k],k==='r'?c0.state[k]+1:k==='tStates'?c0.state[k]+4:c0.state[k],`fallback ${index} ${op.toString(16)} ${k}`);
      b0.memory[0x2000]=prefix;assert.deepEqual(b1.memory,b0.memory);assert.deepEqual(b1.ioPorts,b0.ioPorts);
    }
  }
  // Signed displacements and wrap, preserving index and real H/L exception semantics.
  for(const origin of [0,0x0040,0x7FFF,0xFFFF])for(let d=0;d<256;d++)for(const op of [0x46,0x66,0x6E,0x70,0x74,0x75,0x36,0x34,0x35,0x86]){
    const s=setup(prefix,op,{[key]:origin,a:1,b:0x27,h:0xA3,l:0x5C,f:1},[d,0x9A]);
    const address=(origin+(d<128?d:d-256))&65535;bus.memory[address]=0x7F;cpu.step();
    assert.equal(s[key],origin);assert.equal(s.pc,op===0x36?0x2004:0x2003);assert.equal(s.tStates,[0x34,0x35].includes(op)?23:19);
    const expectedWrite={0x70:0x27,0x74:0xA3,0x75:0x5C,0x36:0x9A,0x34:0x80,0x35:0x7E}[op];
    if(expectedWrite!==undefined)assert.equal(bus.memory[address],expectedWrite);
    if(op===0x46)assert.equal(s.b,0x7F);if(op===0x66)assert.equal(s.h,0x7F);if(op===0x6E)assert.equal(s.l,0x7F);if(op===0x86)assert.equal(s.a,0x80);
    const data=bus.trace.filter(e=>e.purpose==='DATA_READ'||e.purpose==='DATA_WRITE');assert(data.every(e=>e.address===address));assert.equal(data[0].tState,16);
    if([0x34,0x35].includes(op))assert.equal(data[1].tState,20);
    displacementCases++;
  }
  // Index-half INC/DEC independently calculate byte result and documented flags.
  for(const op of [0x24,0x25,0x2C,0x2D])for(let v=0;v<256;v++)for(const carry of [0,1]){
    const high=op<0x28,dec=!!(op&1),s=setup(prefix,op,{[key]:high?(v<<8)|0x5A:0xA500|v,f:carry});cpu.step();
    const result=(v+(dec?-1:1))&255;
    assert.equal(s[key],high?(result<<8)|0x5A:0xA500|result);assert.equal(cpu.getHL(),0x3010);
    const f=(result&128)|(result===0?64:0)|((v%16===(dec?0:15))?16:0)|(v===(dec?128:127)?4:0)|(dec?2:0)|carry;
    assert.equal(s.f&0xD7,f);assert.equal(s.tStates,8);
  }
  // Half moves use index halves only in register-to-register forms.
  for(const [op,expected] of [[0x65,0xCDCD],[0x6C,0xABAB],[0x26,0x12CD],[0x2E,0xAB12]]){
    const s=setup(prefix,op,{[key]:0xABCD},[0x12]);cpu.step();assert.equal(s[key],expected);assert.equal(cpu.getHL(),0x3010);
  }
  // Pair operations and stack wrap.
  let s=setup(prefix,0x21,{},[0x34,0x12]);cpu.step();assert.equal(s[key],0x1234);assert.equal(s.tStates,14);
  for(const [op,value,expected] of [[0x23,65535,0],[0x2B,0,65535],[0x29,0x8000,0]]){s=setup(prefix,op,{[key]:value});cpu.step();assert.equal(s[key],expected);}
  for(const load of [false,true]){s=setup(prefix,load?0x2A:0x22,{[key]:0xABCD},[255,255]);bus.memory[65535]=0x34;bus.memory[0]=0x12;cpu.step();assert.equal(s.tStates,20);if(load)assert.equal(s[key],0x1234);else{assert.equal(bus.memory[65535],0xCD);assert.equal(bus.memory[0],0xAB);}}
  s=setup(prefix,0xE5,{[key]:0xABCD,sp:1});cpu.step();assert.equal(s.sp,65535);assert.equal(bus.memory[0],0xAB);assert.equal(bus.memory[65535],0xCD);assert.equal(s.tStates,15);
  s=setup(prefix,0xE1,{sp:65535});cpu.step();assert.equal(s[key],0xABCD);assert.equal(s.sp,1);assert.equal(s.tStates,14);
  s=setup(prefix,0xE3,{sp:65535,[key]:0x1234});cpu.step();assert.equal(s[key],0xABCD);assert.equal(bus.memory[65535],0x34);assert.equal(bus.memory[0],0x12);assert.equal(s.tStates,23);
  s=setup(prefix,0xE9,{[key]:0x1234});cpu.step();assert.equal(s.pc,0x1234);assert.equal(s.tStates,8);
  s=setup(prefix,0xF9,{[key]:0x1234});cpu.step();assert.equal(s.sp,0x1234);assert.equal(s.tStates,10);
  // HALT consumes no displacement; subsequent HALT cycle is still 4T / one R increment.
  s=setup(prefix,0x76);cpu.step();assert.equal(s.pc,0x2002);assert.equal(s.tStates,8);cpu.step();assert.equal(s.tStates,12);assert.equal(s.r,0x81);
  s=setup(prefix,0xFB);cpu.step();assert.equal(s.eiDelay,1);bus.memory[0x2002]=0;cpu.step();assert.equal(s.eiDelay,0);
  setup(prefix,0xCB,{},[0,0]);assert.equal(cpu.step().tStates,23);
  const pb=new Shino80Bus({romRanges:[[0,8191]]}),pc=new Z80Core(pb);pb.load([prefix,0x36,255,0],0x2000);pb.memory[0x1000]=0x55;Object.assign(pc.state,{pc:0x2000,[key]:0x1001});pc.step();assert.equal(pb.memory[0x1000],0x55);assert(pb.trace.some(e=>e.operation==='WRITE_BLOCKED'));
}
// Repeated prefixes: last index wins, R and T include every fetch, one retirement.
let s=setup(0xDD,0xFD,{},[0xDD,0x21,0x34,0x12]);cpu.step();assert.equal(s.ix,0x1234);assert.equal(s.iy,0x4200);assert.equal(s.r,0x82);assert.equal(s.tStates,22);assert.equal(s.instructions,1);
s=setup(0xDD,0xFD,{},[0x21,0x78,0x56]);cpu.step();assert.equal(s.iy,0x5678);assert.equal(s.ix,0x4100);assert.equal(s.tStates,18);
// Ignored prefix before ED uses real HL, and block repeat goes back to ED, not DD.
s=setup(0xDD,0xED,{b:0,c:2,d:0x60,e:0},[0xB0]);bus.memory[0x3010]=0x12;bus.memory[0x3011]=0x34;cpu.step();assert.equal(s.pc,0x2001);assert.equal(s.tStates,25);assert.equal(s.ix,0x4100);assert.equal(bus.memory[0x6000],0x12);cpu.step();assert.equal(s.tStates,41);assert.equal(bus.memory[0x6001],0x34);
// Prefix fetch wraps across FFFF and does not alter the other index.
s=setup(0xDD,0x00,{pc:65535});bus.memory[65535]=0xFD;bus.memory[0]=0x23;cpu.step();assert.equal(s.iy,0x4201);assert.equal(s.pc,1);
const guardBus=new Shino80Bus({traceLimit:0}),guardCpu=new Z80Core(guardBus);guardBus.memory.fill(0xDD);assert.throws(()=>guardCpu.step(),/PREFIX STREAM/);
console.log(`PHASE 1H DD/FD: ${slotCases} terminal slots, ${displacementCases} displacement cases, halves/fallback/stack/prefix/EI/ROM PASS`);
