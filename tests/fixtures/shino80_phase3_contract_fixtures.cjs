'use strict';

const PROFILE_ROWS=Object.freeze([
  Object.freeze({id:0x00,name:'CLASSIC',cylinders:77,heads:1,physicalSectorsPerTrack:26,physicalSectorSize:128,imageBytes:256256,spt:26,bsh:3,blm:7,exm:0,dsm:242,drm:63,al0:0xC0,al1:0,cks:16,off:2,allocationBlockSize:1024,directoryBytes:2048,reservedSystemBytes:6656,filesystemUsableBytes:246784}),
  Object.freeze({id:0x01,name:'2HD-JP',cylinders:77,heads:2,physicalSectorsPerTrack:8,physicalSectorSize:1024,imageBytes:1261568,spt:64,bsh:6,blm:63,exm:7,dsm:152,drm:255,al0:0x80,al1:0,cks:64,off:1,allocationBlockSize:8192,directoryBytes:8192,reservedSystemBytes:8192,filesystemUsableBytes:1245184}),
  Object.freeze({id:0x02,name:'2DD-720',cylinders:80,heads:2,physicalSectorsPerTrack:9,physicalSectorSize:512,imageBytes:737280,spt:36,bsh:5,blm:31,exm:3,dsm:176,drm:127,al0:0x80,al1:0,cks:32,off:2,allocationBlockSize:4096,directoryBytes:4096,reservedSystemBytes:9216,filesystemUsableBytes:720896}),
  Object.freeze({id:0x03,name:'2HD-AT-1200',cylinders:80,heads:2,physicalSectorsPerTrack:15,physicalSectorSize:512,imageBytes:1228800,spt:60,bsh:6,blm:63,exm:7,dsm:148,drm:255,al0:0x80,al1:0,cks:64,off:1,allocationBlockSize:8192,directoryBytes:8192,reservedSystemBytes:7680,filesystemUsableBytes:1212416}),
  Object.freeze({id:0x04,name:'2HD-1440',cylinders:80,heads:2,physicalSectorsPerTrack:18,physicalSectorSize:512,imageBytes:1474560,spt:72,bsh:6,blm:63,exm:7,dsm:177,drm:255,al0:0x80,al1:0,cks:64,off:1,allocationBlockSize:8192,directoryBytes:8192,reservedSystemBytes:9216,filesystemUsableBytes:1449984})
]);

const S80B_V3_HEADER=Uint8Array.from([
  0x53,0x38,0x30,0x42,0x03,0x40,0x01,0x00,0x00,0x20,0x00,0x00,0x00,0x20,0x00,0x00,
  0x40,0x00,0x00,0x00,0x80,0x00,0x00,0x80,0x00,0x80,0x00,0x01,0x00,0x00,0x00,0x09,
  0x00,0xF4,0x00,0xF4,0x00,0x0A,0x00,0x00,0x00,0x08,0x00,0x94,0x00,0x12,0x00,0x00,
  0x00,0x0E,0x00,0x9C,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x95
]);

const HIGH_RAM_RANGES=Object.freeze([
  Object.freeze({name:'PHYSICAL_SECTOR_SCRATCH',start:0xE800,end:0xEBFF,size:1024}),
  Object.freeze({name:'LOADER_STACK',start:0xEC00,end:0xEFFF,size:1024}),
  Object.freeze({name:'RESERVED_GUARD',start:0xF000,end:0xF3FF,size:1024}),
  Object.freeze({name:'CBIOS_EXECUTABLE',start:0xF400,end:0xFA7F,size:1664}),
  Object.freeze({name:'DPH_A_B',start:0xFA80,end:0xFA9F,size:32}),
  Object.freeze({name:'DPB_PROFILES',start:0xFAA0,end:0xFAEF,size:80}),
  Object.freeze({name:'CSV_A',start:0xFAF0,end:0xFB2F,size:64}),
  Object.freeze({name:'CSV_B',start:0xFB30,end:0xFB6F,size:64}),
  Object.freeze({name:'ALV_A',start:0xFB70,end:0xFB8F,size:32}),
  Object.freeze({name:'ALV_B',start:0xFB90,end:0xFBAF,size:32}),
  Object.freeze({name:'DEBLOCK_A',start:0xFBB0,end:0xFBCF,size:32}),
  Object.freeze({name:'DEBLOCK_B',start:0xFBD0,end:0xFBEF,size:32}),
  Object.freeze({name:'RMW_STATE',start:0xFBF0,end:0xFC0F,size:32}),
  Object.freeze({name:'RESERVED_TAIL',start:0xFC10,end:0xFCFF,size:240}),
  Object.freeze({name:'DIRBUF',start:0xFD00,end:0xFD7F,size:128})
]);

module.exports={PROFILE_ROWS,S80B_V3_HEADER,HIGH_RAM_RANGES};
