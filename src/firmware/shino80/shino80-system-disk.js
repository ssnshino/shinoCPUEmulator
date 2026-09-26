(function(root,factory){
  const block=(typeof module==='object'&&module.exports)?require('../../devices/shino80/shino80-block-device.js'):root.SHINO_BLOCK_DEVICE;
  const cbios=(typeof module==='object'&&module.exports)?require('./shino80-cbios.js'):root.SHINO_CBIOS;
  const api=factory(block,cbios);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_SYSTEM_DISK=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(block,cbios){
  'use strict';

  const SYSTEM_DISK_MAGIC='S80B';
  const SYSTEM_DISK_VERSION=1;
  const SYSTEM_HEADER_SECTOR=1;
  const SYSTEM_PAYLOAD_SECTOR=2;
  const SYSTEM_CBIOS_SECTOR=3;
  const SYSTEM_CBIOS_SECTORS=5;
  const SYSTEM_ENTRY=0x8000;
  const SYSTEM_SIGNATURE=0xE260;
  const SYSTEM_MESSAGE='SHINO-80 SYSTEM DISK\r\nCBIOS + BLOCK I/O OK\r\n';

  const lo=value=>Number(value)&0xFF;
  const hi=value=>(Number(value)>>8)&0xFF;

  function buildSystemPayload(){
    const code=[
      0x31,0x00,0xF7,             // LD SP,F700h
      0x21,0x00,0xC0,0x36,0x00,  // LD HL,C000h / LD (HL),0
      0x11,0x01,0xC0,             // LD DE,C001h
      0x01,0xCF,0x07,0xED,0xB0,  // LD BC,1999 / LDIR
      0xCD,lo(cbios.CBIOS_ORG),hi(cbios.CBIOS_ORG), // CALL CBIOS BOOT
      0x21                         // LD HL,message (operand appended below)
    ];
    const messagePointer=code.length;
    code.push(
      0x00,0x00,
      0x7E,0xB7,0x28,0x09,        // loop: LD A,(HL) / OR A / JR Z,done
      0xE5,0x4F,0xCD,lo(cbios.CBIOS_ORG+4*3),hi(cbios.CBIOS_ORG+4*3),0xE1, // preserve HL / C=A / CONOUT
      0x23,0x18,0xF3,             // INC HL / JR loop
      0x21,0x44,0x53,0x22,lo(SYSTEM_SIGNATURE),hi(SYSTEM_SIGNATURE),
      0x21,0x4B,0x21,0x22,lo(SYSTEM_SIGNATURE+2),hi(SYSTEM_SIGNATURE+2),
      0x76                        // HALT
    );
    const messageAddress=SYSTEM_ENTRY+code.length;
    code[messagePointer]=lo(messageAddress);code[messagePointer+1]=hi(messageAddress);
    return Uint8Array.from([...code,...[...SYSTEM_MESSAGE].map(char=>char.charCodeAt(0)),0]);
  }

  function buildSystemDisk(){
    const image=block.createBlankBlockImage(),payload=buildSystemPayload(),cbiosImage=cbios.buildCbios();
    if(payload.length>block.BLOCK_SECTOR_SIZE)throw new RangeError('System payload must fit one sector');
    if(cbiosImage.bytes.length>SYSTEM_CBIOS_SECTORS*block.BLOCK_SECTOR_SIZE)throw new RangeError('CBIOS exceeds reserved system sectors');
    const header=new Uint8Array(block.BLOCK_SECTOR_SIZE);header.fill(block.BLOCK_BLANK_BYTE);
    header.set([...SYSTEM_DISK_MAGIC].map(char=>char.charCodeAt(0)),0);
    header[4]=SYSTEM_DISK_VERSION;
    header[5]=SYSTEM_PAYLOAD_SECTOR;
    header[6]=SYSTEM_CBIOS_SECTOR;
    header[7]=SYSTEM_CBIOS_SECTORS;
    header[8]=lo(SYSTEM_ENTRY);header[9]=hi(SYSTEM_ENTRY);
    header[10]=lo(cbios.CBIOS_ORG);header[11]=hi(cbios.CBIOS_ORG);
    header[12]=lo(payload.length);header[13]=hi(payload.length);
    header[14]=lo(cbiosImage.bytes.length);header[15]=hi(cbiosImage.bytes.length);
    header[16]=header.slice(0,16).reduce((sum,value)=>(sum+value)&0xFF,0);
    image.set(header,(SYSTEM_HEADER_SECTOR-1)*block.BLOCK_SECTOR_SIZE);
    image.set(payload,(SYSTEM_PAYLOAD_SECTOR-1)*block.BLOCK_SECTOR_SIZE);
    image.set(cbiosImage.bytes,(SYSTEM_CBIOS_SECTOR-1)*block.BLOCK_SECTOR_SIZE);
    return {
      image,header,payload,cbios:cbiosImage,
      meta:Object.freeze({
        magic:SYSTEM_DISK_MAGIC,version:SYSTEM_DISK_VERSION,
        headerSector:SYSTEM_HEADER_SECTOR,payloadSector:SYSTEM_PAYLOAD_SECTOR,
        cbiosSector:SYSTEM_CBIOS_SECTOR,cbiosSectors:SYSTEM_CBIOS_SECTORS,
        entry:SYSTEM_ENTRY,signature:SYSTEM_SIGNATURE,message:SYSTEM_MESSAGE
      })
    };
  }

  return {
    SYSTEM_DISK_MAGIC,SYSTEM_DISK_VERSION,SYSTEM_HEADER_SECTOR,SYSTEM_PAYLOAD_SECTOR,
    SYSTEM_CBIOS_SECTOR,SYSTEM_CBIOS_SECTORS,SYSTEM_ENTRY,SYSTEM_SIGNATURE,SYSTEM_MESSAGE,
    buildSystemPayload,buildSystemDisk
  };
});
