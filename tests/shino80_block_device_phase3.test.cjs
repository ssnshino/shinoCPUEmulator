'use strict';

const assert=require('node:assert/strict');
const profiles=require('../src/devices/shino80/shino80-media-profiles.js');
const block=require('../src/devices/shino80/shino80-block-device.js');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');

function select(device,{drive=0,cylinder=0,head=0,sector=1}={}){
  device.writePort(block.BLOCK_DRIVE_PORT,drive);
  device.writePort(block.BLOCK_CYLINDER_PORT,cylinder);
  device.writePort(block.BLOCK_HEAD_PORT,head);
  device.writePort(block.BLOCK_SECTOR_PORT,sector);
}

function pattern(length,seed){return Uint8Array.from({length},(_,index)=>(seed+index*29)&0xFF);}

function writeSector(device,selection,bytes){
  select(device,selection);device.writePort(block.BLOCK_COMMAND_PORT,block.BLOCK_COMMAND_WRITE);
  assert.equal(device.transferRemaining,bytes.length);
  for(const byte of bytes)device.writePort(block.BLOCK_DATA_PORT,byte);
  assert.equal(device.transferRemaining,0);
}

function readSector(device,selection,length){
  select(device,selection);device.writePort(block.BLOCK_COMMAND_PORT,block.BLOCK_COMMAND_READ);
  assert.equal(device.transferRemaining,length);
  return Uint8Array.from({length},()=>device.readPort(block.BLOCK_DATA_PORT));
}

assert.equal(block.BLOCK_CYLINDER_PORT,block.BLOCK_TRACK_PORT);
assert.equal(block.BLOCK_HEAD_PORT,0x37);
assert.equal(block.BLOCK_MEDIA_PROFILE_PORT,0x38);
assert.equal(block.BLOCK_ERROR_BAD_CYLINDER,block.BLOCK_ERROR_BAD_TRACK);
assert.equal(block.BLOCK_ERROR_BAD_HEAD,0x07);

// Every frozen profile mounts natively and transfers the exact physical sector
// size at both geometry boundaries.
for(const profile of profiles.MEDIA_PROFILES){
  const device=new block.Shino80BlockDevice({image:profiles.createBlankMediaImage(profile.id)});
  assert.equal(device.mediaProfileIdAt(0),profile.id);
  assert.equal(device.readPort(block.BLOCK_MEDIA_PROFILE_PORT),profile.id);
  for(const [selection,seed] of [
    [{cylinder:0,head:0,sector:1},0x11+profile.id],
    [{cylinder:profile.cylinders-1,head:profile.heads-1,sector:profile.physicalSectorsPerTrack},0x71+profile.id]
  ]){
    const expected=pattern(profile.physicalSectorSize,seed);
    writeSector(device,selection,expected);
    assert.deepEqual(readSector(device,selection,profile.physicalSectorSize),expected,profile.name);
    assert.equal(device.sectorOffset(),(((selection.cylinder*profile.heads)+selection.head)*profile.physicalSectorsPerTrack+(selection.sector-1))*profile.physicalSectorSize);
  }
}

// A: and B: independently own their profile, medium and write protection.
{
  const device=new block.Shino80BlockDevice({image:profiles.createBlankMediaImage(profiles.MEDIA_PROFILE_CLASSIC)});
  device.mountImage(profiles.createBlankMediaImage(profiles.MEDIA_PROFILE_2HD_JP),{drive:1,writeProtected:true});
  select(device,{drive:0,cylinder:12,head:0,sector:7});
  assert.equal(device.readPort(block.BLOCK_MEDIA_PROFILE_PORT),profiles.MEDIA_PROFILE_CLASSIC);
  device.writePort(block.BLOCK_DRIVE_PORT,1);
  assert.equal(device.track,12);assert.equal(device.head,0);assert.equal(device.sector,7);
  assert.equal(device.readPort(block.BLOCK_MEDIA_PROFILE_PORT),profiles.MEDIA_PROFILE_2HD_JP);
  assert.equal(device.status()&block.BLOCK_STATUS_WRITE_PROTECT,block.BLOCK_STATUS_WRITE_PROTECT);
}

// MEDIA_PROFILE is observer-only: FF for no media/invalid drive, does not alter
// ERROR, and ignores writes without aborting a transfer.
{
  const device=new block.Shino80BlockDevice({image:profiles.createBlankMediaImage(profiles.MEDIA_PROFILE_2DD_720)});
  device.debugPokePort(block.BLOCK_ERROR_PORT,block.BLOCK_ERROR_PROTOCOL);
  device.writePort(block.BLOCK_DRIVE_PORT,1);
  assert.equal(device.readPort(block.BLOCK_MEDIA_PROFILE_PORT),profiles.MEDIA_PROFILE_NONE);
  assert.equal(device.error,block.BLOCK_ERROR_PROTOCOL);
  device.writePort(block.BLOCK_DRIVE_PORT,2);
  assert.equal(device.readPort(block.BLOCK_MEDIA_PROFILE_PORT),profiles.MEDIA_PROFILE_NONE);
  assert.equal(device.error,block.BLOCK_ERROR_PROTOCOL);
  select(device,{drive:0});device.writePort(block.BLOCK_COMMAND_PORT,block.BLOCK_COMMAND_READ);
  const remaining=device.transferRemaining;
  device.writePort(block.BLOCK_MEDIA_PROFILE_PORT,0x04);
  assert.equal(device.transferRemaining,remaining);assert.equal(device.transferMode,'read');
}

// Command validation follows the frozen priority exactly.
for(const {setup,command=block.BLOCK_COMMAND_READ,error} of [
  {setup:d=>{d.drive=2;d.track=0xFF;d.head=0xFF;d.sector=0;},error:block.BLOCK_ERROR_BAD_DRIVE},
  {setup:d=>{d.drive=1;d.track=0xFF;d.head=0xFF;d.sector=0;},error:block.BLOCK_ERROR_NO_MEDIA},
  {setup:d=>{d.track=0xFF;d.head=0xFF;d.sector=0;},error:block.BLOCK_ERROR_BAD_CYLINDER},
  {setup:d=>{d.head=0xFF;d.sector=0;},error:block.BLOCK_ERROR_BAD_HEAD},
  {setup:d=>{d.sector=0;},error:block.BLOCK_ERROR_BAD_SECTOR},
  {setup:d=>{d.slots[0].writeProtected=true;},command:block.BLOCK_COMMAND_WRITE,error:block.BLOCK_ERROR_WRITE_PROTECTED}
]){
  const device=new block.Shino80BlockDevice({image:profiles.createBlankMediaImage(profiles.MEDIA_PROFILE_CLASSIC)});
  setup(device);device.writePort(block.BLOCK_COMMAND_PORT,command);
  assert.equal(device.error,error);
}

// C/H/S/D writes abort transfers without adding an error; 7F is command reset
// and full reset has the distinct frozen reset state.
for(const port of [block.BLOCK_DRIVE_PORT,block.BLOCK_CYLINDER_PORT,block.BLOCK_HEAD_PORT,block.BLOCK_SECTOR_PORT]){
  const device=new block.Shino80BlockDevice({image:profiles.createBlankMediaImage(profiles.MEDIA_PROFILE_2HD_1440)});
  device.writePort(block.BLOCK_COMMAND_PORT,block.BLOCK_COMMAND_READ);
  device.writePort(port,device.readPort(port));
  assert.equal(device.transferMode,null);assert.equal(device.error,block.BLOCK_ERROR_NONE);
}
{
  const device=new block.Shino80BlockDevice({image:profiles.createBlankMediaImage(profiles.MEDIA_PROFILE_2HD_JP)});
  select(device,{drive:0,cylinder:3,head:1,sector:4});
  device.writePort(block.BLOCK_COMMAND_PORT,block.BLOCK_COMMAND_WRITE);device.writePort(block.BLOCK_DATA_PORT,0x44);
  device.writePort(block.BLOCK_COMMAND_PORT,block.BLOCK_COMMAND_READ);
  assert.equal(device.transferMode,'read');assert.equal(device.transferRemaining,1024);
  device.readPort(block.BLOCK_DATA_PORT);device.readPort(block.BLOCK_DATA_PORT);
  device.writePort(block.BLOCK_COMMAND_PORT,block.BLOCK_COMMAND_RESET);
  assert.equal(device.transferMode,null);assert.equal(device.error,block.BLOCK_ERROR_NONE);
  assert.equal(device.drive,0);assert.equal(device.track,3);assert.equal(device.head,1);assert.equal(device.sector,4);
  device.reset();
  assert.equal(device.drive,0);assert.equal(device.track,0);assert.equal(device.head,0);assert.equal(device.sector,1);
  assert.equal(device.command,0);assert.equal(device.error,0);assert.equal(device.transferMode,null);
}

// DATA access beyond the exact byte count is a stable protocol failure.
for(const mode of ['read','write']){
  const profile=profiles.mediaProfileById(profiles.MEDIA_PROFILE_2DD_720);
  const device=new block.Shino80BlockDevice({image:profiles.createBlankMediaImage(profile.id)});
  device.writePort(block.BLOCK_COMMAND_PORT,mode==='read'?block.BLOCK_COMMAND_READ:block.BLOCK_COMMAND_WRITE);
  for(let index=0;index<profile.physicalSectorSize;index++){
    if(mode==='read')device.readPort(block.BLOCK_DATA_PORT);else device.writePort(block.BLOCK_DATA_PORT,index);
  }
  if(mode==='read')assert.equal(device.readPort(block.BLOCK_DATA_PORT),0xFF);else device.writePort(block.BLOCK_DATA_PORT,0xCC);
  assert.equal(device.error,block.BLOCK_ERROR_PROTOCOL);
}

// A native image round-trips exactly and profile inference is restored on reinsert.
{
  const profile=profiles.mediaProfileById(profiles.MEDIA_PROFILE_2HD_AT_1200);
  const device=new block.Shino80BlockDevice({image:profiles.createBlankMediaImage(profile.id)});
  const expected=pattern(profile.physicalSectorSize,0x39),selection={cylinder:15,head:1,sector:12};
  writeSector(device,selection,expected);
  const before=device.exportImage(),ejected=device.eject();
  assert.deepEqual(ejected,before);assert.equal(device.mediaProfileIdAt(0),profiles.MEDIA_PROFILE_NONE);
  device.mountImage(ejected);
  assert.equal(device.mediaProfileIdAt(0),profile.id);assert.deepEqual(device.exportImage(),before);
}

// Bus integration retains full Z80 I/O addresses while decoding new low ports.
{
  const device=new block.Shino80BlockDevice({image:profiles.createBlankMediaImage(profiles.MEDIA_PROFILE_2HD_JP)});
  const bus=new Shino80Bus({traceLimit:16,ioDevices:[device]});
  bus.cpuIoWrite(0xAB37,1);
  assert.equal(bus.cpuIoRead(0xCD38),profiles.MEDIA_PROFILE_2HD_JP);
  assert.equal(device.head,1);
  assert.equal(bus.trace.at(-1).address,0xCD38);
}

console.log('SHINO-80 PHASE 3 CHECKPOINT B: MULTI-PROFILE BLOCK DEVICE PASS');
