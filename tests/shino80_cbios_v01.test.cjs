'use strict';

const assert=require('node:assert/strict');
const {Shino80Memory}=require('../src/machine/shino80/shino80-memory.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Shino80Keyboard}=require('../src/devices/shino80/shino80-keyboard.js');
const {
  Shino80BlockDevice,createBlankBlockImage,BLOCK_SECTOR_SIZE,BLOCK_IMAGE_SIZE
}=require('../src/devices/shino80/shino80-block-device.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {MEMORY_CONTROL_LOW_RAM}=require('../src/machine/shino80/shino80-memory.js');
const {
  buildCbios,CBIOS_ORG,CBIOS_ENTRY_NAMES,CBIOS_ENTRY_SIZE,CBIOS_DEFAULT_DMA,DPB,TEXT_VRAM_BASE
}=require('../src/firmware/shino80/shino80-cbios.js');

const cbios=buildCbios(),lo=value=>value&255,hi=value=>(value>>8)&255;
const call=address=>[0xCD,lo(address),hi(address)];
const word=(opcode,value)=>[opcode,lo(value),hi(value)];
const api=name=>cbios.labels[`CBIOS_API_${name}`];

assert.equal(CBIOS_ORG,0xFA00);
assert.equal(CBIOS_ENTRY_NAMES.length,17);
assert.equal(cbios.origin,CBIOS_ORG);
assert(cbios.end<=0x10000);
assert.equal(cbios.bytes.length,566);

// The standard 17-entry table is contiguous JP instructions in exact order.
for(const [index,name] of CBIOS_ENTRY_NAMES.entries()){
  const address=CBIOS_ORG+index*CBIOS_ENTRY_SIZE,target=cbios.labels[`CBIOS_${name}`];
  assert.equal(api(name),address);
  assert.deepEqual(Array.from(cbios.bytes.slice(address-CBIOS_ORG,address-CBIOS_ORG+3)),[0xC3,lo(target),hi(target)]);
}

// DPH and DPB have exact little-endian CP/M 2.2 layout.
{
  const at=address=>address-CBIOS_ORG,wordAt=address=>cbios.bytes[at(address)]|(cbios.bytes[at(address)+1]<<8);
  const dpb=cbios.bytes.slice(at(cbios.labels.CBIOS_DPB),at(cbios.labels.CBIOS_DPB)+15);
  assert.deepEqual(Array.from(dpb),[
    DPB.spt,0,DPB.bsh,DPB.blm,DPB.exm,DPB.dsm,0,DPB.drm,0,DPB.al0,DPB.al1,DPB.cks,0,DPB.off,0
  ]);
  const dph=cbios.labels.CBIOS_DPH;
  assert.equal(wordAt(dph),0);assert.equal(wordAt(dph+2),0);assert.equal(wordAt(dph+4),0);assert.equal(wordAt(dph+6),0);
  assert.equal(wordAt(dph+8),cbios.labels.CBIOS_DIRBUF);
  assert.equal(wordAt(dph+10),cbios.labels.CBIOS_DPB);
  assert.equal(wordAt(dph+12),cbios.labels.CBIOS_CSV);
  assert.equal(wordAt(dph+14),cbios.labels.CBIOS_ALV);
}

function machine({image=createBlankBlockImage(),writeProtected=false,traceLimit=20000}={}){
  const keyboard=new Shino80Keyboard({capacity:256});
  const disk=new Shino80BlockDevice({image,writeProtected});
  const memory=new Shino80Memory();
  const bus=new Shino80Bus({traceLimit,memoryDevice:memory,ioDevices:[keyboard,disk]});
  bus.load(cbios.bytes,CBIOS_ORG);bus.cpuIoWrite(0,MEMORY_CONTROL_LOW_RAM,{purpose:'TEST_ALL_RAM'});
  const cpu=new Z80Core(bus);cpu.reset();
  return {keyboard,disk,memory,bus,cpu};
}
function run(m,bytes,address=0x7000,limit=200000){
  m.bus.load(bytes,address);Object.assign(m.cpu.state,{pc:address,sp:0xF700,halted:false});
  let count=0;while(!m.cpu.state.halted&&count++<limit)m.cpu.step();
  assert(count<limit,'CBIOS program timeout');return count;
}
function pattern(seed){return Uint8Array.from({length:128},(_,index)=>(seed+index*29)&255);}

// BOOT initializes state. CONOUT is RAM-only and handles CP/M CR/LF output.
{
  const m=machine();
  run(m,[...call(api('BOOT')),0x0E,0x41,...call(api('CONOUT')),0x0E,13,...call(api('CONOUT')),0x0E,10,...call(api('CONOUT')),0x0E,0x42,...call(api('CONOUT')),0x76]);
  assert.equal(m.bus.debugPeek(TEXT_VRAM_BASE),0x41);
  assert.equal(m.bus.debugPeek(TEXT_VRAM_BASE+80),0x42);
  assert.equal(m.bus.debugPeek(cbios.labels.CBIOS_SELECTED_DRIVE),0);
  assert.equal(m.bus.debugPeek(cbios.labels.CBIOS_SELECTED_SECTOR),1);
  assert.equal(m.bus.debugPeek(cbios.labels.CBIOS_DMA),lo(CBIOS_DEFAULT_DMA));
  assert.equal(m.bus.debugPeek(cbios.labels.CBIOS_DMA+1),hi(CBIOS_DEFAULT_DMA));
}

// CONST is nonblocking; CONIN blocks on the real Keyboard FIFO and masks parity.
{
  const m=machine();
  run(m,[...call(api('CONST')),...word(0x32,0xE200),0x76]);
  assert.equal(m.bus.debugPeek(0xE200),0);
  m.keyboard.enqueueByte(0xDA);
  run(m,[...call(api('CONST')),...word(0x32,0xE200),...call(api('CONIN')),...word(0x32,0xE201),0x76]);
  assert.equal(m.bus.debugPeek(0xE200),0xFF);assert.equal(m.bus.debugPeek(0xE201),0x5A);
}

// SELDSK returns DPH for A: and zero for all unsupported drives.
{
  const m=machine();
  run(m,[0x0E,0,...call(api('SELDSK')),...word(0x22,0xE210),0x0E,1,...call(api('SELDSK')),...word(0x22,0xE212),0x76]);
  assert.equal(m.bus.debugPeek(0xE210)|(m.bus.debugPeek(0xE211)<<8),cbios.labels.CBIOS_DPH);
  assert.equal(m.bus.debugPeek(0xE212)|(m.bus.debugPeek(0xE213)<<8),0);
}

// HOME, LISTST, READER and both SECTRAN paths follow their ABI contracts.
{
  const m=machine();m.bus.load([9,7,5,3],0x4300);
  run(m,[
    ...word(0x01,12),...call(api('SETTRK')),...call(api('HOME')),
    ...word(0x01,3),...word(0x11,0),...call(api('SECTRAN')),...word(0x22,0xE214),
    ...word(0x01,1),...word(0x11,0x4300),...call(api('SECTRAN')),...word(0x22,0xE216),
    ...call(api('LISTST')),...word(0x32,0xE218),...call(api('READER')),...word(0x32,0xE219),0x76
  ]);
  assert.equal(m.bus.debugPeek(cbios.labels.CBIOS_SELECTED_TRACK),0);
  assert.equal(m.bus.debugPeek(0xE214)|(m.bus.debugPeek(0xE215)<<8),3);
  assert.equal(m.bus.debugPeek(0xE216)|(m.bus.debugPeek(0xE217)<<8),7);
  assert.equal(m.bus.debugPeek(0xE218),0xFF);assert.equal(m.bus.debugPeek(0xE219),0x1A);
}

// READ and WRITE use the standard vector, selected registers and exactly 128
// Bus-visible DATA transfers, including the last legal medium sector.
{
  const first=pattern(7),last=pattern(91),image=createBlankBlockImage();image.set(first,0);
  const m=machine({image,traceLimit:50000});m.bus.load(last,0x4100);m.bus.clearTrace();
  const program=[
    ...call(api('BOOT')),0x0E,0,...call(api('SELDSK')),
    ...word(0x01,0),...call(api('SETTRK')),...word(0x01,1),...call(api('SETSEC')),...word(0x01,0x4000),...call(api('SETDMA')),
    ...call(api('READ')),...word(0x32,0xE220),
    ...word(0x01,76),...call(api('SETTRK')),...word(0x01,26),...call(api('SETSEC')),...word(0x01,0x4100),...call(api('SETDMA')),
    0x0E,0,...call(api('WRITE')),...word(0x32,0xE221),0x76
  ];
  run(m,program);
  assert.equal(m.bus.debugPeek(0xE220),0);assert.equal(m.bus.debugPeek(0xE221),0);
  assert.deepEqual(m.memory.ram.slice(0x4000,0x4080),first);
  assert.deepEqual(m.disk.exportImage().slice(BLOCK_IMAGE_SIZE-BLOCK_SECTOR_SIZE),last);
  const io=m.bus.trace.filter(event=>event.space==='IO'&&event.meta.device===m.disk.id);
  assert.equal(io.filter(event=>event.operation==='READ'&&(event.address&255)===0x35).length,128);
  assert.equal(io.filter(event=>event.operation==='WRITE'&&(event.address&255)===0x35).length,128);
}

// CBIOS maps device failures onto the CP/M BIOS nonzero error convention.
{
  const m=machine({writeProtected:true});m.bus.load(pattern(3),0x4200);
  run(m,[...call(api('BOOT')),...word(0x01,0x4200),...call(api('SETDMA')),0x0E,0,...call(api('WRITE')),...word(0x32,0xE230),0x76]);
  assert.equal(m.bus.debugPeek(0xE230),1);assert.equal(m.disk.error,5);
}

// Original sector-1 payload: CBIOS reads it to 8000h, then the CPU executes it
// in all-RAM mode. No ROM or host-side memory shortcut participates.
{
  const signature=0xE240,payload=[...word(0x21,0x4243),...word(0x22,signature),...word(0x21,0x2149),...word(0x22,signature+2),0x76]; // CBI!
  const image=createBlankBlockImage();image.set(payload,0);
  const m=machine({image,traceLimit:50000});m.bus.clearTrace();
  const loader=[
    ...call(api('BOOT')),0x0E,0,...call(api('SELDSK')),
    ...word(0x01,0),...call(api('SETTRK')),...word(0x01,1),...call(api('SETSEC')),...word(0x01,0x8000),...call(api('SETDMA')),
    ...call(api('READ')),0xB7,0xC2,0x00,0x70,...word(0xC3,0x8000)
  ];
  run(m,loader);
  assert.equal(String.fromCharCode(...m.memory.ram.slice(signature,signature+4)),'CBI!');
  assert(m.bus.trace.some(event=>event.purpose==='OPCODE_FETCH'&&event.address===0x8000&&event.meta.memorySource==='RAM'));
  assert(!m.bus.trace.some(event=>event.meta?.memorySource==='BOOT_ROM'||event.meta?.memorySource==='EXTENSION_ROM'));
}

console.log('SHINO-80 CBIOS v0.1: 17 ENTRY ABI + CONSOLE + DISK + RAM BOOT PROOF PASS');
