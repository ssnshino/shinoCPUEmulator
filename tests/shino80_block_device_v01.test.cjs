'use strict';

const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {
  Shino80BlockDevice,createBlankBlockImage,
  BLOCK_STATUS_PORT,BLOCK_COMMAND_PORT,BLOCK_DRIVE_PORT,BLOCK_TRACK_PORT,BLOCK_SECTOR_PORT,BLOCK_DATA_PORT,BLOCK_ERROR_PORT,
  BLOCK_COMMAND_READ,BLOCK_COMMAND_WRITE,BLOCK_COMMAND_RESET,
  BLOCK_STATUS_READY,BLOCK_STATUS_BUSY,BLOCK_STATUS_DRQ,BLOCK_STATUS_WRITE_PROTECT,BLOCK_STATUS_ERROR,
  BLOCK_ERROR_NONE,BLOCK_ERROR_NO_MEDIA,BLOCK_ERROR_BAD_DRIVE,BLOCK_ERROR_BAD_TRACK,BLOCK_ERROR_BAD_SECTOR,BLOCK_ERROR_WRITE_PROTECTED,BLOCK_ERROR_PROTOCOL,
  BLOCK_TRACKS,BLOCK_SECTORS_PER_TRACK,BLOCK_SECTOR_SIZE,BLOCK_IMAGE_SIZE,BLOCK_BLANK_BYTE
}=require('../src/devices/shino80/shino80-block-device.js');

assert.equal(BLOCK_IMAGE_SIZE,256256);
assert.equal(BLOCK_TRACKS,77);
assert.equal(BLOCK_SECTORS_PER_TRACK,26);
assert.equal(BLOCK_SECTOR_SIZE,128);
assert.equal(createBlankBlockImage().every(byte=>byte===BLOCK_BLANK_BYTE),true);
assert.throws(()=>new Shino80BlockDevice({image:new Uint8Array(1)}),/exactly 256256 bytes/);
assert.throws(()=>new Shino80BlockDevice({image:[]}),/Uint8Array/);

function select(device,track,sector,drive=0){
  device.writePort(BLOCK_DRIVE_PORT,drive);
  device.writePort(BLOCK_TRACK_PORT,track);
  device.writePort(BLOCK_SECTOR_PORT,sector);
}

function sectorPattern(seed){
  return Uint8Array.from({length:BLOCK_SECTOR_SIZE},(_,index)=>(seed+index*17)&0xFF);
}

// A mounted medium is copied in, reports READY and exports only defensive copies.
{
  const source=createBlankBlockImage(0x11);
  const device=new Shino80BlockDevice({image:source});
  source[0]=0x99;
  assert.equal(device.status(),BLOCK_STATUS_READY);
  assert.equal(device.status()&BLOCK_STATUS_BUSY,0,'v0.1 commands are synchronous');
  assert.equal(device.exportImage()[0],0x11);
  const exported=device.exportImage();exported[0]=0x77;
  assert.equal(device.exportImage()[0],0x11);
}

// First and last sectors complete exact 128-byte PIO write/read round trips.
for(const [track,sector,seed] of [[0,1,3],[BLOCK_TRACKS-1,BLOCK_SECTORS_PER_TRACK,91]]){
  const device=new Shino80BlockDevice({image:createBlankBlockImage()});
  const expected=sectorPattern(seed);
  select(device,track,sector);
  device.writePort(BLOCK_COMMAND_PORT,BLOCK_COMMAND_WRITE);
  assert.equal(device.status(),BLOCK_STATUS_READY|BLOCK_STATUS_DRQ);
  for(const byte of expected)device.writePort(BLOCK_DATA_PORT,byte);
  assert.equal(device.status(),BLOCK_STATUS_READY);
  select(device,track,sector);
  device.writePort(BLOCK_COMMAND_PORT,BLOCK_COMMAND_READ);
  assert.equal(device.transferRemaining,BLOCK_SECTOR_SIZE);
  assert.equal(device.debugPeekPort(BLOCK_DATA_PORT),expected[0]);
  assert.equal(device.transferRemaining,BLOCK_SECTOR_SIZE,'debug peek must not consume DATA');
  const actual=Uint8Array.from({length:BLOCK_SECTOR_SIZE},()=>device.readPort(BLOCK_DATA_PORT));
  assert.deepEqual(actual,expected);
  assert.equal(device.transferRemaining,0);
  assert.equal(device.status(),BLOCK_STATUS_READY);
}

// Partial writes never reach the medium; RESET and register writes cancel them.
{
  const device=new Shino80BlockDevice({image:createBlankBlockImage(0xA5)});
  select(device,3,4);device.writePort(BLOCK_COMMAND_PORT,BLOCK_COMMAND_WRITE);
  for(let index=0;index<64;index++)device.writePort(BLOCK_DATA_PORT,index);
  device.writePort(BLOCK_COMMAND_PORT,BLOCK_COMMAND_RESET);
  assert.equal(device.command,BLOCK_COMMAND_RESET);
  assert.equal(device.exportImage()[device.sectorOffset()],0xA5);
  device.writePort(BLOCK_COMMAND_PORT,BLOCK_COMMAND_WRITE);
  device.writePort(BLOCK_DATA_PORT,0x11);
  device.writePort(BLOCK_SECTOR_PORT,5);
  assert.equal(device.transferMode,null);
  assert.equal(device.exportImage()[device.sectorOffset()],0xA5);
}

// Every invalid selection and protocol path has a stable error code.
for(const [setup,command,error] of [
  [d=>select(d,0,1,0),BLOCK_COMMAND_READ,BLOCK_ERROR_NO_MEDIA],
  [d=>{d.mountImage(createBlankBlockImage());select(d,0,1,1);},BLOCK_COMMAND_READ,BLOCK_ERROR_BAD_DRIVE],
  [d=>{d.mountImage(createBlankBlockImage());select(d,BLOCK_TRACKS,1);},BLOCK_COMMAND_READ,BLOCK_ERROR_BAD_TRACK],
  [d=>{d.mountImage(createBlankBlockImage());select(d,0,0);},BLOCK_COMMAND_READ,BLOCK_ERROR_BAD_SECTOR],
  [d=>{d.mountImage(createBlankBlockImage(),{writeProtected:true});select(d,0,1);},BLOCK_COMMAND_WRITE,BLOCK_ERROR_WRITE_PROTECTED],
  [d=>{d.mountImage(createBlankBlockImage());select(d,0,1);},0x55,BLOCK_ERROR_PROTOCOL]
]){
  const device=new Shino80BlockDevice();setup(device);device.writePort(BLOCK_COMMAND_PORT,command);
  assert.equal(device.readPort(BLOCK_ERROR_PORT),error);
  assert.equal(device.status()&BLOCK_STATUS_ERROR,BLOCK_STATUS_ERROR);
  assert.equal(device.status()&BLOCK_STATUS_DRQ,0);
  device.writePort(BLOCK_ERROR_PORT,0);assert.equal(device.error,BLOCK_ERROR_NONE);
}
{
  const device=new Shino80BlockDevice({image:createBlankBlockImage(),writeProtected:true});
  assert.equal(device.status(),BLOCK_STATUS_READY|BLOCK_STATUS_WRITE_PROTECT);
  assert.equal(device.readPort(BLOCK_DATA_PORT),0xFF);
  assert.equal(device.error,BLOCK_ERROR_PROTOCOL);
}

// Controller reset preserves media and write protection; eject returns a copy.
{
  const image=createBlankBlockImage(0x22),device=new Shino80BlockDevice({image,writeProtected:true});
  select(device,8,9);device.writePort(BLOCK_COMMAND_PORT,0xAA);device.reset();
  assert.equal(device.mounted,true);assert.equal(device.writeProtected,true);
  assert.equal(device.drive,0);assert.equal(device.track,0);assert.equal(device.sector,1);
  assert.equal(device.error,BLOCK_ERROR_NONE);assert.equal(device.exportImage()[0],0x22);
  const ejected=device.eject();ejected[0]=0x33;
  assert.equal(device.mounted,false);assert.equal(device.status(),0);
}

// The real Bus keeps the complete Z80 port in traces while the device decodes
// its low byte. Debug access is observer-only and creates no trace event.
{
  const pattern=sectorPattern(0x40),image=createBlankBlockImage();image.set(pattern,0);
  const device=new Shino80BlockDevice({image}),bus=new Shino80Bus({traceLimit:512,ioDevices:[device]});
  bus.cpuIoWrite(0xAB32,0);bus.cpuIoWrite(0xAB33,0);bus.cpuIoWrite(0xAB34,1);
  bus.cpuIoWrite(0xAB31,BLOCK_COMMAND_READ);
  const before=bus.traceCount;
  assert.equal(bus.debugIoPeek(0xAB35),pattern[0]);assert.equal(bus.traceCount,before);
  assert.equal(bus.cpuIoRead(0xAB35),pattern[0]);
  const event=bus.trace.at(-1);
  assert.equal(event.address,0xAB35);assert.equal(event.meta.device,'SHINO80_BLOCK_DEVICE_A');
  assert.deepEqual(event.signals,['IORQ','RD']);
  bus.resetIoDevices();assert.equal(device.mounted,true);assert.equal(device.transferMode,null);
}

// A real Z80 program can stream a sector with OTIR/INIR through the Bus. This
// proves the device contract without a JavaScript shortcut into machine RAM.
{
  const device=new Shino80BlockDevice({image:createBlankBlockImage()}),bus=new Shino80Bus({traceLimit:4096,ioDevices:[device]});
  const cpu=new Z80Core(bus),pattern=sectorPattern(0x27);
  bus.load(pattern,0x4000);
  const writeProgram=[
    0xAF,0xD3,0x32,                 // XOR A / OUT (DRIVE),A
    0xD3,0x33,                     // OUT (TRACK),A
    0x3C,0xD3,0x34,                // INC A / OUT (SECTOR),A
    0x3C,0xD3,0x31,                // INC A / OUT (COMMAND),A = WRITE
    0x21,0x00,0x40,0x06,0x80,0x0E,0x35,0xED,0xB3, // HL=4000, B=128, C=DATA, OTIR
    0x76
  ];
  bus.load(writeProgram,0x2000);cpu.reset();cpu.state.pc=0x2000;
  cpu.runInstructions(400);assert.equal(cpu.state.halted,true);
  assert.deepEqual(device.exportImage().subarray(0,BLOCK_SECTOR_SIZE),pattern);

  const readProgram=[
    0xAF,0xD3,0x32,0xD3,0x33,0x3C,0xD3,0x34, // select A: track 0 sector 1
    0x3E,0x01,0xD3,0x31,                     // READ command
    0x21,0x00,0x41,0x06,0x80,0x0E,0x35,0xED,0xB2, // HL=4100, INIR
    0x76
  ];
  bus.load(readProgram,0x2100);cpu.reset();cpu.state.pc=0x2100;
  cpu.runInstructions(400);assert.equal(cpu.state.halted,true);
  assert.deepEqual(bus.memory.subarray(0x4100,0x4180),pattern);
  assert(bus.trace.some(event=>event.space==='IO'&&event.operation==='READ'&&event.meta.device===device.id));
  assert(bus.trace.some(event=>event.space==='IO'&&event.operation==='WRITE'&&event.meta.device===device.id));
}

console.log('SHINO-80 VIRTUAL BLOCK DEVICE v0.1: ALL TESTS PASS');
