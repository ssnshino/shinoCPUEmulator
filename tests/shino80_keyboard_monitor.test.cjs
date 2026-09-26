'use strict';

const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {
  Shino80Keyboard,
  KEY_DATA_PORT,KEY_STATUS_PORT,KEY_STATUS_READY,KEY_STATUS_OVERRUN
}=require('../src/devices/shino80/shino80-keyboard.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {
  buildSystemRom,TEXT_VRAM_BASE,TEXT_COLS,BIOS_WORK_CURSOR,BIOS_WORK_COLUMN
}=require('../src/firmware/shino80/shino80-system-rom.js');

// FIFO, status and overrun are deterministic.
{
  const keyboard=new Shino80Keyboard({capacity:2});
  assert.equal(keyboard.status(),0);
  assert(keyboard.enqueueByte(0x41));assert(keyboard.enqueueByte(0x42));
  assert.equal(keyboard.enqueueByte(0x43),false);
  assert.equal(keyboard.status(),KEY_STATUS_READY|KEY_STATUS_OVERRUN);
  assert.equal(keyboard.debugPeekPort(KEY_DATA_PORT),0x41);
  assert.equal(keyboard.depth,2);
  assert.equal(keyboard.readPort(KEY_DATA_PORT),0x41);
  assert.equal(keyboard.readPort(KEY_DATA_PORT),0x42);
  assert.equal(keyboard.readPort(KEY_DATA_PORT),0x00);
  assert.equal(keyboard.status(),KEY_STATUS_OVERRUN);
  keyboard.reset();assert.equal(keyboard.status(),0);assert.equal(keyboard.depth,0);
}

// Keyboard uses low-byte decode while the Bus records the complete Z80 port.
{
  const keyboard=new Shino80Keyboard(),bus=new Shino80Bus({ioDevices:[keyboard]});
  keyboard.enqueueByte(0x5A);
  bus.clearTrace();
  assert.equal(bus.debugIoPeek(0xAB20),0x5A);
  assert.equal(keyboard.depth,1,'debug peek must not consume input');
  assert.equal(bus.cpuIoRead(0xAB21),KEY_STATUS_READY);
  assert.equal(bus.cpuIoRead(0xAB20),0x5A);
  assert.equal(bus.trace.at(-1).address,0xAB20);
  assert.equal(bus.trace.at(-1).meta.device,'SHINO80_KEYBOARD');
  bus.cpuIoWrite(0x1234,0xA5);assert.equal(bus.cpuIoRead(0x1234),0xA5);
}

const rom=buildSystemRom();
function machine(){
  const keyboard=new Shino80Keyboard();
  const bus=new Shino80Bus({traceLimit:50000,romRanges:[[0x0000,0x1FFF]],ioDevices:[keyboard]});
  const cpu=new Z80Core(bus);bus.load(rom.bytes,0);cpu.reset();
  return {keyboard,bus,cpu};
}
function textAt(bus,row,len){
  let text='';
  for(let index=0;index<len;index++)text+=String.fromCharCode(bus.debugPeek(TEXT_VRAM_BASE+row*TEXT_COLS+index));
  return text;
}
function cursor(bus){return bus.debugPeek(BIOS_WORK_CURSOR)|(bus.debugPeek(BIOS_WORK_CURSOR+1)<<8);}
function runUntil(cpu,predicate,limit=50000){
  let count=0;
  while(!predicate()&&count++<limit)cpu.step();
  assert(count<limit,`condition not reached within ${limit} instructions`);
  return count;
}
function runCommand(cpu){
  cpu.step();
  runUntil(cpu,()=>cpu.state.pc===rom.labels.MONITOR_LOOP);
}

// RST 10 blocks in ROM until a byte exists, returns it in A and preserves the
// documented registers and caller-visible stack.
{
  const {keyboard,bus,cpu}=machine();
  const program=[0xD7,0x76]; // RST 10h / HALT
  program.forEach((byte,index)=>bus.debugPoke(0x2000+index,byte));
  cpu.state.pc=0x2000;cpu.state.sp=0xF000;
  cpu.state.b=0x12;cpu.state.c=0x34;cpu.state.d=0x56;cpu.state.e=0x78;cpu.state.h=0x9A;cpu.state.l=0xBC;
  for(let index=0;index<24;index++)cpu.step();
  assert.equal(cpu.state.halted,false);assert.equal(keyboard.depth,0);
  keyboard.enqueueByte(0x4B);runUntil(cpu,()=>cpu.state.halted);
  assert.equal(cpu.state.a,0x4B);assert.equal(cpu.state.sp,0xF000);
  assert.equal((cpu.state.b<<8)|cpu.state.c,0x1234);
  assert.equal((cpu.state.d<<8)|cpu.state.e,0x5678);
  assert.equal((cpu.state.h<<8)|cpu.state.l,0x9ABC);
  assert(bus.trace.some(event=>event.space==='IO'&&event.operation==='READ'&&event.address===KEY_STATUS_PORT));
  assert(bus.trace.some(event=>event.space==='IO'&&event.operation==='READ'&&event.address===KEY_DATA_PORT&&event.data===0x4B));
}

// Boot and execute real ROM Monitor commands through Keyboard -> I/O -> BIOS.
{
  const {keyboard,bus,cpu}=machine();
  cpu.runInstructions(rom.meta.instructionsBeforeLoop);
  assert.equal(cpu.state.pc,rom.labels.MONITOR_LOOP);
  assert.equal(textAt(bus,0,12),'SHINO-80 IPL');
  assert.equal(textAt(bus,3,1),'*');

  keyboard.enqueueByte('h'.charCodeAt(0));keyboard.enqueueByte(13);runCommand(cpu);
  assert.equal(textAt(bus,3,2),'*h');
  assert.equal(textAt(bus,4,15),'H HELP  C CLEAR');
  assert.equal(textAt(bus,5,1),'*');

  keyboard.enqueueByte('X'.charCodeAt(0));keyboard.enqueueByte(13);runCommand(cpu);
  assert.equal(textAt(bus,5,2),'*X');
  assert.equal(textAt(bus,6,1),'?');
  assert.equal(textAt(bus,7,1),'*');

  keyboard.enqueueByte('C'.charCodeAt(0));keyboard.enqueueByte(13);runCommand(cpu);
  assert.equal(textAt(bus,0,3),'MON');
  assert.equal(textAt(bus,1,1),'*');
  assert.equal(cursor(bus),TEXT_VRAM_BASE+TEXT_COLS+1);
  assert.equal(bus.debugPeek(BIOS_WORK_COLUMN),1);

  keyboard.enqueueByte(0x0D);runCommand(cpu);
  assert.equal(textAt(bus,2,1),'*');
}

console.log('SHINO-80 KEYBOARD + INTERACTIVE MONITOR: ALL TESTS PASS');
