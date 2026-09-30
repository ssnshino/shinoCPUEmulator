(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_CBIOS=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const CBIOS_ORG=0xFA00;
  const CBIOS_ENTRY_SIZE=3;
  const CBIOS_DEFAULT_DMA=0x0080;
  const CBIOS_DIRBUF=0xFD00;
  const CBIOS_SYSTEM_TRACK=0;
  const CBIOS_SYSTEM_SECTOR=2;
  const CBIOS_SYSTEM_ENTRY=0x8000;
  const TEXT_VRAM_BASE=0xC000;
  const TEXT_VRAM_END=0xC7D0;
  const TEXT_COLS=80;
  const KEY_DATA_PORT=0x20;
  const KEY_STATUS_PORT=0x21;
  const BLOCK_STATUS_PORT=0x30;
  const BLOCK_COMMAND_PORT=0x31;
  const BLOCK_DRIVE_PORT=0x32;
  const BLOCK_TRACK_PORT=0x33;
  const BLOCK_SECTOR_PORT=0x34;
  const BLOCK_DATA_PORT=0x35;
  const BLOCK_ERROR_PORT=0x36;
  const BLOCK_HEAD_PORT=0x37;
  const BLOCK_MEDIA_PROFILE_PORT=0x38;
  const BEEPER_PORT=0x40;
  const CBIOS_ENTRY_NAMES=Object.freeze([
    'BOOT','WBOOT','CONST','CONIN','CONOUT','LIST','PUNCH','READER','HOME',
    'SELDSK','SETTRK','SETSEC','SETDMA','READ','WRITE','LISTST','SECTRAN'
  ]);

  const DPB=Object.freeze({
    spt:26,bsh:3,blm:7,exm:0,dsm:242,drm:63,al0:0xC0,al1:0,cks:16,off:2
  });
  const CBIOS3_ORG=0xF400;
  const CBIOS3_EXECUTABLE_END=0xFA80;
  const CBIOS3_IMAGE_END=0xFD00;
  const CBIOS3_PHYSICAL_SCRATCH=0xE800;
  const CBIOS3_DPH_A=0xFA80,CBIOS3_DPH_B=0xFA90;
  const CBIOS3_DPB_BASE=0xFAA0;
  const CBIOS3_CSV_A=0xFAF0,CBIOS3_CSV_B=0xFB30;
  const CBIOS3_ALV_A=0xFB70,CBIOS3_ALV_B=0xFB90;
  const CBIOS3_DEBLOCK_A=0xFBB0,CBIOS3_DEBLOCK_B=0xFBD0;
  const CBIOS3_RMW=0xFBF0;
  const CBIOS3_STATE=Object.freeze({
    drive:CBIOS3_RMW,track:CBIOS3_RMW+1,sector:CBIOS3_RMW+3,dma:CBIOS3_RMW+5,
    cursor:CBIOS3_RMW+7,column:CBIOS3_RMW+9,physicalSector:CBIOS3_RMW+10,
    recordPointer:CBIOS3_RMW+11,transferPages:CBIOS3_RMW+13,savedDrive:CBIOS3_RMW+14,
    systemRecords:CBIOS3_RMW+15
  });
  const DPB_PROFILES=Object.freeze([
    Object.freeze({spt:26,bsh:3,blm:7,exm:0,dsm:242,drm:63,al0:0xC0,al1:0,cks:16,off:2}),
    Object.freeze({spt:64,bsh:6,blm:63,exm:7,dsm:152,drm:255,al0:0x80,al1:0,cks:64,off:1}),
    Object.freeze({spt:36,bsh:5,blm:31,exm:3,dsm:176,drm:127,al0:0x80,al1:0,cks:32,off:2}),
    Object.freeze({spt:60,bsh:6,blm:63,exm:7,dsm:148,drm:255,al0:0x80,al1:0,cks:64,off:1}),
    Object.freeze({spt:72,bsh:6,blm:63,exm:7,dsm:177,drm:255,al0:0x80,al1:0,cks:64,off:1})
  ]);

  const lo=value=>Number(value)&0xFF;
  const hi=value=>(Number(value)>>8)&0xFF;

  function createAssembler(origin){
    const bytes=new Uint8Array(0x10000-origin),labels={},fixups=[];
    let pc=origin;
    const emit=(...values)=>{
      for(const value of values){
        if(pc>0xFFFF)throw new RangeError('CBIOS image crosses FFFFh');
        bytes[pc-origin]=Number(value)&0xFF;pc++;
      }
    };
    const label=name=>{if(labels[name]!==undefined)throw new Error(`Duplicate CBIOS label ${name}`);labels[name]=pc;};
    const refWord=name=>{fixups.push({offset:pc-origin,name});emit(0,0);};
    const absolute=(opcode,name)=>{emit(opcode);refWord(name);};
    const word=(opcode,value)=>emit(opcode,lo(value),hi(value));
    const dataWord=value=>emit(lo(value),hi(value));
    const resolve=()=>{
      for(const fixup of fixups){
        const address=labels[fixup.name];
        if(address===undefined)throw new Error(`Unknown CBIOS label ${fixup.name}`);
        bytes[fixup.offset]=lo(address);bytes[fixup.offset+1]=hi(address);
      }
      return {bytes:bytes.slice(0,pc-origin),labels:Object.freeze({...labels}),end:pc};
    };
    return {emit,label,refWord,absolute,word,dataWord,resolve,get pc(){return pc;}};
  }

  function buildCbios(){
    const a=createAssembler(CBIOS_ORG);
    const call=name=>a.absolute(0xCD,name);
    const jp=name=>a.absolute(0xC3,name);
    const jpZ=name=>a.absolute(0xCA,name);
    const jpNZ=name=>a.absolute(0xC2,name);
    const jpC=name=>a.absolute(0xDA,name);
    const jpNC=name=>a.absolute(0xD2,name);
    const ldAFrom=name=>a.absolute(0x3A,name);
    const ldATo=name=>a.absolute(0x32,name);
    const ldHLFrom=name=>a.absolute(0x2A,name);
    const ldHLTo=name=>a.absolute(0x22,name);
    const ldBCTo=name=>{a.emit(0xED,0x43);a.refWord(name);};

    a.label('CBIOS_JUMP_TABLE');
    for(const name of CBIOS_ENTRY_NAMES){a.label(`CBIOS_API_${name}`);jp(`CBIOS_${name}`);}

    a.label('CBIOS_BOOT');call('CBIOS_INIT');a.emit(0xAF,0xC9);
    a.label('CBIOS_WBOOT');
    call('CBIOS_INIT');
    a.word(0x01,CBIOS_SYSTEM_TRACK);call('CBIOS_SETTRK');
    a.word(0x01,CBIOS_SYSTEM_SECTOR);call('CBIOS_SETSEC');
    a.word(0x01,CBIOS_SYSTEM_ENTRY);call('CBIOS_SETDMA');
    call('CBIOS_READ');a.emit(0xB7);jpNZ('CBIOS_WBOOT_FAIL');a.word(0xC3,CBIOS_SYSTEM_ENTRY);

    a.label('CBIOS_WBOOT_FAIL');a.absolute(0x21,'CBIOS_WBOOT_ERROR_TEXT');call('CBIOS_PRINT_STRING');a.emit(0xF3);
    a.label('CBIOS_WBOOT_FAIL_HALT');a.emit(0x76);jp('CBIOS_WBOOT_FAIL_HALT');

    a.label('CBIOS_PRINT_STRING');
    a.emit(0x7E,0xB7,0xC8,0xE5,0x4F);call('CBIOS_CONOUT');a.emit(0xE1,0x23);jp('CBIOS_PRINT_STRING');
    a.label('CBIOS_WBOOT_ERROR_TEXT');a.emit(...[...'WBOOT DISK ERROR\r\n'].map(char=>char.charCodeAt(0)),0);

    a.label('CBIOS_INIT');
    a.emit(0xAF);ldATo('CBIOS_SELECTED_DRIVE');ldATo('CBIOS_SELECTED_TRACK');ldATo('CBIOS_SELECTED_TRACK_HI');
    ldATo('CBIOS_SELECTED_SECTOR_HI');ldATo('CBIOS_COLUMN');
    a.emit(0x3C);ldATo('CBIOS_SELECTED_SECTOR');
    a.word(0x21,CBIOS_DEFAULT_DMA);ldHLTo('CBIOS_DMA');
    a.word(0x21,TEXT_VRAM_BASE);ldHLTo('CBIOS_CURSOR');a.emit(0xC9);

    a.label('CBIOS_CONST');
    a.emit(0xAF,0xDB,KEY_STATUS_PORT,0xE6,0x01,0xC8,0x3E,0xFF,0xC9);

    a.label('CBIOS_CONIN');
    a.label('CBIOS_CONIN_WAIT');call('CBIOS_CONST');a.emit(0xB7);jpZ('CBIOS_CONIN_WAIT');
    a.emit(0xAF,0xDB,KEY_DATA_PORT,0xE6,0x7F,0xC9);

    a.label('CBIOS_CONOUT');
    a.emit(0x79,0xFE,0x07);jpZ('CBIOS_CONOUT_BELL');a.emit(0xFE,0x0D);jpZ('CBIOS_CONOUT_CR');a.emit(0xFE,0x0A);jpZ('CBIOS_CONOUT_LF');
    a.emit(0xFE,0x08);jpZ('CBIOS_CONOUT_BS');a.emit(0xFE,0x7F);jpZ('CBIOS_CONOUT_BS');
    ldHLFrom('CBIOS_CURSOR');a.emit(0x77,0x23);call('CBIOS_NORMALIZE_CURSOR');ldHLTo('CBIOS_CURSOR');
    ldAFrom('CBIOS_COLUMN');a.emit(0x3C,0xFE,TEXT_COLS);jpC('CBIOS_CONOUT_STORE_COLUMN');a.emit(0xAF);
    a.label('CBIOS_CONOUT_STORE_COLUMN');ldATo('CBIOS_COLUMN');a.emit(0xC9);

    a.label('CBIOS_CONOUT_BELL');a.emit(0xD3,BEEPER_PORT,0xC9);

    a.label('CBIOS_CONOUT_CR');
    ldAFrom('CBIOS_COLUMN');a.emit(0x5F,0x16,0x00);ldHLFrom('CBIOS_CURSOR');a.emit(0xB7,0xED,0x52);
    ldHLTo('CBIOS_CURSOR');a.emit(0xAF);ldATo('CBIOS_COLUMN');a.emit(0xC9);

    a.label('CBIOS_CONOUT_LF');
    ldHLFrom('CBIOS_CURSOR');a.word(0x11,TEXT_COLS);a.emit(0x19);call('CBIOS_NORMALIZE_CURSOR');ldHLTo('CBIOS_CURSOR');a.emit(0xC9);

    a.label('CBIOS_CONOUT_BS');
    ldHLFrom('CBIOS_CURSOR');a.emit(0x7C,0xFE,hi(TEXT_VRAM_BASE));jpNZ('CBIOS_CONOUT_BS_MOVE');
    a.emit(0x7D,0xB7,0xC8);
    a.label('CBIOS_CONOUT_BS_MOVE');a.emit(0x2B);ldHLTo('CBIOS_CURSOR');
    ldAFrom('CBIOS_COLUMN');a.emit(0xB7);jpNZ('CBIOS_CONOUT_BS_COLUMN');a.emit(0x3E,TEXT_COLS);
    a.label('CBIOS_CONOUT_BS_COLUMN');a.emit(0x3D);ldATo('CBIOS_COLUMN');a.emit(0xC9);

    a.label('CBIOS_NORMALIZE_CURSOR');
    a.word(0x11,TEXT_VRAM_END);a.emit(0xB7,0xED,0x52);jpC('CBIOS_CURSOR_BELOW_END');
    call('CBIOS_SCROLL');a.emit(0xC9);
    a.label('CBIOS_CURSOR_BELOW_END');a.emit(0x19,0xC9); // restore HL after comparison

    a.label('CBIOS_SCROLL');
    a.word(0x21,TEXT_VRAM_BASE+TEXT_COLS);a.word(0x11,TEXT_VRAM_BASE);a.word(0x01,(TEXT_VRAM_END-TEXT_VRAM_BASE)-TEXT_COLS);a.emit(0xED,0xB0);
    a.word(0x21,TEXT_VRAM_END-TEXT_COLS);a.emit(0xAF,0x77);a.word(0x11,TEXT_VRAM_END-TEXT_COLS+1);a.word(0x01,TEXT_COLS-1);a.emit(0xED,0xB0);
    a.word(0x21,TEXT_VRAM_END-TEXT_COLS);a.emit(0xC9);

    a.label('CBIOS_LIST');a.emit(0xC9);
    a.label('CBIOS_PUNCH');a.emit(0xC9);
    a.label('CBIOS_READER');a.emit(0x3E,0x1A,0xC9);

    a.label('CBIOS_HOME');a.emit(0x01,0x00,0x00);jp('CBIOS_SETTRK');

    a.label('CBIOS_SELDSK');
    a.emit(0x79,0xFE,0x02);jpNC('CBIOS_SELDSK_INVALID');ldATo('CBIOS_SELECTED_DRIVE');
    a.emit(0xB7);jpNZ('CBIOS_SELDSK_B');a.absolute(0x21,'CBIOS_DPH_A');a.emit(0xC9);
    a.label('CBIOS_SELDSK_B');a.absolute(0x21,'CBIOS_DPH_B');a.emit(0xC9);
    a.label('CBIOS_SELDSK_INVALID');a.word(0x21,0);a.emit(0xC9);

    a.label('CBIOS_SETTRK');ldBCTo('CBIOS_SELECTED_TRACK');a.emit(0xC9);
    a.label('CBIOS_SETSEC');ldBCTo('CBIOS_SELECTED_SECTOR');a.emit(0xC9);
    a.label('CBIOS_SETDMA');ldBCTo('CBIOS_DMA');a.emit(0xC9);

    a.label('CBIOS_READ');a.emit(0x3E,0x01);call('CBIOS_DISK_COMMAND');a.emit(0xB7,0xC0);
    ldHLFrom('CBIOS_DMA');a.emit(0x06,0x80,0x0E,BLOCK_DATA_PORT,0xED,0xB2,0xAF,0xC9); // INIR

    a.label('CBIOS_WRITE');a.emit(0x3E,0x02);call('CBIOS_DISK_COMMAND');a.emit(0xB7,0xC0);
    ldHLFrom('CBIOS_DMA');a.emit(0x06,0x80,0x0E,BLOCK_DATA_PORT,0xED,0xB3,0xAF,0xC9); // OTIR

    a.label('CBIOS_DISK_COMMAND');
    a.emit(0xF5); // preserve command
    ldAFrom('CBIOS_SELECTED_DRIVE');a.emit(0xD3,BLOCK_DRIVE_PORT);
    ldAFrom('CBIOS_SELECTED_TRACK_HI');a.emit(0xB7);jpNZ('CBIOS_DISK_COMMAND_FAIL_POP');
    ldAFrom('CBIOS_SELECTED_TRACK');a.emit(0xD3,BLOCK_TRACK_PORT);
    ldAFrom('CBIOS_SELECTED_SECTOR_HI');a.emit(0xB7);jpNZ('CBIOS_DISK_COMMAND_FAIL_POP');
    ldAFrom('CBIOS_SELECTED_SECTOR');a.emit(0xD3,BLOCK_SECTOR_PORT);
    a.emit(0xF1,0xD3,BLOCK_COMMAND_PORT,0xAF,0xDB,BLOCK_ERROR_PORT,0xB7);jpNZ('CBIOS_DISK_COMMAND_FAIL');
    a.emit(0xAF,0xDB,BLOCK_STATUS_PORT,0xE6,0x04);jpZ('CBIOS_DISK_COMMAND_FAIL');a.emit(0xAF,0xC9);
    a.label('CBIOS_DISK_COMMAND_FAIL_POP');a.emit(0xF1);
    a.label('CBIOS_DISK_COMMAND_FAIL');a.emit(0x3E,0x01,0xC9);

    a.label('CBIOS_LISTST');a.emit(0x3E,0xFF,0xC9);

    a.label('CBIOS_SECTRAN');
    a.emit(0x7A,0xB3);jpNZ('CBIOS_SECTRAN_TABLE');a.emit(0x60,0x69,0x23,0xC9); // HL=BC+1 for 1-based media
    a.label('CBIOS_SECTRAN_TABLE');a.emit(0xEB,0x09,0x6E,0x26,0x00,0x23,0xC9);

    a.label('CBIOS_DPB');
    a.dataWord(DPB.spt);a.emit(DPB.bsh,DPB.blm,DPB.exm);a.dataWord(DPB.dsm);a.dataWord(DPB.drm);
    a.emit(DPB.al0,DPB.al1);a.dataWord(DPB.cks);a.dataWord(DPB.off);

    a.label('CBIOS_DPH');a.label('CBIOS_DPH_A');
    a.dataWord(0);a.dataWord(0);a.dataWord(0);a.dataWord(0);
    a.dataWord(CBIOS_DIRBUF);a.refWord('CBIOS_DPB');a.refWord('CBIOS_CSV_A');a.refWord('CBIOS_ALV_A');
    a.label('CBIOS_DPH_B');
    a.dataWord(0);a.dataWord(0);a.dataWord(0);a.dataWord(0);
    a.dataWord(CBIOS_DIRBUF);a.refWord('CBIOS_DPB');a.refWord('CBIOS_CSV_B');a.refWord('CBIOS_ALV_B');

    a.label('CBIOS_SELECTED_DRIVE');a.emit(0);
    a.label('CBIOS_SELECTED_TRACK');a.emit(0);a.label('CBIOS_SELECTED_TRACK_HI');a.emit(0);
    a.label('CBIOS_SELECTED_SECTOR');a.emit(1);a.label('CBIOS_SELECTED_SECTOR_HI');a.emit(0);
    a.label('CBIOS_DMA');a.dataWord(CBIOS_DEFAULT_DMA);
    a.label('CBIOS_CURSOR');a.dataWord(TEXT_VRAM_BASE);
    a.label('CBIOS_COLUMN');a.emit(0);
    a.label('CBIOS_CSV');a.label('CBIOS_CSV_A');a.emit(...new Array(DPB.cks).fill(0));
    a.label('CBIOS_CSV_B');a.emit(...new Array(DPB.cks).fill(0));
    a.label('CBIOS_ALV');a.label('CBIOS_ALV_A');a.emit(...new Array(Math.floor(DPB.dsm/8)+1).fill(0));
    a.label('CBIOS_ALV_B');a.emit(...new Array(Math.floor(DPB.dsm/8)+1).fill(0));

    const assembled=a.resolve();
    return {
      bytes:assembled.bytes,
      origin:CBIOS_ORG,
      end:assembled.end,
      labels:assembled.labels,
      meta:Object.freeze({entryCount:CBIOS_ENTRY_NAMES.length,entrySize:CBIOS_ENTRY_SIZE,defaultDma:CBIOS_DEFAULT_DMA,dirbuf:CBIOS_DIRBUF,systemTrack:CBIOS_SYSTEM_TRACK,systemSector:CBIOS_SYSTEM_SECTOR,systemEntry:CBIOS_SYSTEM_ENTRY,dpb:DPB})
    };
  }

  function buildCbiosV3(){
    const a=createAssembler(CBIOS3_ORG);
    const call=name=>a.absolute(0xCD,name),jp=name=>a.absolute(0xC3,name);
    const jpZ=name=>a.absolute(0xCA,name),jpNZ=name=>a.absolute(0xC2,name);
    const jpC=name=>a.absolute(0xDA,name),jpNC=name=>a.absolute(0xD2,name);
    const ldAFrom=address=>a.word(0x3A,address),ldATo=address=>a.word(0x32,address);
    const ldHLFrom=address=>a.word(0x2A,address),ldHLTo=address=>a.word(0x22,address);
    const ldBCTo=address=>{a.emit(0xED,0x43,lo(address),hi(address));};

    a.label('CBIOS_JUMP_TABLE');
    for(const name of CBIOS_ENTRY_NAMES){a.label(`CBIOS_API_${name}`);jp(`CBIOS_${name}`);}

    a.label('CBIOS_BOOT');call('CBIOS_INIT');a.emit(0xAF,0xC9);
    a.label('CBIOS_COLD_START');
    a.emit(0xF3);a.word(0x31,0xF000);call('CBIOS_INIT');a.emit(0xAF);ldATo(CBIOS3_STATE.savedDrive);call('CBIOS_SYSTEM_LOAD');a.emit(0xB7);jpNZ('CBIOS_WBOOT_FAIL');
    a.word(0x21,TEXT_VRAM_BASE);a.emit(0xAF,0x77);a.word(0x11,TEXT_VRAM_BASE+1);a.word(0x01,TEXT_VRAM_END-TEXT_VRAM_BASE-1);a.emit(0xED,0xB0);
    a.emit(0x3E,0xC3);a.word(0x32,0x0000);a.word(0x21,CBIOS3_ORG+3);a.word(0x22,0x0001);a.emit(0xAF);a.word(0x32,0x0003);a.emit(0x3E,0xC3);a.word(0x32,0x0005);a.word(0x21,0x9C06);a.word(0x22,0x0006);
    a.absolute(0x21,'CBIOS_STARTUP_TITLE');call('CBIOS_PRINT_STRING');a.emit(0x0E,0x00);a.word(0xC3,0x9400);
    a.label('CBIOS_WBOOT');
    a.word(0x3A,0x0004);a.emit(0xE6,0x0F,0xF5); // preserve current drive across reload
    call('CBIOS_INIT');call('CBIOS_SYSTEM_LOAD');a.emit(0xB7);jpNZ('CBIOS_WBOOT_FAIL');
    a.emit(0xF1);ldATo(CBIOS3_STATE.savedDrive);a.word(0x32,0x0004);a.emit(0x4F);a.word(0xC3,0x9400);

    a.label('CBIOS_SYSTEM_LOAD');a.emit(0x0E,0x00);call('CBIOS_SELDSK');a.emit(0x7C,0xB5);jpZ('CBIOS_SYSTEM_LOAD_FAIL');
    a.word(0x01,0);call('CBIOS_SETTRK');a.word(0x01,21);call('CBIOS_SETSEC');a.word(0x01,0x9400);call('CBIOS_SETDMA');
    a.emit(0x3E,44);ldATo(CBIOS3_STATE.systemRecords);
    a.label('CBIOS_SYSTEM_LOAD_LOOP');call('CBIOS_READ');a.emit(0xB7);jpNZ('CBIOS_SYSTEM_LOAD_FAIL');
    ldHLFrom(CBIOS3_STATE.dma);a.word(0x11,128);a.emit(0x19);ldHLTo(CBIOS3_STATE.dma);
    ldHLFrom(CBIOS3_STATE.sector);a.emit(0x23);ldHLTo(CBIOS3_STATE.sector);
    ldAFrom(CBIOS3_STATE.systemRecords);a.emit(0x3D);ldATo(CBIOS3_STATE.systemRecords);jpNZ('CBIOS_SYSTEM_LOAD_LOOP');a.emit(0xAF,0xC9);
    a.label('CBIOS_SYSTEM_LOAD_FAIL');a.emit(0x3E,0x01,0xC9);

    a.label('CBIOS_WBOOT_FAIL');a.absolute(0x21,'CBIOS_WBOOT_ERROR_TEXT');call('CBIOS_PRINT_STRING');a.emit(0xF3);
    a.label('CBIOS_WBOOT_FAIL_HALT');a.emit(0x76);jp('CBIOS_WBOOT_FAIL_HALT');
    a.label('CBIOS_PRINT_STRING');a.emit(0x7E,0xB7,0xC8,0xE5,0x4F);call('CBIOS_CONOUT');a.emit(0xE1,0x23);jp('CBIOS_PRINT_STRING');
    a.label('CBIOS_WBOOT_ERROR_TEXT');a.emit(...[...'WBOOT DISK ERROR\r\n'].map(char=>char.charCodeAt(0)),0);
    a.label('CBIOS_STARTUP_TITLE');a.emit(...[...'SHINO-80 CP/M 2.2\r\n'].map(char=>char.charCodeAt(0)),0);

    a.label('CBIOS_INIT');
    a.emit(0xAF);ldATo(CBIOS3_STATE.drive);ldATo(CBIOS3_STATE.track);ldATo(CBIOS3_STATE.track+1);
    ldATo(CBIOS3_STATE.sector+1);ldATo(CBIOS3_STATE.column);a.emit(0x3C);ldATo(CBIOS3_STATE.sector);
    a.word(0x21,CBIOS_DEFAULT_DMA);ldHLTo(CBIOS3_STATE.dma);a.word(0x21,TEXT_VRAM_BASE);ldHLTo(CBIOS3_STATE.cursor);
    a.emit(0x3E,0xFF);ldATo(CBIOS3_DEBLOCK_A);ldATo(CBIOS3_DEBLOCK_B);a.emit(0xC9);

    a.label('CBIOS_CONST');a.emit(0xAF,0xDB,KEY_STATUS_PORT,0xE6,0x01,0xC8,0x3E,0xFF,0xC9);
    a.label('CBIOS_CONIN');a.label('CBIOS_CONIN_WAIT');call('CBIOS_CONST');a.emit(0xB7);jpZ('CBIOS_CONIN_WAIT');a.emit(0xAF,0xDB,KEY_DATA_PORT,0xE6,0x7F,0xC9);
    a.label('CBIOS_CONOUT');
    a.emit(0x79,0xFE,0x07);jpZ('CBIOS_CONOUT_BELL');a.emit(0xFE,0x0D);jpZ('CBIOS_CONOUT_CR');a.emit(0xFE,0x0A);jpZ('CBIOS_CONOUT_LF');
    a.emit(0xFE,0x08);jpZ('CBIOS_CONOUT_BS');a.emit(0xFE,0x7F);jpZ('CBIOS_CONOUT_BS');
    ldHLFrom(CBIOS3_STATE.cursor);a.emit(0x77,0x23);call('CBIOS_NORMALIZE_CURSOR');ldHLTo(CBIOS3_STATE.cursor);
    ldAFrom(CBIOS3_STATE.column);a.emit(0x3C,0xFE,TEXT_COLS);jpC('CBIOS_CONOUT_STORE_COLUMN');a.emit(0xAF);
    a.label('CBIOS_CONOUT_STORE_COLUMN');ldATo(CBIOS3_STATE.column);a.emit(0xC9);
    a.label('CBIOS_CONOUT_BELL');a.emit(0xD3,BEEPER_PORT,0xC9);
    a.label('CBIOS_CONOUT_CR');ldAFrom(CBIOS3_STATE.column);a.emit(0x5F,0x16,0x00);ldHLFrom(CBIOS3_STATE.cursor);a.emit(0xB7,0xED,0x52);ldHLTo(CBIOS3_STATE.cursor);a.emit(0xAF);ldATo(CBIOS3_STATE.column);a.emit(0xC9);
    a.label('CBIOS_CONOUT_LF');ldHLFrom(CBIOS3_STATE.cursor);a.word(0x11,TEXT_COLS);a.emit(0x19);call('CBIOS_NORMALIZE_CURSOR');ldHLTo(CBIOS3_STATE.cursor);a.emit(0xC9);
    a.label('CBIOS_CONOUT_BS');ldHLFrom(CBIOS3_STATE.cursor);a.emit(0x7C,0xFE,hi(TEXT_VRAM_BASE));jpNZ('CBIOS_CONOUT_BS_MOVE');a.emit(0x7D,0xB7,0xC8);
    a.label('CBIOS_CONOUT_BS_MOVE');a.emit(0x2B);ldHLTo(CBIOS3_STATE.cursor);ldAFrom(CBIOS3_STATE.column);a.emit(0xB7);jpNZ('CBIOS_CONOUT_BS_COLUMN');a.emit(0x3E,TEXT_COLS);
    a.label('CBIOS_CONOUT_BS_COLUMN');a.emit(0x3D);ldATo(CBIOS3_STATE.column);a.emit(0xC9);
    a.label('CBIOS_NORMALIZE_CURSOR');a.word(0x11,TEXT_VRAM_END);a.emit(0xB7,0xED,0x52);jpC('CBIOS_CURSOR_BELOW_END');call('CBIOS_SCROLL');a.emit(0xC9);
    a.label('CBIOS_CURSOR_BELOW_END');a.emit(0x19,0xC9);
    a.label('CBIOS_SCROLL');a.word(0x21,TEXT_VRAM_BASE+TEXT_COLS);a.word(0x11,TEXT_VRAM_BASE);a.word(0x01,(TEXT_VRAM_END-TEXT_VRAM_BASE)-TEXT_COLS);a.emit(0xED,0xB0);
    a.word(0x21,TEXT_VRAM_END-TEXT_COLS);a.emit(0xAF,0x77);a.word(0x11,TEXT_VRAM_END-TEXT_COLS+1);a.word(0x01,TEXT_COLS-1);a.emit(0xED,0xB0);a.word(0x21,TEXT_VRAM_END-TEXT_COLS);a.emit(0xC9);
    a.label('CBIOS_LIST');a.emit(0xC9);a.label('CBIOS_PUNCH');a.emit(0xC9);a.label('CBIOS_READER');a.emit(0x3E,0x1A,0xC9);
    a.label('CBIOS_HOME');a.word(0x01,0);jp('CBIOS_SETTRK');

    a.label('CBIOS_SELDSK');
    a.emit(0x79,0xFE,0x02);jpNC('CBIOS_SELDSK_INVALID');ldATo(CBIOS3_STATE.drive);a.emit(0xD3,BLOCK_DRIVE_PORT,0xAF,0xDB,BLOCK_MEDIA_PROFILE_PORT,0xFE,0x05);jpNC('CBIOS_SELDSK_INVALID');
    a.emit(0x47);ldAFrom(CBIOS3_STATE.drive);a.emit(0xB7);jpNZ('CBIOS_SELDSK_STORE_B');a.emit(0x78);ldATo(CBIOS3_DEBLOCK_A);jp('CBIOS_SELDSK_DPB');
    a.label('CBIOS_SELDSK_STORE_B');a.emit(0x78);ldATo(CBIOS3_DEBLOCK_B);
    a.label('CBIOS_SELDSK_DPB');a.emit(0x78,0x6F,0x26,0x00,0x29,0x29,0x29,0x29);a.word(0x11,CBIOS3_DPB_BASE);a.emit(0x19,0xEB);
    ldAFrom(CBIOS3_STATE.drive);a.emit(0xB7);jpNZ('CBIOS_SELDSK_DPH_B');a.word(0x21,CBIOS3_DPH_A+10);a.emit(0x73,0x23,0x72);a.word(0x21,CBIOS3_DPH_A);a.emit(0xC9);
    a.label('CBIOS_SELDSK_DPH_B');a.word(0x21,CBIOS3_DPH_B+10);a.emit(0x73,0x23,0x72);a.word(0x21,CBIOS3_DPH_B);a.emit(0xC9);
    a.label('CBIOS_SELDSK_INVALID');a.word(0x21,0);a.emit(0xC9);

    a.label('CBIOS_SETTRK');ldBCTo(CBIOS3_STATE.track);a.emit(0xC9);
    a.label('CBIOS_SETSEC');ldBCTo(CBIOS3_STATE.sector);a.emit(0xC9);
    a.label('CBIOS_SETDMA');ldBCTo(CBIOS3_STATE.dma);a.emit(0xC9);

    a.label('CBIOS_PROFILE');ldAFrom(CBIOS3_STATE.drive);a.emit(0xB7);jpNZ('CBIOS_PROFILE_B');ldAFrom(CBIOS3_DEBLOCK_A);a.emit(0xC9);
    a.label('CBIOS_PROFILE_B');ldAFrom(CBIOS3_DEBLOCK_B);a.emit(0xC9);

    a.label('CBIOS_PREPARE');
    ldAFrom(CBIOS3_STATE.drive);a.emit(0xD3,BLOCK_DRIVE_PORT);call('CBIOS_PROFILE');a.emit(0xFE,0x05);jpNC('CBIOS_IO_FAIL');a.emit(0x47);
    ldAFrom(CBIOS3_STATE.track+1);a.emit(0xB7);jpNZ('CBIOS_IO_FAIL');ldAFrom(CBIOS3_STATE.track);a.emit(0x4F);a.emit(0x78,0xB7);jpZ('CBIOS_PREPARE_CLASSIC');
    a.emit(0x79,0xE6,0x01,0xD3,BLOCK_HEAD_PORT,0x79,0xCB,0x3F,0xD3,BLOCK_TRACK_PORT);jp('CBIOS_PREPARE_SECTOR');
    a.label('CBIOS_PREPARE_CLASSIC');a.emit(0xAF,0xD3,BLOCK_HEAD_PORT,0x79,0xD3,BLOCK_TRACK_PORT);
    a.label('CBIOS_PREPARE_SECTOR');ldAFrom(CBIOS3_STATE.sector+1);a.emit(0xB7);jpNZ('CBIOS_IO_FAIL');ldAFrom(CBIOS3_STATE.sector);a.emit(0x3D,0x4F);a.word(0x21,CBIOS3_PHYSICAL_SCRATCH);ldHLTo(CBIOS3_STATE.recordPointer);
    a.emit(0x78,0xB7);jpZ('CBIOS_PREPARE_RATIO1');a.emit(0xFE,0x01);jpZ('CBIOS_PREPARE_RATIO8');
    a.label('CBIOS_PREPARE_RATIO4');a.emit(0x79,0xE6,0x03);call('CBIOS_RECORD_POINTER');a.emit(0x79,0x0F,0x0F,0xE6,0x3F,0x3C,0xD3,BLOCK_SECTOR_PORT,0x3E,0x02);ldATo(CBIOS3_STATE.transferPages);a.emit(0xAF,0xC9);
    a.label('CBIOS_PREPARE_RATIO8');a.emit(0x79,0xE6,0x07);call('CBIOS_RECORD_POINTER');a.emit(0x79,0x0F,0x0F,0x0F,0xE6,0x1F,0x3C,0xD3,BLOCK_SECTOR_PORT,0x3E,0x04);ldATo(CBIOS3_STATE.transferPages);a.emit(0xAF,0xC9);
    a.label('CBIOS_PREPARE_RATIO1');a.emit(0x79,0x3C,0xD3,BLOCK_SECTOR_PORT,0xAF);ldATo(CBIOS3_STATE.transferPages);a.emit(0xAF,0xC9);
    a.label('CBIOS_RECORD_POINTER');a.emit(0x6F,0x26,0x00,0x29,0x29,0x29,0x29,0x29,0x29,0x29);a.word(0x11,CBIOS3_PHYSICAL_SCRATCH);a.emit(0x19);ldHLTo(CBIOS3_STATE.recordPointer);a.emit(0xC9);

    a.label('CBIOS_ISSUE');a.emit(0xD3,BLOCK_COMMAND_PORT,0xAF,0xDB,BLOCK_ERROR_PORT,0xB7);jpNZ('CBIOS_IO_FAIL');a.emit(0xAF,0xDB,BLOCK_STATUS_PORT,0xE6,0x04);jpZ('CBIOS_IO_FAIL');a.emit(0xAF,0xC9);
    a.label('CBIOS_READ_PHYSICAL');call('CBIOS_PREPARE');a.emit(0xB7,0xC0,0x3E,0x01);call('CBIOS_ISSUE');a.emit(0xB7,0xC0);a.word(0x21,CBIOS3_PHYSICAL_SCRATCH);ldAFrom(CBIOS3_STATE.transferPages);a.emit(0xB7);jpZ('CBIOS_READ_128');
    a.emit(0x57,0x0E,BLOCK_DATA_PORT);a.label('CBIOS_READ_PAGE');a.emit(0x06,0x00,0xED,0xB2,0x15);jpNZ('CBIOS_READ_PAGE');a.emit(0xAF,0xC9);
    a.label('CBIOS_READ_128');a.emit(0x06,0x80,0x0E,BLOCK_DATA_PORT,0xED,0xB2,0xAF,0xC9);
    a.label('CBIOS_WRITE_PHYSICAL');a.emit(0x3E,0x02);call('CBIOS_ISSUE');a.emit(0xB7,0xC0);a.word(0x21,CBIOS3_PHYSICAL_SCRATCH);ldAFrom(CBIOS3_STATE.transferPages);a.emit(0xB7);jpZ('CBIOS_WRITE_128');
    a.emit(0x57,0x0E,BLOCK_DATA_PORT);a.label('CBIOS_WRITE_PAGE');a.emit(0x06,0x00,0xED,0xB3,0x15);jpNZ('CBIOS_WRITE_PAGE');a.emit(0xAF,0xC9);
    a.label('CBIOS_WRITE_128');a.emit(0x06,0x80,0x0E,BLOCK_DATA_PORT,0xED,0xB3,0xAF,0xC9);
    a.label('CBIOS_IO_FAIL');a.emit(0x3E,0x01,0xC9);

    a.label('CBIOS_READ');call('CBIOS_READ_PHYSICAL');a.emit(0xB7,0xC0);ldHLFrom(CBIOS3_STATE.recordPointer);a.emit(0xEB);ldHLFrom(CBIOS3_STATE.dma);a.emit(0x01,0x80,0x00,0xEB,0xED,0xB0,0xAF,0xC9);
    a.label('CBIOS_WRITE');call('CBIOS_READ_PHYSICAL');a.emit(0xB7,0xC0);ldHLFrom(CBIOS3_STATE.recordPointer);a.emit(0xEB);ldHLFrom(CBIOS3_STATE.dma);a.emit(0x01,0x80,0x00,0xED,0xB0);jp('CBIOS_WRITE_PHYSICAL');
    a.label('CBIOS_LISTST');a.emit(0x3E,0xFF,0xC9);
    a.label('CBIOS_SECTRAN');a.emit(0x7A,0xB3);jpNZ('CBIOS_SECTRAN_TABLE');a.emit(0x60,0x69,0x23,0xC9);a.label('CBIOS_SECTRAN_TABLE');a.emit(0xEB,0x09,0x6E,0x26,0x00,0x23,0xC9);

    const assembled=a.resolve();
    if(assembled.end>CBIOS3_EXECUTABLE_END)throw new RangeError(`CBIOS v3 executable crosses FA7Fh: ${assembled.end.toString(16)}`);
    const bytes=new Uint8Array(CBIOS3_IMAGE_END-CBIOS3_ORG);bytes.set(assembled.bytes);
    const labels={...assembled.labels,
      CBIOS_DPH_A:CBIOS3_DPH_A,CBIOS_DPH_B:CBIOS3_DPH_B,CBIOS_DPB:CBIOS3_DPB_BASE,
      CBIOS_CSV_A:CBIOS3_CSV_A,CBIOS_CSV_B:CBIOS3_CSV_B,CBIOS_ALV_A:CBIOS3_ALV_A,CBIOS_ALV_B:CBIOS3_ALV_B,
      CBIOS_SELECTED_DRIVE:CBIOS3_STATE.drive,CBIOS_SELECTED_TRACK:CBIOS3_STATE.track,CBIOS_SELECTED_TRACK_HI:CBIOS3_STATE.track+1,
      CBIOS_SELECTED_SECTOR:CBIOS3_STATE.sector,CBIOS_SELECTED_SECTOR_HI:CBIOS3_STATE.sector+1,CBIOS_DMA:CBIOS3_STATE.dma,
      CBIOS_CURSOR:CBIOS3_STATE.cursor,CBIOS_COLUMN:CBIOS3_STATE.column
    };
    const writeWord=(address,value)=>{const offset=address-CBIOS3_ORG;bytes[offset]=lo(value);bytes[offset+1]=hi(value);};
    const writeDph=(address,dpbAddress,csv,alv)=>{writeWord(address+8,CBIOS_DIRBUF);writeWord(address+10,dpbAddress);writeWord(address+12,csv);writeWord(address+14,alv);};
    writeDph(CBIOS3_DPH_A,CBIOS3_DPB_BASE,CBIOS3_CSV_A,CBIOS3_ALV_A);writeDph(CBIOS3_DPH_B,CBIOS3_DPB_BASE,CBIOS3_CSV_B,CBIOS3_ALV_B);
    DPB_PROFILES.forEach((dpb,index)=>{
      const offset=CBIOS3_DPB_BASE-CBIOS3_ORG+index*16;
      bytes.set([lo(dpb.spt),hi(dpb.spt),dpb.bsh,dpb.blm,dpb.exm,lo(dpb.dsm),hi(dpb.dsm),lo(dpb.drm),hi(dpb.drm),dpb.al0,dpb.al1,lo(dpb.cks),hi(dpb.cks),lo(dpb.off),hi(dpb.off),0],offset);
    });
    bytes[CBIOS3_DEBLOCK_A-CBIOS3_ORG]=0xFF;bytes[CBIOS3_DEBLOCK_B-CBIOS3_ORG]=0xFF;
    bytes[CBIOS3_STATE.sector-CBIOS3_ORG]=1;writeWord(CBIOS3_STATE.dma,CBIOS_DEFAULT_DMA);writeWord(CBIOS3_STATE.cursor,TEXT_VRAM_BASE);
    return {bytes,origin:CBIOS3_ORG,end:CBIOS3_IMAGE_END,executableEnd:assembled.end,labels:Object.freeze(labels),meta:Object.freeze({entryCount:CBIOS_ENTRY_NAMES.length,entrySize:CBIOS_ENTRY_SIZE,defaultDma:CBIOS_DEFAULT_DMA,dirbuf:CBIOS_DIRBUF,dpbs:DPB_PROFILES,physicalScratch:CBIOS3_PHYSICAL_SCRATCH})};
  }

  return {
    CBIOS_ORG,CBIOS3_ORG,CBIOS3_EXECUTABLE_END,CBIOS3_IMAGE_END,CBIOS3_PHYSICAL_SCRATCH,CBIOS3_DPH_A,CBIOS3_DPH_B,CBIOS3_DPB_BASE,CBIOS3_CSV_A,CBIOS3_CSV_B,CBIOS3_ALV_A,CBIOS3_ALV_B,CBIOS3_DEBLOCK_A,CBIOS3_DEBLOCK_B,CBIOS3_RMW,CBIOS3_STATE,
    CBIOS_ENTRY_SIZE,CBIOS_ENTRY_NAMES,CBIOS_DEFAULT_DMA,CBIOS_DIRBUF,
    CBIOS_SYSTEM_TRACK,CBIOS_SYSTEM_SECTOR,CBIOS_SYSTEM_ENTRY,DPB,
    DPB_PROFILES,
    TEXT_VRAM_BASE,TEXT_VRAM_END,TEXT_COLS,
    KEY_DATA_PORT,KEY_STATUS_PORT,
    BLOCK_STATUS_PORT,BLOCK_COMMAND_PORT,BLOCK_DRIVE_PORT,BLOCK_TRACK_PORT,BLOCK_SECTOR_PORT,BLOCK_DATA_PORT,BLOCK_ERROR_PORT,BLOCK_HEAD_PORT,BLOCK_MEDIA_PROFILE_PORT,BEEPER_PORT,
    buildCbios,buildCbiosV3
  };
});
