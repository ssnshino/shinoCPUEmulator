'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core,coldState}=require('../src/cpu/z80/z80-core.js');
const flags=require('../src/cpu/z80/z80-flags.js');
function fresh(bytes=[],state={},options={}){
 const bus=new Shino80Bus({traceLimit:128,...options}),cpu=new Z80Core(bus);
 Object.assign(cpu.state,{pc:0x2000,sp:0x9000},state);bus.load(bytes,cpu.state.pc);bus.clearTrace();
 return {bus,cpu,s:cpu.state};
}
function stacked(bus,s,address){assert.equal(bus.memory[s.sp],address&255);assert.equal(bus.memory[(s.sp+1)&65535],address>>>8);}
let interruptCases=0;
// Independent interrupt vector/timing matrix, including odd IM2 vectors/wrap.
for(const im of [1,2])for(const halted of [false,true])for(const pc of [0,0x2000,65535])for(const sp of [0,1,0x9000])for(const r of [0,0x7F,0x80,0xFF])for(const vector of [0,1,0xFF]){
 const {cpu,bus,s}=fresh([],{pc,sp,r,i:0xFF,im,halted,iff1:true,iff2:true,tStates:100});
 const pointer=0xFF00|vector;bus.memory[pointer]=0x34;bus.memory[(pointer+1)&65535]=0x12;
 cpu.setINT(true,vector);
 // Stack writes precede IM2 reads, including intentionally overlapping vectors.
 const expectedMemory=bus.memory.slice();expectedMemory[(sp-1)&65535]=pc>>>8;expectedMemory[(sp-2)&65535]=pc&255;
 const target=im===1?0x38:expectedMemory[pointer]|(expectedMemory[(pointer+1)&65535]<<8);
 const result=cpu.step();
 assert.equal(s.pc,target);assert.equal(s.wz,target);assert.equal(s.sp,(sp-2)&65535);stacked(bus,s,pc);
 assert.equal(s.r,(r&128)|((r+1)&127));assert.equal(s.halted,false);assert.equal(s.iff1,false);assert.equal(s.iff2,false);
 assert.equal(s.tStates,100+(im===1?13:19));assert.equal(s.instructions,0);assert.equal(result.interrupt,'INT');
 assert.deepEqual(bus.trace.map(e=>[e.purpose,e.tState]),[['INT_ACK',100],['MEMORY_REFRESH',104],['STACK_WRITE',107],['STACK_WRITE',110],...(im===2?[['INT_VECTOR_READ',113],['INT_VECTOR_READ',116]]:[])]);
 assert.deepEqual(bus.trace[0].signals,['M1','IORQ']);assert.equal(bus.trace[0].data,vector);interruptCases++;
}
// NMI does not obey EI inhibit; it outranks INT and preserves IFF2 even nested.
for(const iff1 of [false,true])for(const iff2 of [false,true])for(const halted of [false,true])for(const eiDelay of [0,1])for(const r of [0x7F,0xFF]){
 const {cpu,bus,s}=fresh([],{iff1,iff2,halted,eiDelay,r,im:1,f:0xFF,p:1});cpu.setINT(true);cpu.pulseNMI();
 assert.equal(cpu.step().interrupt,'NMI');assert.equal(s.pc,0x66);assert.equal(s.wz,0x66);assert.equal(s.sp,0x8FFE);stacked(bus,s,0x2000);
 assert.equal(s.iff1,false);assert.equal(s.iff2,iff2);assert.equal(s.eiDelay,0);assert.equal(s.halted,false);assert.equal(s.f,255);
 assert.equal(s.r,r&128);assert.equal(s.tStates,11);assert.equal(s.q,0);assert.equal(s.p,0);assert.equal(s.instructions,0);
 assert.deepEqual(bus.trace.map(e=>[e.purpose,e.tState]),[['NMI_ACK',0],['MEMORY_REFRESH',2],['STACK_WRITE',5],['STACK_WRITE',8]]);interruptCases++;
}
// Masking, one-instruction EI delay (whole prefixed instructions), repeated EI.
for(const bytes of [[0x00],[0xDD,0x00],[0xDD,0xFD,0xCB,0,0x46],[0xED,0xFB],[0x76]]){
 const {cpu,s}=fresh([0xFB,...bytes,0],{im:1,ix:0x4000,iy:0x4000});cpu.setINT(true);
 cpu.step();assert.equal(s.eiDelay,1);cpu.step();assert.equal(s.eiDelay,0);assert.equal(s.pc,0x2001+bytes.length);
 assert.equal(cpu.step().interrupt,'INT');assert.equal(s.pc,0x38);interruptCases++;
}
{
 const {cpu,s}=fresh([0xFB,0xFB,0xF3,0x76],{im:1});cpu.setINT(true);
 cpu.step();cpu.step();assert.equal(s.eiDelay,1);cpu.step();assert.equal(s.iff1,false);cpu.step();assert.equal(s.halted,true);
 const pc=s.pc,r=s.r;cpu.step();assert.equal(s.pc,pc);assert.equal(s.r,r+1);assert.equal(s.halted,true);
 cpu.setINT(false);s.iff1=true;cpu.step();assert.equal(s.halted,true);cpu.setINT(true);cpu.step();assert.equal(s.pc,0x38);assert.equal(s.halted,false);interruptCases++;
}
{
 const {cpu,bus,s}=fresh([],{iff1:true,iff2:true,im:1});bus.load([0xED,0x45],0x66);
 cpu.setNMI(true);cpu.step();cpu.step();assert.equal(s.pc,0x2000);assert.equal(s.iff1,true);
 cpu.step();assert.equal(s.pc,0x2001); // held NMI cannot retrigger
 cpu.setNMI(false);cpu.setNMI(true);cpu.step();assert.equal(s.pc,0x66);
 cpu.pulseNMI();cpu.step();assert.equal(s.pc,0x66);assert.equal(s.iff2,true);
 cpu.step();assert.equal(s.pc,0x66);cpu.step();assert.equal(s.pc,0x2001);assert.equal(s.sp,0x9000);
 assert.equal(bus.trace.some(e=>e.purpose==='RETI'),false);interruptCases++;
}
{
 const {cpu,bus,s}=fresh([0xFB],{im:1});bus.load([0xED,0x45],0x66);
 cpu.step();cpu.setNMI(true);cpu.setNMI(false);cpu.step();assert.equal(s.pc,0x66);assert.equal(s.iff2,true);
 cpu.step();assert.equal(s.iff1,true);assert.equal(s.pc,0x2001);interruptCases++;
}
// RETI notification, held level re-entry, and no device notification for RETN aliases.
for(const op of [0x45,0x4D,0x55,0x5D,0x65,0x6D,0x75,0x7D]){
 const {cpu,bus,s}=fresh([],{iff1:true,iff2:true,im:1});bus.load([0xFB,0xED,op],0x38);cpu.setINT(true);
 cpu.step();cpu.step();assert.equal(s.eiDelay,1);cpu.step();assert.equal(s.pc,0x2000);assert.equal(s.iff1,true);assert.equal(s.eiDelay,0);
 const events=bus.trace.filter(e=>e.purpose==='RETI');assert.equal(events.length,op===0x4D?1:0);if(events.length)assert.equal(events[0].tState,31);
 cpu.step();assert.equal(s.pc,0x38);interruptCases++;
}
// IM0 is an injected opcode, not an unconditional RST or automatic stack push.
for(let opcode=0;opcode<256;opcode++){
 const a=fresh([0x00,0x40,0,0],{iff1:true,iff2:true,im:0,ix:0x4000,iy:0x4000,h:0x40,r:0xFF});
 const b=fresh([opcode,0x00,0x40,0,0],{pc:0x1FFF,im:0,ix:0x4000,iy:0x4000,h:0x40,r:0xFF});
 a.bus.memory[0x1FFF]=opcode;a.cpu.setINT(true,opcode);const injected=a.cpu.step(),ordinary=b.cpu.step();
 for(const key of Object.keys(coldState()))if(!['intLine','intData','tStates'].includes(key))assert.equal(a.s[key],b.s[key],`IM0 ${opcode.toString(16)} ${key}`);
 assert.equal(injected.tStates,ordinary.tStates+2);assert.equal(injected.interrupt,'INT');assert.deepEqual(a.bus.memory,b.bus.memory);
 assert.equal(a.bus.trace[0].purpose,'INT_ACK');assert.equal(a.bus.trace.some(e=>e.purpose==='OPCODE_FETCH'&&e.address===0x1FFF),false);interruptCases++;
}
for(const [opcode,operands,target,timing,sp] of [[0x00,[],0x2000,6,0x9000],[0xFF,[],0x38,13,0x8FFE],[0xCD,[0x34,0x12],0x1234,19,0x8FFE],[0xC3,[0x34,0x12],0x1234,12,0x9000]]){
 const {cpu,bus,s}=fresh(operands,{iff1:true,iff2:true,im:0});cpu.setINT(true,opcode);cpu.step();assert.equal(s.pc,target);assert.equal(s.tStates,timing);assert.equal(s.sp,sp);if(sp!==0x9000)stacked(bus,s,0x2000+operands.length);interruptCases++;
}
// NMOS LD A,I/R interrupt quirk is transient and is not triggered by NMI.
for(const op of [0x57,0x5F])for(const separator of [false,true]){
 const {cpu,s}=fresh([0xED,op,0],{iff1:true,iff2:true,im:1,i:0x28,r:0x26});cpu.step();assert.equal(s.f&4,4);assert.equal(s.p,1);
 if(separator)cpu.step();cpu.setINT(true);cpu.step();assert.equal(s.f&4,separator?4:0);interruptCases++;
}
// ROM protection remains authoritative for interrupt stack writes.
{
 const {cpu,bus,s}=fresh([],{iff1:true,sp:2,im:1},{romRanges:[[0,8191]]});bus.memory[0]=0xAA;bus.memory[1]=0xBB;cpu.setINT(true);cpu.step();assert.equal(s.sp,0);assert.equal(bus.memory[0],0xAA);assert.equal(bus.memory[1],0xBB);assert.equal(bus.trace.filter(e=>e.operation==='WRITE_BLOCKED').length,2);interruptCases++;
}
// An interrupt between LDIR iterations must return to ED, not past the block.
{
 const {cpu,bus,s}=fresh([0xED,0xB0],{iff1:true,iff2:true,im:1,h:0x40,l:0,d:0x50,e:0,b:0,c:2});
 bus.load([0x11,0x22],0x4000);bus.load([0xFB,0xED,0x4D],0x38);
 cpu.step();assert.equal(s.pc,0x2000);assert.equal(s.c,1);assert.equal(bus.memory[0x5000],0x11);
 cpu.setINT(true);cpu.step();stacked(bus,s,0x2000);cpu.setINT(false);cpu.step();cpu.step();assert.equal(s.pc,0x2000);
 cpu.step();assert.equal(s.pc,0x2002);assert.equal(s.c,0);assert.deepEqual([...bus.memory.slice(0x5000,0x5002)],[0x11,0x22]);interruptCases++;
}
// Direct line sampling compatibility, as distinct from latched short pulses.
{
 const {cpu,s}=fresh();s.nmiLine=true;cpu.step();assert.equal(s.pc,0x66);cpu.step();assert.equal(s.pc,0x67);
 s.nmiLine=false;cpu.step();s.nmiLine=true;cpu.step();assert.equal(s.pc,0x66);interruptCases++;
}
// Reset clears pending/latched interrupt and internal state without erasing RAM.
{
 const {cpu,bus,s}=fresh([],{wz:0xFFFF,q:255,p:1});cpu.setNMI(true);cpu.setINT(true,0xCD);bus.memory[0x4000]=42;cpu.reset();
 for(const key of ['wz','q','p','eiDelay','tStates','instructions'])assert.equal(s[key],0);
 for(const key of ['nmiLine','nmiPending','nmiSeen','intLine','iff1','iff2','halted'])assert.equal(s[key],false);
 assert.equal(s.intData,255);assert.equal(bus.memory[0x4000],42);interruptCases++;
}
// Full XY arithmetic sources: result vs CP operand and 16-bit high result.
let fullFlagCases=0;
for(let a=0;a<256;a++)for(let b=0;b<256;b++){
 for(const fn of [flags.add8,flags.sub8,flags.and8,flags.or8,flags.xor8]){const x=fn(0x28,a,b);assert.equal(x.f&0x28,x.result&0x28);fullFlagCases++;}
 assert.equal(flags.cp8(0,a,b).f&0x28,b&0x28);fullFlagCases++;
}
for(let v=0;v<256;v++)for(let f=0;f<256;f++)for(const fn of [flags.inc8,flags.dec8,flags.daa8]){const x=fn(f,v);assert.equal(x.f&0x28,x.result&0x28);fullFlagCases++;}
// Q depends on flag-writing, not whether the resulting bits happened to change.
for(const prefix of [[],[0xDD],[0xFD,0xDD]])for(const op of [0x37,0x3F]){
 const {cpu,s}=fresh([...prefix,op],{a:0,f:0x28,q:0x28});cpu.step();assert.equal(s.f&0x28,prefix.length?0x28:0);assert.equal(s.q,s.f);
}
for(const predecessor of [[0x00],[0xF1],[0x08]]){
 const {cpu,bus,s}=fresh([...predecessor,0x37],{a:0,f:0x28,q:0x28,fAlt:0x28});bus.memory[0x9000]=0x28;
 cpu.step();assert.equal(s.q,0);cpu.step();assert.equal(s.f&0x28,0x28);
}
{
 const {cpu,s}=fresh([0xB7,0x3E,0,0x37],{a:0x28});cpu.step();assert.equal(s.q,s.f);cpu.step();assert.equal(s.q,0);cpu.step();assert.equal(s.f&0x28,0x28);
}
// WZ history must feed BIT (HL); HL itself is not the XY source.
{
 const {cpu,bus,s}=fresh([0x32,0,0x40,0xCB,0x46,0xED,0xA1,0xCB,0x46],{a:0x28,h:0x40,l:1,b:1,c:2});bus.memory[0x4001]=1;
 cpu.step();assert.equal(s.wz,0x2801);cpu.step();assert.equal(s.f&0x28,0x28);cpu.step();assert.equal(s.wz,0x2802);cpu.step();assert.equal(s.f&0x28,0x28);
}
console.log(`PHASE 1J: ${interruptCases} interrupt cases; ${fullFlagCases} full XY cases; Q/WZ/sequence/Bus/reset PASS`);
