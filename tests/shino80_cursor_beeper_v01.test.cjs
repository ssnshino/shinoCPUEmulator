'use strict';

const assert=require('node:assert/strict');
const {Shino80Memory,MEMORY_CONTROL_LOW_RAM}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Shino80Beeper,BEEPER_PORT}=require('../src/devices/shino80/shino80-beeper.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {Shino80TextVideo,TEXT_VRAM_BASE}=require('../src/machine/shino80/shino80-video.js');
const {buildSystemRom}=require('../src/firmware/shino80/shino80-system-rom.js');
const {buildCbios,CBIOS_ORG}=require('../src/firmware/shino80/shino80-cbios.js');

const lo=value=>value&255,hi=value=>(value>>8)&255;
function run(cpu,limit=100000){let count=0;while(!cpu.state.halted&&count++<limit)cpu.step();assert(count<limit,'cursor/beeper program timeout');}

// The beeper is an ordinary observable I/O device, not a DOM shortcut.
{
  const beeper=new Shino80Beeper(),bus=new Shino80Bus({traceLimit:16,ioDevices:[beeper]});
  bus.cpuIoWrite(BEEPER_PORT,7,{tState:123,purpose:'TEST_BEL'});
  assert.equal(beeper.triggerCount,1);assert.equal(beeper.sequence,1);assert.equal(beeper.lastValue,7);
  assert.deepEqual(bus.trace.at(-1).meta,{device:'SHINO80_BEEPER'});
  assert.equal(bus.debugIoPeek(BEEPER_PORT),7);
  beeper.reset();assert.equal(beeper.triggerCount,0);assert.equal(beeper.sequence,0);
}

// ROM BIOS PUTCHAR routes BEL to port 40h, preserves registers and does not
// advance or modify its text cursor.
{
  const rom=buildSystemRom(),beeper=new Shino80Beeper(),memory=new Shino80Memory();memory.loadFirmware(rom.bytes);
  const bus=new Shino80Bus({traceLimit:1000,memoryDevice:memory,ioDevices:[beeper]}),cpu=new Z80Core(bus);cpu.reset();
  const entry=0x7000;bus.load([0x3E,0x07,0x01,0x34,0x12,0x21,0x78,0x56,0xCD,0x00,0x01,0x76],entry);
  bus.debugPoke(rom.meta.biosWorkCursor,0x23);bus.debugPoke(rom.meta.biosWorkCursor+1,0xC1);bus.debugPoke(0xC123,0x41);
  Object.assign(cpu.state,{pc:entry,sp:0xF000});run(cpu);
  assert.equal(beeper.triggerCount,1);assert.equal(bus.debugPeek(0xC123),0x41);
  assert.equal(bus.debugPeek(rom.meta.biosWorkCursor)|(bus.debugPeek(rom.meta.biosWorkCursor+1)<<8),0xC123);
  assert.equal(cpu.state.a,7);assert.equal(cpu.state.b,0x12);assert.equal(cpu.state.c,0x34);assert.equal(cpu.state.h,0x56);assert.equal(cpu.state.l,0x78);
}

// RAM CBIOS CONOUT applies the same BEL contract used by CP/M BDOS.
{
  const image=buildCbios(),beeper=new Shino80Beeper(),memory=new Shino80Memory();
  const bus=new Shino80Bus({traceLimit:1000,memoryDevice:memory,ioDevices:[beeper]});bus.load(image.bytes,CBIOS_ORG);bus.cpuIoWrite(0,MEMORY_CONTROL_LOW_RAM);
  const cpu=new Z80Core(bus);cpu.reset();const entry=0x7000,conout=image.labels.CBIOS_API_CONOUT;
  bus.load([0x0E,0x07,0xCD,lo(conout),hi(conout),0x76],entry);Object.assign(cpu.state,{pc:entry,sp:0xF000});run(cpu);
  assert.equal(beeper.triggerCount,1);assert.equal(beeper.lastValue,7);assert.equal(cpu.state.c,7);
  assert.equal(bus.trace.filter(event=>event.space==='IO'&&(event.address&255)===BEEPER_PORT).length,1);
}

// DM-80 cursor is a non-destructive overlay. Moving or hiding it redraws the
// previous cell from VRAM and never changes the underlying bytes.
{
  const memory=new Shino80Memory(),bus=new Shino80Bus({memoryDevice:memory}),fills=[];
  const ctx={imageSmoothingEnabled:true,fillStyle:'',fillRect(...args){fills.push({style:this.fillStyle,args});}};
  const canvas={width:0,height:0,getContext(){return ctx;}};
  const video=new Shino80TextVideo(bus,canvas);video.setPower(true);bus.debugPoke(TEXT_VRAM_BASE+1,0x41);
  video.render({cursorAddress:TEXT_VRAM_BASE+1,cursorVisible:true});
  assert(fills.some(call=>call.style==='#B7FFCA'&&call.args.join(',')==='8,14,8,2'));
  const before=bus.debugPeek(TEXT_VRAM_BASE+1);fills.length=0;
  assert.equal(video.render({cursorAddress:TEXT_VRAM_BASE+2,cursorVisible:true}),2);
  assert(fills.some(call=>call.style==='#B7FFCA'&&call.args.join(',')==='16,14,8,2'));
  fills.length=0;assert.equal(video.render({cursorAddress:TEXT_VRAM_BASE+2,cursorVisible:false}),1);
  assert.equal(bus.debugPeek(TEXT_VRAM_BASE+1),before);assert.equal(bus.debugPeek(TEXT_VRAM_BASE+2),0);
}

console.log('SHINO-80 CURSOR / BEEPER v0.1: VRAM-SAFE CURSOR + BUS-VISIBLE BEL PASS');
