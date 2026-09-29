'use strict';

const assert=require('node:assert/strict');
const profiles=require('../src/devices/shino80/shino80-media-profiles.js');
const block=require('../src/devices/shino80/shino80-block-device.js');
const {PROFILE_ROWS,S80B_V3_HEADER,HIGH_RAM_RANGES}=require('./fixtures/shino80_phase3_contract_fixtures.cjs');
const u16=offset=>S80B_V3_HEADER[offset]|(S80B_V3_HEADER[offset+1]<<8);
const u32=offset=>(S80B_V3_HEADER[offset]|(S80B_V3_HEADER[offset+1]<<8)|(S80B_V3_HEADER[offset+2]<<16)|(S80B_V3_HEADER[offset+3]<<24))>>>0;

assert.equal(profiles.MEDIA_PROFILES.length,PROFILE_ROWS.length);
assert.equal(new Set(PROFILE_ROWS.map(row=>row.imageBytes)).size,PROFILE_ROWS.length,'native image lengths must remain unique');

for(const expected of PROFILE_ROWS){
  const actual=profiles.mediaProfileById(expected.id);assert(actual,`missing profile ${expected.id}`);
  assert.equal(Object.isFrozen(actual),true);assert.equal(Object.isFrozen(actual.dpb),true);
  for(const key of ['name','cylinders','heads','physicalSectorsPerTrack','physicalSectorSize','imageBytes','allocationBlockSize','directoryBytes','reservedSystemBytes','filesystemUsableBytes'])assert.equal(actual[key],expected[key],`${expected.name} ${key}`);
  for(const key of ['spt','bsh','blm','exm','dsm','drm','al0','al1','cks','off'])assert.equal(actual.dpb[key],expected[key],`${expected.name} DPB ${key}`);
  assert.equal(actual.logicalTracks,expected.cylinders*expected.heads);
  assert.equal(actual.logicalSectorsPerTrack,expected.physicalSectorsPerTrack*(expected.physicalSectorSize/128));
  assert.equal(actual.imageBytes,expected.cylinders*expected.heads*expected.physicalSectorsPerTrack*expected.physicalSectorSize);
  assert.equal(actual.dpb.dsm,Math.floor((actual.imageBytes-actual.reservedSystemBytes)/actual.allocationBlockSize)-1);
  assert.equal(profiles.mediaProfileForImageLength(expected.imageBytes),actual);
  const blank=profiles.createBlankMediaImage(expected.id);assert.equal(blank.length,expected.imageBytes);assert(blank.every(byte=>byte===0xE5));
}
assert.equal(profiles.mediaProfileById(0xFF),null);
assert.equal(profiles.mediaProfileForImageLength(12345),null);
assert.deepEqual(profiles.mediaProfilesForImageLength(12345),[]);

const classic=profiles.mediaProfileById(profiles.MEDIA_PROFILE_CLASSIC);
assert.equal(block.BLOCK_MEDIA_PROFILE_ID,classic.id);
assert.equal(block.BLOCK_TRACKS,classic.cylinders);
assert.equal(block.BLOCK_SECTORS_PER_TRACK,classic.physicalSectorsPerTrack);
assert.equal(block.BLOCK_SECTOR_SIZE,classic.physicalSectorSize);
assert.equal(block.BLOCK_IMAGE_SIZE,classic.imageBytes);
const largerProfileDevice=new block.Shino80BlockDevice({image:profiles.createBlankMediaImage(profiles.MEDIA_PROFILE_2HD_JP)});
assert.equal(largerProfileDevice.mediaProfileIdAt(0),profiles.MEDIA_PROFILE_2HD_JP,'Checkpoint B enables native multi-profile controller mounts');

assert.equal(S80B_V3_HEADER.length,64);
assert.equal(Buffer.from(S80B_V3_HEADER.subarray(0,4)).toString('ascii'),'S80B');
assert.equal(S80B_V3_HEADER[4],3);assert.equal(S80B_V3_HEADER[5],64);assert.equal(S80B_V3_HEADER[6],profiles.MEDIA_PROFILE_2HD_JP);
assert.equal(S80B_V3_HEADER[7],0);assert.equal(u32(0x08),0x2000);assert.equal(u32(0x0C),0x2000);
assert.equal(u32(0x10),0x40);assert.equal(u16(0x14),0x80);assert.equal(u16(0x16),0x8000);assert.equal(u16(0x18),0x8000);
assert.equal(u32(0x1A),0x100);assert.equal(u16(0x1E),0x900);assert.equal(u16(0x20),0xF400);assert.equal(u16(0x22),0xF400);
assert.equal(u32(0x24),0xA00);assert.equal(u16(0x28),0x800);assert.equal(u16(0x2A),0x9400);
assert.equal(u32(0x2C),0x1200);assert.equal(u16(0x30),0xE00);assert.equal(u16(0x32),0x9C00);
assert(S80B_V3_HEADER.subarray(0x34,0x3F).every(value=>value===0));
assert.equal(S80B_V3_HEADER.subarray(0,63).reduce((sum,value)=>(sum+value)&0xFF,0),0x95);
assert.equal(S80B_V3_HEADER[63],0x95);

const protectedRanges=[{name:'PAGE_ZERO_DMA',start:0x0000,end:0x00FF},{name:'TPA',start:0x0100,end:0x93FF},{name:'CCP',start:0x9400,end:0x9BFF},{name:'BDOS',start:0x9C00,end:0xA9FF}];
for(const [index,range] of HIGH_RAM_RANGES.entries()){
  assert.equal(range.end-range.start+1,range.size,`${range.name} size`);
  if(index)assert(HIGH_RAM_RANGES[index-1].end<range.start,`${HIGH_RAM_RANGES[index-1].name}/${range.name} overlap`);
  for(const other of HIGH_RAM_RANGES.slice(index+1))assert(range.end<other.start||range.start>other.end,`${range.name}/${other.name} overlap`);
  for(const protectedRange of protectedRanges)assert(range.end<protectedRange.start||range.start>protectedRange.end,`${range.name}/${protectedRange.name} overlap`);
}
assert.equal(HIGH_RAM_RANGES.find(range=>range.name==='LOADER_STACK').end+1,0xF000);
assert.equal(HIGH_RAM_RANGES.find(range=>range.name==='CBIOS_EXECUTABLE').end,0xFA7F);
assert.equal(HIGH_RAM_RANGES.find(range=>range.name==='DIRBUF').start,0xFD00);
assert.equal(HIGH_RAM_RANGES.find(range=>range.name==='RESERVED_TAIL').end,0xFCFF);
assert.equal(0xFCFF-0xF400+1,0x0900);

console.log('SHINO-80 PHASE 3 contract: 5 DPBs + S80B v3 header + high-RAM map PASS');
