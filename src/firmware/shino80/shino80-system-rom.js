(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_SYSTEM_ROM=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const ROM_SIZE=0x2000;
  const TEXT_VRAM_BASE=0xC000;
  const TEXT_COLS=80;
  const TEXT_ROWS=25;
  const TEXT_VRAM_BYTES=TEXT_COLS*TEXT_ROWS;
  const TEXT_VRAM_END=TEXT_VRAM_BASE+TEXT_VRAM_BYTES;
  const VRAM_PAGES=8;
  const BIOS_JUMP_TABLE=0x0100;
  const IPL_ENTRY=0x0200;
  const BIOS_WORK_CURSOR=0xE000;
  const BIOS_WORK_COLUMN=0xE002;
  const KEY_DATA_PORT=0x20;
  const KEY_STATUS_PORT=0x21;

  const lo=v=>v&0xFF,hi=v=>(v>>8)&0xFF;

  function createAssembler(){
    const bytes=new Uint8Array(ROM_SIZE),written=new Uint8Array(ROM_SIZE);
    const labels=Object.create(null),absoluteFixups=[],relativeFixups=[];
    bytes.fill(0xFF);
    let pc=0;

    const org=address=>{
      const next=Number(address);
      if(!Number.isInteger(next)||next<0||next>=ROM_SIZE)throw new RangeError(`ROM org outside image: ${address}`);
      pc=next;
    };
    const emit=(...values)=>{
      for(const value of values){
        if(pc>=ROM_SIZE)throw new RangeError('SYSTEM ROM image overflow');
        if(written[pc])throw new Error(`SYSTEM ROM overlap at ${pc.toString(16).padStart(4,'0')}h`);
        bytes[pc]=Number(value)&0xFF;written[pc]=1;pc++;
      }
    };
    const label=name=>{
      if(Object.hasOwn(labels,name))throw new Error(`Duplicate ROM label ${name}`);
      labels[name]=pc;
    };
    const absolute=(opcode,target)=>{
      emit(opcode,0x00,0x00);
      absoluteFixups.push({operand:pc-2,target});
    };
    const relative=(opcode,target)=>{
      emit(opcode,0x00);
      relativeFixups.push({operand:pc-1,after:pc,target});
    };
    const ldHLLabel=target=>absolute(0x21,target);
    const resolve=()=>{
      for(const fixup of absoluteFixups){
        if(!Object.hasOwn(labels,fixup.target))throw new Error(`Unknown ROM label ${fixup.target}`);
        const address=labels[fixup.target];
        bytes[fixup.operand]=lo(address);bytes[fixup.operand+1]=hi(address);
      }
      for(const fixup of relativeFixups){
        if(!Object.hasOwn(labels,fixup.target))throw new Error(`Unknown ROM label ${fixup.target}`);
        const offset=labels[fixup.target]-fixup.after;
        if(offset<-128||offset>127)throw new RangeError(`Relative ROM branch out of range: ${fixup.target}`);
        bytes[fixup.operand]=offset&0xFF;
      }
      return {bytes,labels:Object.freeze({...labels})};
    };
    return {org,emit,label,absolute,relative,ldHLLabel,resolve};
  }

  function buildSystemRom(){
    const a=createAssembler();
    const word=(opcode,address)=>a.emit(opcode,lo(address),hi(address));
    const jp=target=>a.absolute(0xC3,target);
    const call=target=>a.absolute(0xCD,target);
    const jr=(opcode,target)=>a.relative(opcode,target);

    // Hardware and RST vectors. Reserved vectors return through one explicit
    // unimplemented stub rather than falling through into adjacent vectors.
    a.org(0x0000);a.label('RESET');jp('IPL_ENTRY');
    a.org(0x0008);a.label('RST_08_PUTCHAR');jp('BIOS_PUTCHAR');
    a.org(0x0010);a.label('RST_10_GETCHAR');jp('BIOS_GETCHAR');
    for(const [address,name] of [
      [0x0018,'RST_18_DISK_READ_RESERVED'],
      [0x0020,'RST_20_DISK_WRITE_RESERVED'],
      [0x0028,'RST_28_SERIAL_RESERVED'],
      [0x0030,'RST_30_PRINTER_RESERVED'],
      [0x0038,'IM1_RESERVED'],
      [0x0066,'NMI_RESERVED']
    ]){
      a.org(address);a.label(name);jp('BIOS_UNIMPLEMENTED');
    }

    // Stable v0.1 BIOS jump table for ordinary CALL users.
    a.org(BIOS_JUMP_TABLE);
    a.label('BIOS_API_PUTCHAR');jp('BIOS_PUTCHAR');
    a.label('BIOS_API_NEWLINE');jp('BIOS_NEWLINE');
    a.label('BIOS_API_CLS');jp('BIOS_CLS');
    a.label('BIOS_API_PRINT_STRING');jp('BIOS_PRINT_STRING');
    a.label('BIOS_API_GETCHAR');jp('BIOS_GETCHAR');
    a.label('BIOS_API_GETLINE');jp('BIOS_GETLINE');
    a.label('BIOS_API_PRINT_HEX8');jp('BIOS_PRINT_HEX8');
    a.label('BIOS_API_PRINT_HEX16');jp('BIOS_PRINT_HEX16');

    a.org(0x0400);
    a.label('BIOS_UNIMPLEMENTED');
    a.emit(0xC9); // RET

    // PUTCHAR preserves AF/BC/HL. CR and LF share its internal cursor paths.
    a.label('BIOS_PUTCHAR');
    a.emit(0xF5,0xC5,0xE5);                 // PUSH AF / BC / HL
    a.emit(0xFE,0x08);a.absolute(0xCA,'BIOS_BACKSPACE');
    a.emit(0xFE,0x0D);jr(0x28,'BIOS_PUTCHAR_CR');
    a.emit(0xFE,0x0A);jr(0x28,'BIOS_PUTCHAR_LF');
    word(0x2A,BIOS_WORK_CURSOR);            // LD HL,(cursor)
    a.emit(0x77,0x23);                      // LD (HL),A / INC HL
    word(0x22,BIOS_WORK_CURSOR);            // LD (cursor),HL
    word(0x3A,BIOS_WORK_COLUMN);            // LD A,(column)
    a.emit(0x3C,0xFE,TEXT_COLS);            // INC A / CP 80
    jr(0x20,'BIOS_PUTCHAR_STORE_COLUMN');
    a.emit(0xAF);                           // XOR A
    word(0x32,BIOS_WORK_COLUMN);            // LD (column),A
    jr(0x18,'BIOS_CURSOR_NORMALIZE');

    a.label('BIOS_PUTCHAR_STORE_COLUMN');
    word(0x32,BIOS_WORK_COLUMN);
    jr(0x18,'BIOS_PUTCHAR_DONE');

    a.label('BIOS_PUTCHAR_CR');
    word(0x3A,BIOS_WORK_COLUMN);
    a.emit(0xB7);                           // OR A
    jr(0x28,'BIOS_PUTCHAR_DONE');
    a.emit(0x47);                           // LD B,A
    word(0x2A,BIOS_WORK_CURSOR);
    a.label('BIOS_CR_LOOP');
    a.emit(0x2B);                           // DEC HL
    jr(0x10,'BIOS_CR_LOOP');                // DJNZ
    word(0x22,BIOS_WORK_CURSOR);
    a.emit(0xAF);
    word(0x32,BIOS_WORK_COLUMN);
    jr(0x18,'BIOS_PUTCHAR_DONE');

    a.label('BIOS_NEWLINE');
    a.emit(0xF5,0xC5,0xE5);                 // PUSH AF / BC / HL
    a.label('BIOS_PUTCHAR_LF');
    word(0x3A,BIOS_WORK_COLUMN);
    a.emit(0x47,0x3E,TEXT_COLS,0x90,0x47);  // B=column; A=80-column; B=A
    word(0x2A,BIOS_WORK_CURSOR);
    a.label('BIOS_LF_LOOP');
    a.emit(0x23);                           // INC HL
    jr(0x10,'BIOS_LF_LOOP');                // DJNZ
    word(0x22,BIOS_WORK_CURSOR);
    a.emit(0xAF);
    word(0x32,BIOS_WORK_COLUMN);

    a.label('BIOS_CURSOR_NORMALIZE');
    a.emit(0x7C,0xFE,hi(TEXT_VRAM_END));     // LD A,H / CP C7h
    jr(0x20,'BIOS_PUTCHAR_DONE');
    a.emit(0x7D,0xFE,lo(TEXT_VRAM_END));     // LD A,L / CP D0h
    jr(0x20,'BIOS_PUTCHAR_DONE');
    call('BIOS_SCROLL');

    a.label('BIOS_PUTCHAR_DONE');
    a.emit(0xE1,0xC1,0xF1,0xC9);            // POP HL / BC / AF / RET

    a.label('BIOS_CLS');
    a.emit(0xF5,0xC5,0xE5,0xAF);            // preserve; A=0
    word(0x21,TEXT_VRAM_BASE);
    a.emit(0x06,VRAM_PAGES);                // LD B,8
    a.label('BIOS_CLS_LOOP');
    a.emit(0x77,0x2C);                      // LD (HL),A / INC L
    jr(0x20,'BIOS_CLS_LOOP');
    a.emit(0x24);                           // INC H
    jr(0x10,'BIOS_CLS_LOOP');
    word(0x21,TEXT_VRAM_BASE);
    word(0x22,BIOS_WORK_CURSOR);
    a.emit(0xAF);
    word(0x32,BIOS_WORK_COLUMN);
    a.emit(0xE1,0xC1,0xF1,0xC9);

    a.label('BIOS_PRINT_STRING');
    a.label('BIOS_PRINT_STRING_LOOP');
    a.emit(0x7E,0xB7,0xC8,0xCF,0x23);       // LD A,(HL); OR A; RET Z; RST 08; INC HL
    jr(0x18,'BIOS_PRINT_STRING_LOOP');

    // GETCHAR returns one byte in A. Keyboard ports use low-byte decode, while
    // the Bus trace retains the full Z80 I/O address driven by A:n.
    a.org(0x0500);
    a.label('BIOS_GETCHAR');
    a.label('BIOS_GETCHAR_WAIT');
    a.emit(0xAF,0xDB,KEY_STATUS_PORT);        // XOR A / IN A,(KEY_STATUS)
    a.emit(0xE6,0x01);                       // AND RX_READY
    jr(0x28,'BIOS_GETCHAR_WAIT');
    a.emit(0xAF,0xDB,KEY_DATA_PORT,0xC9);    // XOR A / IN A,(KEY_DATA) / RET

    // IPL retains the page diagnostic, then uses BIOS to clear and print.
    a.org(IPL_ENTRY);a.label('IPL_ENTRY');
    a.emit(0xF3);                           // DI
    word(0x31,0xF000);                      // LD SP,F000h
    a.emit(0x3E,'A'.charCodeAt(0));
    word(0x21,TEXT_VRAM_BASE);
    a.emit(0x06,VRAM_PAGES);
    a.label('VRAM_TEST_LOOP');
    a.emit(0x77,0x2C);
    jr(0x20,'VRAM_TEST_LOOP');
    a.emit(0x24,0x3C);
    jr(0x10,'VRAM_TEST_LOOP');
    a.label('VRAM_TEST_DONE');

    a.emit(0x06,0x00);
    a.label('VRAM_TEST_HOLD_LOOP');
    a.emit(0x10,0xFE);                      // DJNZ self, 256 iterations
    a.label('VRAM_TEST_HOLD_DONE');

    call('BIOS_API_CLS');
    a.ldHLLabel('BOOT_TEXT');
    call('BIOS_API_PRINT_STRING');

    // Stable Monitor entry, with line parser outside the IPL region.
    a.label('MONITOR_LOOP');
    jp('MONITOR_READ');

    a.label('BOOT_TEXT');
    a.emit(...[...'SHINO-80 IPL\r\nVIDEO OK\r\nMON\r\n*'].map(ch=>ch.charCodeAt(0)),0x00);
    a.label('MONITOR_HELP_TEXT');
    a.emit(...[...'H HELP  C CLEAR  D xxxx DUMP 64 BYTES\r\n'].map(ch=>ch.charCodeAt(0)),0x00);
    a.label('MONITOR_UNKNOWN_TEXT');
    a.emit(...[...'? USE H / C / D xxxx\r\n'].map(ch=>ch.charCodeAt(0)),0x00);
    a.label('MONITOR_CLEAR_TEXT');
    a.emit(...[...'MON\r\n'].map(ch=>ch.charCodeAt(0)),0x00);

    a.org(0x0520);
    // Called with PUTCHAR's saved AF/BC/HL on the stack.
    a.label('BIOS_BACKSPACE');
    word(0x2A,BIOS_WORK_CURSOR);
    a.emit(0x7C,0xFE,0xC0);jr(0x20,'BIOS_BS_MOVE');
    a.emit(0x7D,0xB7);a.absolute(0xCA,'BIOS_PUTCHAR_DONE');
    a.label('BIOS_BS_MOVE');
    a.emit(0x2B,0x36,0x00);word(0x22,BIOS_WORK_CURSOR);
    word(0x3A,BIOS_WORK_COLUMN);a.emit(0xB7);jr(0x20,'BIOS_BS_COLUMN');
    a.emit(0x3E,80);
    a.label('BIOS_BS_COLUMN');a.emit(0x3D);word(0x32,BIOS_WORK_COLUMN);jp('BIOS_PUTCHAR_DONE');

    a.label('BIOS_SCROLL');
    a.emit(0xD5); // preserve DE; caller already saves AF/BC/HL
    word(0x21,0xC050);word(0x11,0xC000);word(0x01,1920);
    a.label('BIOS_SCROLL_COPY');
    a.emit(0x7E,0x12,0x23,0x13,0x0B,0x78,0xB1);jr(0x20,'BIOS_SCROLL_COPY');
    word(0x21,0xC780);a.emit(0x06,80,0xAF);
    a.label('BIOS_SCROLL_CLEAR');a.emit(0x77,0x23);jr(0x10,'BIOS_SCROLL_CLEAR');
    word(0x21,0xC780);word(0x22,BIOS_WORK_CURSOR);a.emit(0xD1,0xC9);

    a.org(0x0600);
    // HL=buffer, B=capacity (excluding terminator). A=length on return.
    a.label('BIOS_GETLINE');a.emit(0xC5,0xD5,0xE5,0x0E,0);
    a.label('BIOS_GETLINE_WAIT');call('BIOS_GETCHAR');
    a.emit(0xFE,13);jr(0x28,'BIOS_LINE_DONE');
    a.emit(0xFE,8);jr(0x28,'BIOS_LINE_BS');
    a.emit(0xFE,127);jr(0x28,'BIOS_LINE_BS');
    a.emit(0xFE,32);jr(0x38,'BIOS_GETLINE_WAIT');
    a.emit(0xFE,127);jr(0x30,'BIOS_GETLINE_WAIT');
    a.emit(0x57,0x79,0xB8);jr(0x30,'BIOS_GETLINE_WAIT'); // D=char; length >= capacity
    a.emit(0x7A,0x77,0x23,0x0C,0xCF);jr(0x18,'BIOS_GETLINE_WAIT');
    a.label('BIOS_LINE_BS');a.emit(0x79,0xB7);jr(0x28,'BIOS_GETLINE_WAIT');
    a.emit(0x0D,0x2B,0x3E,8,0xCF);jr(0x18,'BIOS_GETLINE_WAIT');
    a.label('BIOS_LINE_DONE');a.emit(0x36,0);call('BIOS_NEWLINE');
    a.emit(0x79,0xE1,0xD1,0xC1,0xC9);

    a.label('BIOS_PRINT_HEX8');a.emit(0xF5,0x0F,0x0F,0x0F,0x0F);
    call('BIOS_HEX_NIBBLE');a.emit(0xF1,0xF5);call('BIOS_HEX_NIBBLE');a.emit(0xF1,0xC9);
    a.label('BIOS_HEX_NIBBLE');a.emit(0xE6,15,0xFE,10);jr(0x38,'BIOS_HEX_DIGIT');
    a.emit(0xC6,7);
    a.label('BIOS_HEX_DIGIT');a.emit(0xC6,48,0xCF,0xC9);
    a.label('BIOS_PRINT_HEX16');a.emit(0xF5,0x7C);call('BIOS_PRINT_HEX8');
    a.emit(0x7D);call('BIOS_PRINT_HEX8');a.emit(0xF1,0xC9);

    a.org(0x0800);
    a.label('MONITOR_READ');word(0x21,0xE100);a.emit(0x06,63);call('BIOS_GETLINE');
    a.emit(0xB7);a.absolute(0xCA,'MONITOR_PROMPT');
    a.emit(0x4F,0x7E);call('MONITOR_UPPER');
    a.emit(0xFE,68);a.absolute(0xCA,'MONITOR_DUMP_PARSE');
    a.emit(0x57,0x79,0xFE,1);a.absolute(0xC2,'MONITOR_ERROR');
    a.emit(0x7A,0xFE,72);a.absolute(0xCA,'MONITOR_HELP');
    a.emit(0xFE,63);a.absolute(0xCA,'MONITOR_HELP');
    a.emit(0xFE,67);a.absolute(0xCA,'MONITOR_CLEAR');jp('MONITOR_ERROR');
    a.label('MONITOR_HELP');a.ldHLLabel('MONITOR_HELP_TEXT');call('BIOS_PRINT_STRING');jp('MONITOR_PROMPT');
    a.label('MONITOR_CLEAR');call('BIOS_CLS');a.ldHLLabel('MONITOR_CLEAR_TEXT');call('BIOS_PRINT_STRING');jp('MONITOR_PROMPT');
    a.label('MONITOR_ERROR');a.ldHLLabel('MONITOR_UNKNOWN_TEXT');call('BIOS_PRINT_STRING');
    a.label('MONITOR_PROMPT');a.emit(0x3E,42,0xCF);jp('MONITOR_LOOP');
    a.label('MONITOR_UPPER');a.emit(0xFE,97,0xD8,0xFE,123,0xD0,0xE6,0xDF,0xC9);

    a.label('MONITOR_DUMP_PARSE');
    a.emit(0x79,0xFE,6);a.absolute(0xC2,'MONITOR_ERROR');
    a.emit(0x23,0x7E,0xFE,32);a.absolute(0xC2,'MONITOR_ERROR');
    a.emit(0x23);word(0x11,0);a.emit(0x06,4);
    a.label('MONITOR_PARSE_HEX');a.emit(0x7E);call('MONITOR_UPPER');
    a.emit(0xFE,48);a.absolute(0xDA,'MONITOR_ERROR');
    a.emit(0xFE,58);jr(0x38,'MONITOR_DECIMAL');
    a.emit(0xFE,65);a.absolute(0xDA,'MONITOR_ERROR');
    a.emit(0xFE,71);a.absolute(0xD2,'MONITOR_ERROR');
    a.emit(0xD6,7);
    a.label('MONITOR_DECIMAL');a.emit(0xD6,48,0x4F,0xEB,0x29,0x29,0x29,0x29,0x7D,0xB1,0x6F,0xEB,0x23);
    jr(0x10,'MONITOR_PARSE_HEX');
    a.emit(0xEB,0x06,8); // HL=address, B=rows
    a.label('MONITOR_DUMP_ROW');call('BIOS_PRINT_HEX16');a.emit(0x3E,58,0xCF,0x0E,8);
    a.label('MONITOR_DUMP_BYTE');a.emit(0x3E,32,0xCF,0x7E);call('BIOS_PRINT_HEX8');a.emit(0x23,0x0D);
    jr(0x20,'MONITOR_DUMP_BYTE');call('BIOS_NEWLINE');jr(0x10,'MONITOR_DUMP_ROW');jp('MONITOR_PROMPT');

    const assembled=a.resolve();
    const testPageInstructions=(256*3)+3;
    const clearPageInstructions=(256*3)+2;
    return {
      bytes:assembled.bytes,
      labels:assembled.labels,
      meta:Object.freeze({
        romSize:ROM_SIZE,
        textVramBase:TEXT_VRAM_BASE,
        textCols:TEXT_COLS,
        textRows:TEXT_ROWS,
        textVramBytes:TEXT_VRAM_BYTES,
        vramBytes:VRAM_PAGES*256,
        biosJumpTable:BIOS_JUMP_TABLE,
        biosWorkCursor:BIOS_WORK_CURSOR,
        biosWorkColumn:BIOS_WORK_COLUMN,
        testPageInstructions,
        clearPageInstructions,
        bootTextBytes:30,
        instructionsBeforeLoop:14036
      })
    };
  }

  return {
    ROM_SIZE,
    TEXT_VRAM_BASE,TEXT_COLS,TEXT_ROWS,TEXT_VRAM_BYTES,TEXT_VRAM_END,VRAM_PAGES,
    BIOS_JUMP_TABLE,BIOS_WORK_CURSOR,BIOS_WORK_COLUMN,IPL_ENTRY,
    KEY_DATA_PORT,KEY_STATUS_PORT,
    buildSystemRom
  };
});
