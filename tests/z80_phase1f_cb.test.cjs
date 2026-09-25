'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {decodeCB,REG8_KEYS}=require('../src/cpu/z80/z80-decoder.js');
function reference(op,v,f){
 const group=op>>6,bit=(op>>3)&7;let value=v,flags=f,carry;
 if(group===0){
  carry=bit===1||bit===3||bit===5||bit===7?v%2:Math.floor(v/128);
  value=[(v*2+Math.floor(v/128))%256,Math.floor(v/2)+(v%2)*128,(v*2+(f&1))%256,Math.floor(v/2)+(f&1)*128,(v*2)%256,Math.floor(v/2)+(v&128),(v*2+1)%256,Math.floor(v/2)][bit];
  const parity=value.toString(2).split('1').length%2===1;
  flags=(value&128)|(value===0?64:0)|(parity?4:0)|carry;
 }else if(group===1){const set=(v&(2**bit))!==0;flags=(f&1)|16|(set?0:68)|(set&&bit===7?128:0);}
 else value=group===2?v&~(2**bit):v|(2**bit);
 return {value,flags};
}
const bus=new Shino80Bus({traceLimit:16}),cpu=new Z80Core(bus);
// All encodings x all byte values x both carries: independent documented-flag formula.
for(let op=0;op<256;op++)for(let v=0;v<256;v++)for(let carry=0;carry<2;carry++){
 const s=cpu.state,target=op&7,oldF=0xFE|carry,expected=reference(op,v,oldF);
 Object.assign(s,{pc:0x2000,h:0x40,l:0,sp:0xF000,f:oldF,r:0xFE,i:0x31,eiDelay:1,tStates:0,instructions:0,halted:false});
 bus.memory[0x2000]=0xCB;bus.memory[0x2001]=op;
 if(target===6)bus.memory[0x4000]=v;else s[REG8_KEYS[target]]=v;
 const effective=cpu.getHL();bus.clearTrace();const result=cpu.step();
 assert.equal(target===6?bus.memory[effective]:s[REG8_KEYS[target]],expected.value);
 assert.equal(s.f&0xD7,expected.flags&0xD7,`CB ${op.toString(16)} value ${v} carry ${carry}`);
 if(op>=128)assert.equal(s.f,oldF,'RES/SET preserve all flags');
 assert.equal(s.pc,0x2002);assert.equal(s.r,0x80);assert.equal(s.eiDelay,0);assert.equal(s.instructions,1);
 const cycles=target===6?(op>=64&&op<128?12:15):8;
 assert.equal(s.tStates,cycles);assert.equal(result.mnemonic,decodeCB(op).mnemonic);assert.deepEqual(result.bytes,[0xCB,op]);
 const events=bus.trace;
 assert.deepEqual(events.slice(0,4).map(e=>[e.purpose,e.tState]),[['OPCODE_FETCH',0],['MEMORY_REFRESH',2],['OPCODE_FETCH',4],['MEMORY_REFRESH',6]]);
 assert.equal(events.length,target===6?(op>=64&&op<128?5:6):4);
 if(target===6){assert.equal(events[4].address,effective);assert.equal(events[4].tState,8);if(events.length===6)assert.equal(events[5].tState,12);}
}
// Prefix fetch wraps PC; BIT cannot write, other (HL) operations honor ROM guards.
cpu.state.pc=65535;cpu.state.halted=false;bus.memory[65535]=0xCB;bus.memory[0]=0x00;cpu.step();assert.equal(cpu.state.pc,1);
const protectedBus=new Shino80Bus({romRanges:[[0,8191]]}),protectedCpu=new Z80Core(protectedBus);
protectedBus.load([0xCB,0x86],0x2000);protectedBus.memory[0x1000]=255;
Object.assign(protectedCpu.state,{pc:0x2000,h:0x10,l:0});protectedCpu.step();
assert.equal(protectedBus.memory[0x1000],255);assert(protectedBus.trace.some(e=>e.operation==='WRITE_BLOCKED'));
console.log('PHASE 1F CB: 256 encodings / 131072 exhaustive input cases PASS');
