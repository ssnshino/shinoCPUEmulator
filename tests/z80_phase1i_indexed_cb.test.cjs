'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core,coldState}=require('../src/cpu/z80/z80-core.js');
const {decodeIndexedCB}=require('../src/cpu/z80/z80-decoder.js');
const regs=['b','c','d','e','h','l',null,'a'];
// Numeric reference independent of CPU helpers/decoder.
function expected(op,value,flags){
 const group=Math.floor(op/64),bit=Math.floor(op/8)%8;let result=value,f=flags;
 if(group===0){
  const high=Math.floor(value/128),low=value%2,c=flags%2;
  result=[value*2%256+high,Math.floor(value/2)+128*low,value*2%256+c,Math.floor(value/2)+128*c,value*2%256,Math.floor(value/2)+128*high,value*2%256+1,Math.floor(value/2)][bit];
  const carry=[high,low,high,low,high,low,high,low][bit];
  f=(result>=128?128:0)+(result===0?64:0)+(result.toString(2).split('1').length%2===1?4:0)+carry;
 }else if(group===1){const set=Math.floor(value/(2**bit))%2!==0;f=flags%2+16+(set?0:68)+(set&&bit===7?128:0);}
 else if(group===2)result=value-(Math.floor(value/(2**bit))%2)*(2**bit);
 else result=value+(1-Math.floor(value/(2**bit))%2)*(2**bit);
 return {result,f,write:group!==1,copy:group!==1&&op%8!==6};
}
const bus=new Shino80Bus({traceLimit:16}),cpu=new Z80Core(bus);let exhaustive=0;
for(const [prefix,key] of [[0xDD,'ix'],[0xFD,'iy']])for(let op=0;op<256;op++)for(let value=0;value<256;value++)for(const carry of [0,1]){
 const s=cpu.state,oldF=0xFE|carry,target=op%8,ref=expected(op,value,oldF);
 Object.assign(s,coldState(),{pc:0x2000,ix:0x4080,iy:0x4080,a:0x17,b:0x23,c:0x45,d:0x67,e:0x89,h:0xAB,l:0xCD,f:oldF,r:0xFE,i:0x31,eiDelay:1,tStates:100});
 bus.load([prefix,0xCB,0x80,op],0x2000);bus.memory[0x4000]=value;bus.clearTrace();const before={...s};const li=cpu.step();
 assert.equal(bus.memory[0x4000],ref.result);assert.equal(s.f&0xD7,ref.f&0xD7,`${prefix} ${op} ${value} ${carry}`);
 if(op>=128)assert.equal(s.f,oldF);
 for(let r=0;r<8;r++)if(r!==6)assert.equal(s[regs[r]],ref.copy&&r===target?ref.result:before[regs[r]]);
 assert.equal(s.ix,before.ix);assert.equal(s.iy,before.iy);assert.equal(s.pc,0x2004);assert.equal(s.r,0x80);assert.equal(s.instructions,1);assert.equal(s.eiDelay,0);
 assert.equal(li.tStates,ref.write?23:20);assert.equal(s.tStates,100+li.tStates);assert.deepEqual(li.bytes,[prefix,0xCB,0x80,op]);
 assert.equal(li.mnemonic,decodeIndexedCB(op,key.toUpperCase()).mnemonic.replace('+d','-128'));
 const events=bus.trace;
 assert.deepEqual(events.map(e=>[e.purpose,e.tState]),[['OPCODE_FETCH',100],['MEMORY_REFRESH',102],['OPCODE_FETCH',104],['MEMORY_REFRESH',106],['OPERAND_READ',108],['OPCODE_READ',111],['DATA_READ',115],...(ref.write?[['DATA_WRITE',119]]:[])]);
 assert.deepEqual(events.filter(e=>e.signals.includes('M1')).map(e=>e.address),[0x2000,0x2001]);
 assert.equal(events[5].address,0x2003);assert.equal(events[6].address,0x4000);if(ref.write)assert.equal(events[7].address,0x4000);
 exhaustive++;
}
// All displacement bytes around both ends of the address space.
let displacementCases=0;
for(const [prefix,key] of [[0xDD,'ix'],[0xFD,'iy']])for(const origin of [0,0x7FFF,0xFFFF])for(let d=0;d<256;d++){
 Object.assign(cpu.state,coldState(),{pc:0x2000,[key]:origin});bus.load([prefix,0xCB,d,0xC6],0x2000);
 const address=(origin+(d<128?d:d-256))&65535;bus.memory[address]=0;bus.clearTrace();cpu.step();assert.equal(bus.memory[address],1);assert.equal(cpu.state[key],origin);assert.equal(bus.trace.at(-1).address,address);displacementCases++;
}
// All BIT aliases on protected memory cause no writes/copies; all RMW copy forms
// still copy the computed value into real registers when ROM rejects the write.
const rom=new Shino80Bus({romRanges:[[0,8191]],traceLimit:16}),romCpu=new Z80Core(rom);
for(const [prefix,key] of [[0xDD,'ix'],[0xFD,'iy']])for(let op=0;op<256;op++){
 Object.assign(romCpu.state,coldState(),{pc:0x2000,[key]:0x1000,f:1});rom.load([prefix,0xCB,0,op],0x2000);rom.memory[0x1000]=0x81;rom.clearTrace();romCpu.step();
 const ref=expected(op,0x81,1);assert.equal(rom.memory[0x1000],0x81);assert.equal(rom.trace.some(e=>e.operation==='WRITE_BLOCKED'),ref.write);
 if(ref.copy)assert.equal(romCpu.state[regs[op%8]],ref.result);assert.equal(romCpu.state[key],0x1000);
}
// Last redundant prefix wins; only M1 bytes advance R, not d or terminal op.
Object.assign(cpu.state,coldState(),{pc:0x2000,ix:0x4000,iy:0x5000,r:0xFF,eiDelay:1});bus.load([0xDD,0xFD,0xCB,1,0],0x2000);bus.memory[0x5001]=0x80;cpu.step();assert.equal(cpu.state.b,1);assert.equal(cpu.state.r,0x82);assert.equal(cpu.state.tStates,27);assert.equal(cpu.state.instructions,1);assert.equal(cpu.state.eiDelay,0);
// Four-byte instruction crosses FFFF; effective memory remains independent.
Object.assign(cpu.state,coldState(),{pc:65534,ix:0x4000});bus.memory[65534]=0xDD;bus.memory[65535]=0xCB;bus.memory[0]=0;bus.memory[1]=0x46;bus.memory[0x4000]=1;cpu.step();assert.equal(cpu.state.pc,2);assert.equal(cpu.state.r,2);assert.equal(cpu.state.tStates,20);
// Effective address may overlap the already-read final opcode.
Object.assign(cpu.state,coldState(),{pc:0x2000,ix:0x2000});bus.load([0xDD,0xCB,3,6],0x2000);const li=cpu.step();assert.equal(bus.memory[0x2003],12);assert.deepEqual(li.bytes,[0xDD,0xCB,3,6]);
console.log(`PHASE 1I indexed CB: ${exhaustive} exhaustive cases, ${displacementCases} displacement cases, ROM/copy/BIT/prefix/bus/wrap PASS`);
