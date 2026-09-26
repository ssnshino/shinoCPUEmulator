(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_CBIOS=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const CBIOS_ORG=0xFA00;
  const CBIOS_ENTRY_SIZE=3;
  const CBIOS_DEFAULT_DMA=0x0080;
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
  const CBIOS_ENTRY_NAMES=Object.freeze([
    'BOOT','WBOOT','CONST','CONIN','CONOUT','LIST','PUNCH','READER','HOME',
    'SELDSK','SETTRK','SETSEC','SETDMA','READ','WRITE','LISTST','SECTRAN'
  ]);

  const DPB=Object.freeze({
    spt:26,bsh:3,blm:7,exm:0,dsm:242,drm:63,al0:0xC0,al1:0,cks:16,off:2
  });

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
    a.emit(0x79,0xFE,0x0D);jpZ('CBIOS_CONOUT_CR');a.emit(0xFE,0x0A);jpZ('CBIOS_CONOUT_LF');
    ldHLFrom('CBIOS_CURSOR');a.emit(0x77,0x23);call('CBIOS_NORMALIZE_CURSOR');ldHLTo('CBIOS_CURSOR');
    ldAFrom('CBIOS_COLUMN');a.emit(0x3C,0xFE,TEXT_COLS);jpC('CBIOS_CONOUT_STORE_COLUMN');a.emit(0xAF);
    a.label('CBIOS_CONOUT_STORE_COLUMN');ldATo('CBIOS_COLUMN');a.emit(0xC9);

    a.label('CBIOS_CONOUT_CR');
    ldAFrom('CBIOS_COLUMN');a.emit(0x5F,0x16,0x00);ldHLFrom('CBIOS_CURSOR');a.emit(0xB7,0xED,0x52);
    ldHLTo('CBIOS_CURSOR');a.emit(0xAF);ldATo('CBIOS_COLUMN');a.emit(0xC9);

    a.label('CBIOS_CONOUT_LF');
    ldHLFrom('CBIOS_CURSOR');a.word(0x11,TEXT_COLS);a.emit(0x19);call('CBIOS_NORMALIZE_CURSOR');ldHLTo('CBIOS_CURSOR');a.emit(0xC9);

    a.label('CBIOS_NORMALIZE_CURSOR');
    a.word(0x11,TEXT_VRAM_END);a.emit(0xB7,0xED,0x52);jpC('CBIOS_CURSOR_BELOW_END');
    a.word(0x21,TEXT_VRAM_BASE);a.emit(0xC9);
    a.label('CBIOS_CURSOR_BELOW_END');a.emit(0x19,0xC9); // restore HL after comparison

    a.label('CBIOS_LIST');a.emit(0xC9);
    a.label('CBIOS_PUNCH');a.emit(0xC9);
    a.label('CBIOS_READER');a.emit(0x3E,0x1A,0xC9);

    a.label('CBIOS_HOME');a.emit(0x01,0x00,0x00);jp('CBIOS_SETTRK');

    a.label('CBIOS_SELDSK');
    a.emit(0x79,0xB7);jpNZ('CBIOS_SELDSK_INVALID');ldATo('CBIOS_SELECTED_DRIVE');
    a.absolute(0x21,'CBIOS_DPH');a.emit(0xC9);
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
    a.emit(0x7A,0xB3);jpNZ('CBIOS_SECTRAN_TABLE');a.emit(0x60,0x69,0xC9); // HL=BC
    a.label('CBIOS_SECTRAN_TABLE');a.emit(0xEB,0x09,0x6E,0x26,0x00,0xC9);

    a.label('CBIOS_DPB');
    a.dataWord(DPB.spt);a.emit(DPB.bsh,DPB.blm,DPB.exm);a.dataWord(DPB.dsm);a.dataWord(DPB.drm);
    a.emit(DPB.al0,DPB.al1);a.dataWord(DPB.cks);a.dataWord(DPB.off);

    a.label('CBIOS_DPH');
    a.dataWord(0);a.dataWord(0);a.dataWord(0);a.dataWord(0);
    a.refWord('CBIOS_DIRBUF');a.refWord('CBIOS_DPB');a.refWord('CBIOS_CSV');a.refWord('CBIOS_ALV');

    a.label('CBIOS_SELECTED_DRIVE');a.emit(0);
    a.label('CBIOS_SELECTED_TRACK');a.emit(0);a.label('CBIOS_SELECTED_TRACK_HI');a.emit(0);
    a.label('CBIOS_SELECTED_SECTOR');a.emit(1);a.label('CBIOS_SELECTED_SECTOR_HI');a.emit(0);
    a.label('CBIOS_DMA');a.dataWord(CBIOS_DEFAULT_DMA);
    a.label('CBIOS_CURSOR');a.dataWord(TEXT_VRAM_BASE);
    a.label('CBIOS_COLUMN');a.emit(0);
    a.label('CBIOS_DIRBUF');a.emit(...new Array(128).fill(0));
    a.label('CBIOS_CSV');a.emit(...new Array(DPB.cks).fill(0));
    a.label('CBIOS_ALV');a.emit(...new Array(Math.floor(DPB.dsm/8)+1).fill(0));

    const assembled=a.resolve();
    return {
      bytes:assembled.bytes,
      origin:CBIOS_ORG,
      end:assembled.end,
      labels:assembled.labels,
      meta:Object.freeze({entryCount:CBIOS_ENTRY_NAMES.length,entrySize:CBIOS_ENTRY_SIZE,defaultDma:CBIOS_DEFAULT_DMA,systemTrack:CBIOS_SYSTEM_TRACK,systemSector:CBIOS_SYSTEM_SECTOR,systemEntry:CBIOS_SYSTEM_ENTRY,dpb:DPB})
    };
  }

  return {
    CBIOS_ORG,CBIOS_ENTRY_SIZE,CBIOS_ENTRY_NAMES,CBIOS_DEFAULT_DMA,
    CBIOS_SYSTEM_TRACK,CBIOS_SYSTEM_SECTOR,CBIOS_SYSTEM_ENTRY,DPB,
    TEXT_VRAM_BASE,TEXT_VRAM_END,TEXT_COLS,
    KEY_DATA_PORT,KEY_STATUS_PORT,
    BLOCK_STATUS_PORT,BLOCK_COMMAND_PORT,BLOCK_DRIVE_PORT,BLOCK_TRACK_PORT,BLOCK_SECTOR_PORT,BLOCK_DATA_PORT,BLOCK_ERROR_PORT,
    buildCbios
  };
});
