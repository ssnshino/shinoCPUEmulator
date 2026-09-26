(function(root,factory){
  const block=(typeof module==='object'&&module.exports)?require('../../devices/shino80/shino80-block-device.js'):root.SHINO_BLOCK_DEVICE;
  const cbios=(typeof module==='object'&&module.exports)?require('./shino80-cbios.js'):root.SHINO_CBIOS;
  const cpm22=(typeof module==='object'&&module.exports)?require('./shino80-cpm22.js'):root.SHINO_CPM22;
  const filesystem=(typeof module==='object'&&module.exports)?require('./shino80-cpm-filesystem.js'):root.SHINO_CPM_FILESYSTEM;
  const starter=(typeof module==='object'&&module.exports)?require('./shino80-cpm-starter-files.js'):root.SHINO_CPM_STARTER_FILES;
  const api=factory(block,cbios,cpm22,filesystem,starter);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_SYSTEM_DISK=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(block,cbios,cpm22,filesystem,starter){
  'use strict';
  const SYSTEM_DISK_MAGIC='S80B',SYSTEM_DISK_VERSION=2;
  const SYSTEM_HEADER_TRACK=0,SYSTEM_HEADER_SECTOR=1;
  const SYSTEM_PAYLOAD_TRACK=0,SYSTEM_PAYLOAD_SECTOR=2;
  const SYSTEM_CBIOS_TRACK=0,SYSTEM_CBIOS_SECTOR=3,SYSTEM_CBIOS_SECTORS=6;
  const SYSTEM_CPM_TRACK=0,SYSTEM_CPM_SECTOR=9,SYSTEM_CPM_SECTORS=44;
  const SYSTEM_ENTRY=0x8000;
  const lo=value=>Number(value)&0xFF,hi=value=>(Number(value)>>8)&0xFF;
  const mediaOffset=(track,sector)=>(track*block.BLOCK_SECTORS_PER_TRACK+(sector-1))*block.BLOCK_SECTOR_SIZE;

  function buildSystemPayload(cbiosImage=cbios.buildCbios()){
    const bytes=[],labels={},absFixups=[],relFixups=[];let pc=SYSTEM_ENTRY;
    const emit=(...values)=>{for(const value of values){bytes.push(Number(value)&0xFF);pc++;}};
    const label=name=>{labels[name]=pc;};
    const ref=name=>{absFixups.push({offset:bytes.length,name});emit(0,0);};
    const abs=(opcode,name)=>{emit(opcode);ref(name);};
    const word=(opcode,value)=>emit(opcode,lo(value),hi(value));
    const jr=(opcode,name)=>{relFixups.push({offset:bytes.length,name,after:pc+2});emit(opcode,0);};
    const callAddress=address=>word(0xCD,address);

    emit(0xF3);word(0x31,0xF700); // DI / private loader stack
    emit(0x16,SYSTEM_CPM_TRACK,0x1E,SYSTEM_CPM_SECTOR); // D=track, E=sector
    word(0x21,cpm22.CPM22_CCP_ORIGIN);emit(0x3E,SYSTEM_CPM_SECTORS,0x08); // HL=DMA, A'=remaining
    label('LOAD_LOOP');
    emit(0x4A,0x06,0x00);callAddress(cbios.CBIOS_ORG+10*3); // C=D / SETTRK
    emit(0x4B,0x06,0x00);callAddress(cbios.CBIOS_ORG+11*3); // C=E / SETSEC
    emit(0x44,0x4D);callAddress(cbios.CBIOS_ORG+12*3);callAddress(cbios.CBIOS_ORG+13*3); // BC=HL / SETDMA / READ
    emit(0xB7);word(0xC2,cbiosImage.labels.CBIOS_WBOOT_FAIL);
    emit(0x1C,0x7B,0xFE,block.BLOCK_SECTORS_PER_TRACK+1);jr(0x38,'COUNT'); // INC E / compare sector
    emit(0x1E,1,0x14); // sector 1 / next track
    label('COUNT');emit(0x08,0x3D);jr(0x28,'LOADED');emit(0x08);jr(0x18,'LOAD_LOOP');
    label('LOADED');
    word(0x21,0xC000);emit(0x36,0x00);word(0x11,0xC001);word(0x01,0x07CF);emit(0xED,0xB0);
    emit(0x3E,0xC3);word(0x32,0x0000);word(0x21,cbios.CBIOS_ORG+3);word(0x22,0x0001);
    emit(0xAF);word(0x32,0x0003);emit(0x3E,0xC3);word(0x32,0x0005);
    word(0x21,cpm22.CPM22_BDOS_ENTRY);word(0x22,0x0006);emit(0x0E,0x00);word(0xC3,cpm22.CPM22_CCP_ORIGIN);
    for(const fixup of absFixups){const address=labels[fixup.name];if(address===undefined)throw new Error(`Unknown loader label ${fixup.name}`);bytes[fixup.offset]=lo(address);bytes[fixup.offset+1]=hi(address);}
    for(const fixup of relFixups){const address=labels[fixup.name];if(address===undefined)throw new Error(`Unknown loader label ${fixup.name}`);const displacement=address-fixup.after;if(displacement < -128||displacement > 127)throw new RangeError(`Loader JR ${fixup.name} out of range`);bytes[fixup.offset+1]=displacement&0xFF;}
    if(bytes.length>block.BLOCK_SECTOR_SIZE)throw new RangeError(`System payload exceeds one sector: ${bytes.length}`);
    return Uint8Array.from(bytes);
  }

  function buildSystemDisk(){
    const image=block.createBlankBlockImage(),cbiosImage=cbios.buildCbios(),cpmImage=cpm22.buildCpm22(),payload=buildSystemPayload(cbiosImage);
    if(cbiosImage.bytes.length>SYSTEM_CBIOS_SECTORS*block.BLOCK_SECTOR_SIZE)throw new RangeError('CBIOS exceeds reserved system sectors');
    const header=new Uint8Array(block.BLOCK_SECTOR_SIZE);header.fill(block.BLOCK_BLANK_BYTE);
    header.set([...SYSTEM_DISK_MAGIC].map(char=>char.charCodeAt(0)),0);
    header[4]=SYSTEM_DISK_VERSION;header[5]=SYSTEM_PAYLOAD_SECTOR;header[6]=SYSTEM_CBIOS_SECTOR;header[7]=SYSTEM_CBIOS_SECTORS;
    header[8]=lo(SYSTEM_ENTRY);header[9]=hi(SYSTEM_ENTRY);header[10]=lo(cbios.CBIOS_ORG);header[11]=hi(cbios.CBIOS_ORG);
    header[12]=lo(payload.length);header[13]=hi(payload.length);header[14]=lo(cbiosImage.bytes.length);header[15]=hi(cbiosImage.bytes.length);
    header[16]=header.slice(0,16).reduce((sum,value)=>(sum+value)&0xFF,0);
    image.set(header,mediaOffset(SYSTEM_HEADER_TRACK,SYSTEM_HEADER_SECTOR));
    image.set(payload,mediaOffset(SYSTEM_PAYLOAD_TRACK,SYSTEM_PAYLOAD_SECTOR));
    image.set(cbiosImage.bytes,mediaOffset(SYSTEM_CBIOS_TRACK,SYSTEM_CBIOS_SECTOR));
    image.set(cpmImage.ccp,mediaOffset(SYSTEM_CPM_TRACK,SYSTEM_CPM_SECTOR));
    image.set(cpmImage.bdos,mediaOffset(SYSTEM_CPM_TRACK,SYSTEM_CPM_SECTOR)+cpmImage.ccp.length);
    const volume=filesystem.buildFilesystem(image,starter.buildStarterFiles());
    return {image:volume.image,header,payload,cbios:cbiosImage,cpm:cpmImage,files:volume.files,meta:Object.freeze({magic:SYSTEM_DISK_MAGIC,version:SYSTEM_DISK_VERSION,
      headerTrack:SYSTEM_HEADER_TRACK,headerSector:SYSTEM_HEADER_SECTOR,payloadTrack:SYSTEM_PAYLOAD_TRACK,payloadSector:SYSTEM_PAYLOAD_SECTOR,
      cbiosTrack:SYSTEM_CBIOS_TRACK,cbiosSector:SYSTEM_CBIOS_SECTOR,cbiosSectors:SYSTEM_CBIOS_SECTORS,
      cpmTrack:SYSTEM_CPM_TRACK,cpmSector:SYSTEM_CPM_SECTOR,cpmSectors:SYSTEM_CPM_SECTORS,entry:SYSTEM_ENTRY,fileCount:volume.files.length})};
  }

  return {SYSTEM_DISK_MAGIC,SYSTEM_DISK_VERSION,SYSTEM_HEADER_TRACK,SYSTEM_HEADER_SECTOR,SYSTEM_PAYLOAD_TRACK,SYSTEM_PAYLOAD_SECTOR,
    SYSTEM_CBIOS_TRACK,SYSTEM_CBIOS_SECTOR,SYSTEM_CBIOS_SECTORS,SYSTEM_CPM_TRACK,SYSTEM_CPM_SECTOR,SYSTEM_CPM_SECTORS,SYSTEM_ENTRY,
    mediaOffset,buildSystemPayload,buildSystemDisk};
});
