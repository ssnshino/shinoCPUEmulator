'use strict';
const assert=require('node:assert/strict');
const {Shino80Memory}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Shino80Keyboard}=require('../src/devices/shino80/shino80-keyboard.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {buildSystemRom}=require('../src/firmware/shino80/shino80-system-rom.js');
const rom=buildSystemRom();
function machine(){
  const keyboard=new Shino80Keyboard({capacity:256});
  const memory=new Shino80Memory();memory.loadFirmware(rom.bytes);
  const bus=new Shino80Bus({traceLimit:256,memoryDevice:memory,ioDevices:[keyboard]});
  const cpu=new Z80Core(bus);cpu.reset();
  cpu.runInstructions(rom.meta.instructionsBeforeLoop);
  assert.equal(cpu.state.pc,rom.labels.MONITOR_LOOP);
  return {keyboard,bus,cpu};
}
function until(cpu,predicate){let n=0;while(!predicate()&&n++<500000)cpu.step();assert(n<500000,'execution timeout');}
function text(bus,address,length){return Array.from({length},(_,i)=>String.fromCharCode(bus.debugPeek((address+i)&65535))).join('');}
function send(m,s){for(const ch of s)assert(m.keyboard.enqueueByte(ch.charCodeAt(0)));}
function command(m,s){send(m,s+'\r');m.cpu.step();until(m.cpu,()=>m.cpu.state.pc===rom.labels.MONITOR_LOOP);}
function invoke(m,address){m.bus.debugPoke(0x4000,0xCD);m.bus.debugPoke(0x4001,address&255);m.bus.debugPoke(0x4002,address>>8);m.bus.debugPoke(0x4003,0x76);m.cpu.state.pc=0x4000;m.cpu.state.halted=false;until(m.cpu,()=>m.cpu.state.halted);}
function cursor(m,address,col){m.bus.debugPoke(0xE000,address&255);m.bus.debugPoke(0xE001,address>>8);m.bus.debugPoke(0xE002,col);}
for(const [address,label] of [[0x10F,'BIOS_GETLINE'],[0x112,'BIOS_PRINT_HEX8'],[0x115,'BIOS_PRINT_HEX16']]){
  assert.equal(rom.bytes[address],0xC3);assert.equal(rom.bytes[address+1]|rom.bytes[address+2]<<8,rom.labels[label]);
}
// Bounded, editable ASCII input; preserve caller registers and stack.
for(const [input,expected] of [['\b\x7fAB\bC\x7fD\r','AD'],['ABCD\r','ABC'],['\x01a\x80b\r','ab'],['\r','']]){
  const m=machine(),s=m.cpu.state;cursor(m,0xC000,0);
  Object.assign(s,{b:3,c:0x45,d:0x67,e:0x89,h:0xE1,l:0,sp:0xF000});
  m.bus.debugPoke(0xE104,0xA5);send(m,input);invoke(m,0x10F);
  assert.equal(text(m.bus,0xE100,expected.length),expected);assert.equal(m.bus.debugPeek(0xE100+expected.length),0);
  assert.equal(m.bus.debugPeek(0xE104),0xA5);assert.equal(s.a,expected.length);
  for(const [k,v] of Object.entries({b:3,c:0x45,d:0x67,e:0x89,h:0xE1,l:0,sp:0xF000}))assert.equal(s[k],v,k);
}
// Full supported capacity includes a separate terminator, with a guard after it.
{
  const m=machine();Object.assign(m.cpu.state,{b:63,h:0xE1,l:0});m.bus.debugPoke(0xE140,0xA5);
  send(m,'A'.repeat(64)+'\r');invoke(m,0x10F);assert.equal(m.cpu.state.a,63);
  assert.equal(text(m.bus,0xE100,63),'A'.repeat(63));assert.equal(m.bus.debugPeek(0xE13F),0);assert.equal(m.bus.debugPeek(0xE140),0xA5);
}
// Scroll 24 rows, clear only the last visible row, preserve all caller registers.
{
  const m=machine(),s=m.cpu.state;
  for(let i=0;i<2000;i++)m.bus.debugPoke(0xC000+i,Math.floor(i/80)+1);
  m.bus.debugPoke(0xC7D0,0xA5);cursor(m,0xC7CF,79);
  const initial={a:88,f:0xD7,b:0x12,c:0x34,d:0x56,e:0x78,h:0x9A,l:0xBC,sp:0xF000};Object.assign(s,initial);
  invoke(m,0x100);
  for(let i=0;i<1919;i++)assert.equal(m.bus.debugPeek(0xC000+i),Math.floor(i/80)+2);
  assert.equal(m.bus.debugPeek(0xC77F),88);
  for(let i=0;i<80;i++)assert.equal(m.bus.debugPeek(0xC780+i),0);
  assert.equal(m.bus.debugPeek(0xC7D0),0xA5);
  for(const [k,v] of Object.entries(initial))assert.equal(s[k],v,k);
}
for(const [address,expected] of [[0x112,'AF'],[0x115,'BEEF']]){
  const m=machine();cursor(m,0xC000,0);const initial={a:0xAF,f:0xD7,b:1,c:2,d:3,e:4,h:0xBE,l:0xEF,sp:0xF000};Object.assign(m.cpu.state,initial);
  invoke(m,address);assert.equal(text(m.bus,0xC000,expected.length),expected);
  for(const [k,v] of Object.entries(initial))assert.equal(m.cpu.state[k],v,k);
}
// Real CPU-read dumps, strict syntax, lowercase and address wrap.
for(const start of [0x0100,0x4345,0xFFFC]){
  const m=machine();for(let i=0;i<64;i++){const a=(start+i)&65535;if(a>=0x4000)m.bus.debugPoke(a,i);}
  const expected=Array.from({length:8},(_,row)=>{
    const a=(start+row*8)&65535;return a.toString(16).toUpperCase().padStart(4,'0')+':'+Array.from({length:8},(_,i)=>' '+m.bus.debugPeek((a+i)&65535).toString(16).toUpperCase().padStart(2,'0')).join('');
  });
  let readTarget=false;const read=m.bus.cpuRead.bind(m.bus);
  m.bus.cpuRead=(address,options)=>{if(address===start)readTarget=true;return read(address,options);};
  const sp=m.cpu.state.sp;command(m,'d '+start.toString(16).padStart(4,'0'));
  expected.forEach((line,row)=>assert.equal(text(m.bus,0xC000+(row+4)*80,29),line));assert.equal(m.cpu.state.sp,sp);
  assert(readTarget,'dump must read through CPU Bus');
  for(let i=0;i<rom.bytes.length;i++)assert.equal(m.bus.debugPeek(i),rom.bytes[i]);
}
for(const input of ['D','D 123','D 12345','D 12G4','D 12/4','D01234','HH','D 12:4']){
  const m=machine();command(m,input);assert.equal(text(m.bus,0xC000+4*80,5),'? USE');
}
{
  const m=machine(),sp=m.cpu.state.sp;
  for(let i=0;i<8;i++)command(m,'D 0100');
  assert.equal(m.cpu.state.sp,sp);assert.equal(m.bus.debugPeek(0xE002),1);
  assert.equal(text(m.bus,0xC780,1),'*');
}
console.log('SHINO-80 BIOS CONSOLE V2 / MONITOR DUMP: ALL TESTS PASS');
