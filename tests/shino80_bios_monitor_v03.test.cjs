'use strict';
const assert=require('node:assert/strict');
const {Shino80Memory}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Shino80Keyboard}=require('../src/devices/shino80/shino80-keyboard.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const decoder=require('../src/cpu/z80/z80-decoder.js');
const {buildSystemRom}=require('../src/firmware/shino80/shino80-system-rom.js');
const rom=buildSystemRom();
function machine(traceLimit=512){
  const keyboard=new Shino80Keyboard({capacity:512});
  const memory=new Shino80Memory();memory.loadFirmware(rom.bytes);
  const bus=new Shino80Bus({traceLimit,memoryDevice:memory,ioDevices:[keyboard]});
  const cpu=new Z80Core(bus);cpu.reset();cpu.runInstructions(rom.meta.instructionsBeforeLoop);
  assert.equal(cpu.state.pc,rom.labels.MONITOR_LOOP);return {keyboard,bus,cpu};
}
function until(cpu,predicate,limit=3000000){let n=0;while(!predicate()&&n++<limit)cpu.step();assert(n<limit,'execution timeout');}
function send(m,s){for(const ch of s)assert(m.keyboard.enqueueByte(ch.charCodeAt(0)));}
function command(m,s){send(m,s+'\r');m.cpu.step();until(m.cpu,()=>m.cpu.state.pc===rom.labels.MONITOR_LOOP);}
function screen(m){return Array.from({length:25},(_,r)=>Array.from({length:80},(_,i)=>String.fromCharCode(m.bus.debugPeek(0xC000+r*80+i))).join('').replaceAll('\0',' ').trimEnd()).join('\n');}
function invoke(m,address,hl){m.bus.load([0xCD,address&255,address>>8,0x76],0x4000);Object.assign(m.cpu.state,{pc:0x4000,sp:0xF000,h:hl>>8,l:hl&255,halted:false});until(m.cpu,()=>m.cpu.state.halted);}
for(const [address,label] of [[0x118,'BIOS_PARSE_HEX16'],[0x11B,'BIOS_DISASM_ONE']]){
  assert.equal(rom.bytes[address],0xC3);assert.equal(rom.bytes[address+1]|rom.bytes[address+2]<<8,rom.labels[label]);
}
// BIOS parser: strict four digits, lowercase accepted, carry is success.
for(const [input,value,success] of [['BEEF',0xBEEF,true],['00af',0x00AF,true],['0G00',0,false],['/000',0,false],['000:',0,false]]){
  const m=machine();m.bus.load([...input].map(c=>c.charCodeAt(0)),0xE200);invoke(m,0x118,0xE200);
  assert.equal(!!(m.cpu.state.f&1),success,input);
  if(success){assert.equal(m.cpu.state.d<<8|m.cpu.state.e,value,input);assert.equal(m.cpu.state.h<<8|m.cpu.state.l,0xE204,input);}
}
const familyDecoders={BASE:o=>decoder.decodeBase(o),CB:o=>decoder.decodeCB(o),ED:o=>decoder.decodeED(o),DD:o=>decoder.decodeIndex(o,'IX'),FD:o=>decoder.decodeIndex(o,'IY'),DDCB:o=>decoder.decodeIndexedCB(o,'IX'),FDCB:o=>decoder.decodeIndexedCB(o,'IY')};
function bytesFor(d,family,opcode){
  const bytes=family==='BASE'?[opcode]:family==='CB'?[0xCB,opcode]:family==='ED'?[0xED,opcode]:family==='DD'||family==='FD'?[family==='DD'?0xDD:0xFD,opcode]:[family==='DDCB'?0xDD:0xFD,0xCB,2,opcode];
  if((family==='DD'||family==='FD')&&d.indexedMemory)bytes.push(2);
  if(/\bnn\b/.test(d.mnemonic))bytes.push(0,0x40);else if(/\bn\b/.test(d.mnemonic))bytes.push(0x42);else if(/\be\b/.test(d.mnemonic))bytes.push(2);
  return bytes;
}
function expectedMnemonic(d,bytes,address=0x4000){
  let text=d.mnemonic.replace('unused','UNUSED').replace('+d','+02h').replace(/\bnn\b/,'4000h').replace(/\bn\b/,'42h');
  if(/\be\b/.test(text))text=text.replace(/\be\b/,((address+bytes.length+2)&0xFFFF).toString(16).toUpperCase().padStart(4,'0')+'h');
  return text;
}
function directDisassembler(){
  const memory=new Shino80Memory();memory.loadFirmware(rom.bytes);const bus=new Shino80Bus({traceLimit:0,memoryDevice:memory});bus.load([0xCD,0x1B,0x01,0x76],0x5000);const cpu=new Z80Core(bus);
  return (bytes,address=0x4000)=>{
    for(let i=0;i<80;i++)bus.debugPoke(0xC000+i,0);for(let i=0;i<bytes.length;i++)bus.debugPoke((address+i)&0xFFFF,bytes[i]);bus.debugPoke(0xE000,0);bus.debugPoke(0xE001,0xC0);bus.debugPoke(0xE002,0);
    Object.assign(cpu.state,{pc:0x5000,sp:0xF000,h:address>>8,l:address&255,halted:false});until(cpu,()=>cpu.state.halted,20000);
    const line=Array.from({length:80},(_,i)=>String.fromCharCode(bus.debugPeek(0xC000+i))).join('').replaceAll('\0',' ').trimEnd();
    return {line,mnemonic:line.replace(/^[0-9A-F]{4}: (?:[0-9A-F]{2} )+ /,''),next:cpu.state.h<<8|cpu.state.l,length:cpu.state.a};
  };
}
const disassemble=directDisassembler();let encodings=0;
for(const [family,decode] of Object.entries(familyDecoders))for(let opcode=0;opcode<256;opcode++){
  if(['BASE','DD','FD'].includes(family)&&[0xCB,0xDD,0xED,0xFD].includes(opcode))continue;
  const d=decode(opcode),bytes=bytesFor(d,family,opcode),actual=disassemble(bytes);
  assert.equal(actual.mnemonic,expectedMnemonic(d,bytes),`${family} ${opcode.toString(16)}`);
  assert.equal(actual.length,bytes.length,`${family} length ${opcode.toString(16)}`);assert.equal(actual.next,(0x4000+bytes.length)&0xFFFF);encodings++;
}
assert.equal(encodings,1780);
for(const [bytes,fragment,next] of [
  [[0xDD,0xFD,0x21,0x34,0x12],'LD IY,1234h',0x4005],
  [[0xDD,0xED,0x44],'NEG',0x4003],
  [[0xDD,0xDD,0xDD,0xDD,0xDD,0x00],'DB DDh ; PREFIX LIMIT',0x4001]
]){const actual=disassemble(bytes);assert(actual.line.includes(fragment),fragment);assert.equal(actual.next,next);}
{
  const actual=disassemble([0x3E],0xFFFF);assert(actual.line.includes('FFFF: 3E C3  LD A,C3h'));assert.equal(actual.next,0x0001);assert.equal(actual.length,2);
}
// New dump forms: exact inclusive range, wrap and a visible 256-byte cap.
{
  const m=machine();for(let i=0;i<0x110;i++)m.bus.debugPoke(0x4000+i,i);command(m,'D 4000 4003');assert(screen(m).includes('4000: 00 01 02 03'));
}
{
  const m=machine();m.bus.debugPoke(0xFFFE,0xFE);m.bus.debugPoke(0xFFFF,0xFF);command(m,'D FFFE 0001');assert(screen(m).includes('FFFE: FE FF C3 00'));
}
{
  const m=machine(0);let reads=[];const read=m.bus.cpuRead.bind(m.bus);m.bus.cpuRead=(address,options)=>{if(address>=0x4000&&address<=0x4200)reads.push(address);return read(address,options);};
  command(m,'D 4000 4200');assert.equal(reads.filter(a=>a>=0x4000&&a<=0x40FF).length,256);assert(!reads.includes(0x4100));assert(screen(m).includes('RANGE LIMITED'));
}
// R is the state captured before GETLINE, including alternate banks and caller SP.
{
  const m=machine();Object.assign(m.cpu.state,{a:0x12,f:0xD7,b:0x34,c:0x56,d:0x78,e:0x9A,h:0xBC,l:0xDE,aAlt:0x11,fAlt:0x22,bAlt:0x33,cAlt:0x44,dAlt:0x55,eAlt:0x66,hAlt:0x77,lAlt:0x88,ix:0x1357,iy:0x2468,sp:0xF000,i:0xA5});
  command(m,'R');const output=screen(m);for(const fragment of ['AF=12D7','BC=3456','DE=789A','HL=BCDE',"AF'= 1122","BC'= 3344","DE'= 5566","HL'= 7788",'IX=1357','IY=2468','SP=F000','I=A5'])assert(output.includes(fragment),fragment);
}
// U default=8 instructions; range includes an instruction starting before end.
{
  const m=machine();m.bus.load([0x3E,0x41,0xDD,0x36,0xFE,0x55,0xC9],0x4000);command(m,'U 4000 4004');const output=screen(m);
  assert(output.includes('4000: 3E 41  LD A,41h'));assert(output.includes('4002: DD 36 FE 55  LD (IX-02h),55h'));assert(!output.includes('4006: C9'));
}
{
  const m=machine();command(m,'U 0100');const output=screen(m);assert(output.includes('0100: C3'));assert(output.includes('0115: C3'));assert(!output.includes('0118: C3'));
}
{
  const m=machine();for(let i=0;i<0x210;i++)m.bus.debugPoke(0x4000+i,0);command(m,'U 4000 4200');assert(screen(m).includes('RANGE LIMITED'));
}
for(const bad of ['D 2000 200','D 2000-2003','D 2000 200G','R 1','U','U 123','U 2000-2010','U 2000 20G0','B 1']){
  const m=machine();command(m,bad);assert(screen(m).includes('? USE'),bad);
}
console.log(`SHINO-80 BIOS/MON v0.3: PARSE + ${encodings} disassembly encodings + D/R/U commands PASS`);
