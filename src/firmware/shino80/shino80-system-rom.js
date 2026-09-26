(function(root,factory){
  const decoder=(typeof module==='object'&&module.exports)?require('../../cpu/z80/z80-decoder.js'):root.SHINO_Z80_DECODER;
  const api=factory(decoder);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_SYSTEM_ROM=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(decoder){
  'use strict';

  const ROM_SIZE=0x4000;
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
  const MEMORY_CONTROL_PORT=0x00;
  const MEMORY_CONTROL_LOW_RAM=0x01;
  const MEMORY_CONTROL_SHADOW_WRITE=0x02;
  const RAM_HANDOFF_TRAMPOLINE=0xF800;
  const RAM_HANDOFF_DEMO_ENTRY=0x8000;
  const RAM_HANDOFF_SIGNATURE=0xE180;
  const MON_BUFFER=0xE100;
  const MON_CONTEXT=0xE140;
  const MON_RANGE_START=0xE158;
  const MON_RANGE_COUNT=0xE15A;
  const MON_RANGE_FLAGS=0xE15C;
  const DA_START=0xE160,DA_NEXT=0xE162,DA_STREAM=0xE164,DA_OPERAND=0xE166;
  const DA_LENGTH=0xE168,DA_INDEX=0xE169,DA_FAMILY=0xE16A,DA_OPCODE=0xE16B;
  const DA_DISP=0xE16C,DA_AFFECTED=0xE16D,DA_INDEXED_MEMORY=0xE16E,DA_PREFIXES=0xE16F;

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
    const dataWord=target=>{
      emit(0x00,0x00);
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
    return {org,emit,label,absolute,relative,ldHLLabel,dataWord,resolve};
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
    a.label('BIOS_API_PARSE_HEX16');jp('BIOS_PARSE_HEX16');
    a.label('BIOS_API_DISASM_ONE');jp('BIOS_DISASM_ONE');
    a.label('BIOS_API_RAM_HANDOFF');jp('BIOS_RAM_HANDOFF');

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
    a.emit(...[...'H HELP  C CLEAR  D xxxx [yyyy]  R REGS  U xxxx [yyyy]  B RAM BOOT\r\n'].map(ch=>ch.charCodeAt(0)),0x00);
    a.label('MONITOR_UNKNOWN_TEXT');
    a.emit(...[...'? USE H C D xxxx [yyyy] R U xxxx [yyyy] B\r\n'].map(ch=>ch.charCodeAt(0)),0x00);
    a.label('MONITOR_CLEAR_TEXT');
    a.emit(...[...'MON\r\n'].map(ch=>ch.charCodeAt(0)),0x00);
    a.label('MONITOR_RANGE_LIMIT_TEXT');
    a.emit(...[...'... RANGE LIMITED\r\n'].map(ch=>ch.charCodeAt(0)),0x00);
    for(const [name,text] of [
      ['MON_REG_AF','AF='],['MON_REG_BC',' BC='],['MON_REG_DE',' DE='],['MON_REG_HL',' HL='],
      ['MON_REG_AF2',"AF'= "],['MON_REG_BC2'," BC'= "],['MON_REG_DE2'," DE'= "],['MON_REG_HL2'," HL'= "],
      ['MON_REG_IX','IX='],['MON_REG_IY',' IY='],['MON_REG_SP',' SP='],['MON_REG_I',' I='],['MON_REG_R',' R=']
    ]){a.label(name);a.emit(...[...text].map(ch=>ch.charCodeAt(0)),0);}

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

    // HL points to exactly four hexadecimal characters. On success HL advances
    // by four, DE is the parsed word and carry is set. BC/A/F are clobbered.
    a.label('BIOS_PARSE_HEX16');word(0x11,0);a.emit(0x06,4);
    a.label('BIOS_PARSE_HEX16_LOOP');a.emit(0x7E);call('MONITOR_UPPER');
    a.emit(0xFE,48);jr(0x38,'BIOS_PARSE_HEX16_FAIL');
    a.emit(0xFE,58);jr(0x38,'BIOS_PARSE_HEX16_DECIMAL');
    a.emit(0xFE,65);jr(0x38,'BIOS_PARSE_HEX16_FAIL');
    a.emit(0xFE,71);jr(0x30,'BIOS_PARSE_HEX16_FAIL');a.emit(0xD6,7);
    a.label('BIOS_PARSE_HEX16_DECIMAL');a.emit(0xD6,48,0x4F,0xEB,0x29,0x29,0x29,0x29,0x7D,0xB1,0x6F,0xEB,0x23);
    jr(0x10,'BIOS_PARSE_HEX16_LOOP');a.emit(0x37,0xC9); // SCF / RET
    a.label('BIOS_PARSE_HEX16_FAIL');a.emit(0xB7,0xC9); // OR A clears carry / RET

    // Capture the machine state at the command-input boundary. This is a MON
    // diagnostic context, not yet a resumable application context.
    a.label('MONITOR_SNAPSHOT');
    word(0x22,MON_CONTEXT+6);                                // HL
    a.emit(0xED,0x43,lo(MON_CONTEXT+2),hi(MON_CONTEXT+2));   // BC
    a.emit(0xED,0x53,lo(MON_CONTEXT+4),hi(MON_CONTEXT+4));   // DE
    a.emit(0xF5,0xE1);word(0x22,MON_CONTEXT);                // AF via stack
    a.emit(0xDD,0x22,lo(MON_CONTEXT+16),hi(MON_CONTEXT+16)); // IX
    a.emit(0xFD,0x22,lo(MON_CONTEXT+18),hi(MON_CONTEXT+18)); // IY
    word(0x21,2);a.emit(0x39);word(0x22,MON_CONTEXT+20);      // caller SP before CALL
    a.emit(0x08,0xD9);                                      // EX AF,AF' / EXX
    word(0x22,MON_CONTEXT+14);
    a.emit(0xED,0x43,lo(MON_CONTEXT+10),hi(MON_CONTEXT+10));
    a.emit(0xED,0x53,lo(MON_CONTEXT+12),hi(MON_CONTEXT+12));
    a.emit(0xF5,0xE1);word(0x22,MON_CONTEXT+8);
    a.emit(0x08,0xD9);                                      // restore primary sets
    a.emit(0xED,0x57);word(0x32,MON_CONTEXT+22);             // I
    a.emit(0xED,0x5F);word(0x32,MON_CONTEXT+23);             // R
    a.emit(0xC9);

    // HL=start. Print one line and return HL=next, A=byte length. Other
    // registers/flags are scratch. Four consecutive DD/FD prefixes are handled;
    // a longer chain advances as DB one byte so malformed data always progresses.
    a.label('BIOS_DISASM_ONE');word(0x22,DA_START);a.emit(0xE5,0xDD,0xE1,0x06,0,0x0E,0); // IX=HL; B=count; C=index
    a.label('DA_PREFIX_LOOP');a.emit(0xDD,0x7E,0,0xFE,0xDD);jr(0x28,'DA_PREFIX_DD');
    a.emit(0xFE,0xFD);jr(0x28,'DA_PREFIX_FD');jr(0x18,'DA_AFTER_INDEX_PREFIX');
    a.label('DA_PREFIX_DD');a.emit(0x0E,1);jr(0x18,'DA_PREFIX_TAKE');
    a.label('DA_PREFIX_FD');a.emit(0x0E,2);
    a.label('DA_PREFIX_TAKE');a.emit(0x04,0xDD,0x23,0x78,0xFE,4);jr(0x38,'DA_PREFIX_LOOP');
    a.emit(0xDD,0x7E,0,0xFE,0xDD);a.absolute(0xCA,'DA_PREFIX_LIMIT');a.emit(0xFE,0xFD);a.absolute(0xCA,'DA_PREFIX_LIMIT');
    a.label('DA_AFTER_INDEX_PREFIX');a.emit(0x79);word(0x32,DA_INDEX);a.emit(0x78);word(0x32,DA_PREFIXES);
    a.emit(0xDD,0x7E,0,0xFE,0xCB);a.absolute(0xCA,'DA_SETUP_CB');
    a.emit(0xFE,0xED);a.absolute(0xCA,'DA_SETUP_ED');
    a.label('DA_SETUP_BASE');a.emit(0xAF);word(0x32,DA_FAMILY);a.emit(0xDD,0x7E,0);word(0x32,DA_OPCODE);
    a.emit(0x79,0xB7);jr(0x28,'DA_BASE_FLAGS_DONE');
    a.emit(0xDD,0x7E,0);a.ldHLLabel('DA_INDEX_AFFECTED_BITS');call('DA_TEST_BIT');
    a.emit(0x3E,0);jr(0x30,'DA_BASE_STORE_AFFECTED');a.emit(0x3E,1);
    a.label('DA_BASE_STORE_AFFECTED');word(0x32,DA_AFFECTED);a.emit(0xB7);jr(0x28,'DA_BASE_FLAGS_DONE');
    a.emit(0xDD,0x7E,0);a.ldHLLabel('DA_INDEX_MEMORY_BITS');call('DA_TEST_BIT');
    a.emit(0x3E,0);jr(0x30,'DA_BASE_STORE_MEMORY');a.emit(0x3E,1);
    a.label('DA_BASE_STORE_MEMORY');word(0x32,DA_INDEXED_MEMORY);a.emit(0xB7);jr(0x28,'DA_BASE_LOOKUP');a.emit(0xDD,0x7E,1);word(0x32,DA_DISP);jr(0x18,'DA_BASE_LOOKUP');
    a.label('DA_BASE_FLAGS_DONE');a.emit(0xAF);word(0x32,DA_AFFECTED);word(0x32,DA_INDEXED_MEMORY);
    a.label('DA_BASE_LOOKUP');a.emit(0xDD,0x7E,0);a.ldHLLabel('DA_BASE_POINTERS');call('DA_LOOKUP');
    a.emit(0x7E);word(0x32,DA_LENGTH);a.emit(0x23);word(0x22,DA_STREAM);
    a.emit(0xDD,0xE5,0xE1,0x23);word(0x3A,DA_INDEXED_MEMORY);a.emit(0xB7);jr(0x28,'DA_BASE_OPERAND_READY');a.emit(0x23);
    a.label('DA_BASE_OPERAND_READY');word(0x22,DA_OPERAND);word(0x3A,DA_LENGTH);a.emit(0x47);word(0x3A,DA_PREFIXES);a.emit(0x80,0x47);word(0x3A,DA_INDEXED_MEMORY);a.emit(0x80);jr(0x18,'DA_SETUP_FINISH');

    a.label('DA_SETUP_CB');word(0x3A,DA_INDEX);a.emit(0xB7);jr(0x20,'DA_SETUP_INDEX_CB');
    a.emit(0xDD,0x7E,1);word(0x32,DA_OPCODE);a.emit(0x3E,1);word(0x32,DA_FAMILY);a.emit(0x3E,2);jr(0x18,'DA_SETUP_FINISH');
    a.label('DA_SETUP_INDEX_CB');a.emit(0xDD,0x7E,1);word(0x32,DA_DISP);a.emit(0xDD,0x7E,2);word(0x32,DA_OPCODE);
    a.emit(0x3E,3);word(0x32,DA_FAMILY);word(0x3A,DA_PREFIXES);a.emit(0xC6,3);jr(0x18,'DA_SETUP_FINISH');

    a.label('DA_SETUP_ED');a.emit(0xDD,0x7E,1);word(0x32,DA_OPCODE);a.ldHLLabel('DA_ED_POINTERS');call('DA_LOOKUP');
    a.emit(0x7E,0x47);a.emit(0x23);word(0x22,DA_STREAM);a.emit(0xDD,0xE5,0xE1,0x23,0x23);word(0x22,DA_OPERAND);
    a.emit(0x3E,2);word(0x32,DA_FAMILY);a.emit(0x78);word(0x32,DA_LENGTH);word(0x3A,DA_PREFIXES);a.emit(0x80);
    a.label('DA_SETUP_FINISH');word(0x32,DA_LENGTH);a.emit(0x4F,0x06,0);word(0x2A,DA_START);a.emit(0x09);word(0x22,DA_NEXT);jr(0x18,'DA_PRINT_LINE');
    a.label('DA_PREFIX_LIMIT');a.emit(0xAF);word(0x32,DA_INDEX);word(0x32,DA_AFFECTED);word(0x32,DA_INDEXED_MEMORY);
    a.emit(0x3E,4);word(0x32,DA_FAMILY);a.emit(0x3E,1);word(0x32,DA_LENGTH);word(0x2A,DA_START);word(0x22,DA_OPERAND);a.emit(0x23);word(0x22,DA_NEXT);

    a.label('DA_PRINT_LINE');word(0x2A,DA_START);call('BIOS_PRINT_HEX16');a.emit(0x3E,58,0xCF,0x3E,32,0xCF);
    word(0x2A,DA_START);word(0x3A,DA_LENGTH);a.emit(0x47);
    a.label('DA_PRINT_BYTES');a.emit(0x7E);call('BIOS_PRINT_HEX8');a.emit(0x3E,32,0xCF,0x23);jr(0x10,'DA_PRINT_BYTES');
    a.emit(0x3E,32,0xCF);word(0x3A,DA_FAMILY);a.emit(0xFE,1);a.absolute(0xCA,'DA_PRINT_CB');
    a.emit(0xFE,3);a.absolute(0xCA,'DA_PRINT_CB');a.emit(0xFE,4);a.absolute(0xCA,'DA_PRINT_DB');
    word(0x2A,DA_STREAM);call('DA_PRINT_TEMPLATE');jr(0x18,'DA_PRINT_DONE');
    a.label('DA_PRINT_DB');a.ldHLLabel('DA_TEXT_DB');call('BIOS_PRINT_STRING');word(0x2A,DA_START);a.emit(0x7E);call('BIOS_PRINT_HEX8');a.ldHLLabel('DA_TEXT_PREFIX_LIMIT');call('BIOS_PRINT_STRING');
    a.label('DA_PRINT_DONE');call('BIOS_NEWLINE');word(0x2A,DA_NEXT);word(0x3A,DA_LENGTH);a.emit(0xC9);

    // A=opcode, HL=256-bit table. Carry reports membership.
    a.label('DA_TEST_BIT');a.emit(0x5F,0xE6,7,0x47,0x7B,0x0F,0x0F,0x0F,0xE6,31,0x5F,0x16,0,0x19,0x7E,0x04,0x05);jr(0x28,'DA_TEST_MASKED');
    a.label('DA_TEST_ROTATE');a.emit(0x0F);jr(0x10,'DA_TEST_ROTATE');
    a.label('DA_TEST_MASKED');a.emit(0xE6,1,0xC8,0x37,0xC9);
    // A=index, HL=word pointer table. Return HL=entry.
    a.label('DA_LOOKUP');a.emit(0x5F,0x16,0,0x19,0x19,0x5E,0x23,0x56,0xEB,0xC9);

    // Print a zero-terminated mnemonic template. Lowercase n/nn, e and d are
    // runtime operands. Index substitution applies only to affected operands.
    a.label('DA_PRINT_TEMPLATE');a.emit(0xAF);word(0x32,DA_PREFIXES);
    a.label('DA_TEMPLATE_LOOP');a.emit(0x7E,0xB7,0xC8,0xFE,110);a.absolute(0xCA,'DA_TEMPLATE_N');
    a.emit(0xFE,101);a.absolute(0xCA,'DA_TEMPLATE_E');a.emit(0xFE,100);a.absolute(0xCA,'DA_TEMPLATE_D');
    a.emit(0xFE,32);jr(0x20,'DA_TEMPLATE_INDEX');a.emit(0x3E,1);word(0x32,DA_PREFIXES);a.emit(0x3E,32,0xCF,0x23);jp('DA_TEMPLATE_LOOP');
    a.label('DA_TEMPLATE_INDEX');word(0x3A,DA_INDEX);a.emit(0xB7);jr(0x28,'DA_TEMPLATE_CHAR');word(0x3A,DA_AFFECTED);a.emit(0xB7);jr(0x28,'DA_TEMPLATE_CHAR');
    word(0x3A,DA_INDEXED_MEMORY);a.emit(0xB7);jr(0x28,'DA_TEMPLATE_INDEX_REG');
    a.emit(0x7E,0xFE,40);jr(0x20,'DA_TEMPLATE_CHAR');a.emit(0x23,0x7E,0xFE,72);jr(0x20,'DA_TEMPLATE_REWIND1');
    a.emit(0x23,0x7E,0xFE,76);jr(0x20,'DA_TEMPLATE_REWIND2');a.emit(0x23,0x7E,0xFE,41);jr(0x20,'DA_TEMPLATE_REWIND3');
    a.emit(0x3E,40,0xCF);call('DA_PRINT_INDEX');call('DA_PRINT_DISP');a.emit(0x3E,41,0xCF,0x23);jp('DA_TEMPLATE_LOOP');
    a.label('DA_TEMPLATE_REWIND3');a.emit(0x2B);
    a.label('DA_TEMPLATE_REWIND2');a.emit(0x2B);
    a.label('DA_TEMPLATE_REWIND1');a.emit(0x2B);jr(0x18,'DA_TEMPLATE_CHAR');
    a.label('DA_TEMPLATE_INDEX_REG');word(0x3A,DA_PREFIXES);a.emit(0xB7);jr(0x28,'DA_TEMPLATE_CHAR');
    a.emit(0x7E,0xFE,72);jr(0x28,'DA_TEMPLATE_H');a.emit(0xFE,76);jr(0x20,'DA_TEMPLATE_CHAR');
    call('DA_PRINT_INDEX');a.emit(0x3E,76,0xCF,0x23);jp('DA_TEMPLATE_LOOP');
    a.label('DA_TEMPLATE_H');a.emit(0x23,0x7E,0xFE,76);jr(0x20,'DA_TEMPLATE_H_SINGLE');call('DA_PRINT_INDEX');a.emit(0x23);jp('DA_TEMPLATE_LOOP');
    a.label('DA_TEMPLATE_H_SINGLE');a.emit(0x2B);call('DA_PRINT_INDEX');a.emit(0x3E,72,0xCF,0x23);jp('DA_TEMPLATE_LOOP');
    a.label('DA_TEMPLATE_CHAR');a.emit(0x7E,0xCF,0x23);jp('DA_TEMPLATE_LOOP');
    a.label('DA_TEMPLATE_N');a.emit(0x23,0x7E,0xFE,110);jr(0x28,'DA_TEMPLATE_NN');a.emit(0x2B,0xE5);word(0x2A,DA_OPERAND);a.emit(0x7E,0x23);word(0x22,DA_OPERAND);call('BIOS_PRINT_HEX8');a.emit(0x3E,104,0xCF,0xE1,0x23);jp('DA_TEMPLATE_LOOP');
    a.label('DA_TEMPLATE_NN');a.emit(0xE5);word(0x2A,DA_OPERAND);a.emit(0x5E,0x23,0x56,0x23);word(0x22,DA_OPERAND);a.emit(0xEB);call('BIOS_PRINT_HEX16');a.emit(0x3E,104,0xCF,0xE1,0x23);jp('DA_TEMPLATE_LOOP');
    a.label('DA_TEMPLATE_E');a.emit(0xE5);word(0x2A,DA_OPERAND);a.emit(0x5E,0x7B,0x87,0x9F,0x57,0x23);word(0x22,DA_OPERAND);word(0x2A,DA_NEXT);a.emit(0x19);call('BIOS_PRINT_HEX16');a.emit(0x3E,104,0xCF,0xE1,0x23);jp('DA_TEMPLATE_LOOP');
    a.label('DA_TEMPLATE_D');a.emit(0xE5);call('DA_PRINT_DISP');a.emit(0xE1,0x23);jp('DA_TEMPLATE_LOOP');
    a.label('DA_PRINT_INDEX');a.emit(0x3E,73,0xCF);word(0x3A,DA_INDEX);a.emit(0xFE,1,0x3E,89);jr(0x20,'DA_PRINT_INDEX_CHAR');a.emit(0x3E,88);
    a.label('DA_PRINT_INDEX_CHAR');a.emit(0xCF,0xC9);
    a.label('DA_PRINT_DISP');word(0x3A,DA_DISP);a.emit(0xB7);a.absolute(0xF2,'DA_DISP_POS');a.emit(0x2F,0x3C,0xF5,0x3E,45,0xCF,0xF1);jr(0x18,'DA_DISP_HEX');
    a.label('DA_DISP_POS');a.emit(0xF5,0x3E,43,0xCF,0xF1);
    a.label('DA_DISP_HEX');call('BIOS_PRINT_HEX8');a.emit(0x3E,104,0xCF,0xC9);

    a.label('DA_PRINT_CB');word(0x3A,DA_OPCODE);a.emit(0x47,0xE6,0xC0,0x07,0x07,0x4F,0x78,0x0F,0x0F,0x0F,0xE6,7,0x57); // C=group,D=operation
    a.emit(0x79,0xB7);jr(0x20,'DA_CB_GROUP');a.emit(0x7A);a.ldHLLabel('DA_ROTATE_POINTERS');call('DA_LOOKUP');jr(0x18,'DA_CB_NAME');
    a.label('DA_CB_GROUP');a.emit(0x3D);a.ldHLLabel('DA_GROUP_POINTERS');call('DA_LOOKUP');
    a.label('DA_CB_NAME');call('BIOS_PRINT_STRING');a.emit(0x3E,32,0xCF);word(0x3A,DA_OPCODE);a.emit(0xE6,0xC0,0x07,0x07,0xB7);jr(0x28,'DA_CB_OPERAND');
    word(0x3A,DA_OPCODE);a.emit(0x0F,0x0F,0x0F,0xE6,7,0xC6,48,0xCF,0x3E,44,0xCF);
    a.label('DA_CB_OPERAND');word(0x3A,DA_FAMILY);a.emit(0xFE,3);jr(0x20,'DA_CB_REGISTER');
    a.emit(0x3E,40,0xCF);call('DA_PRINT_INDEX');call('DA_PRINT_DISP');a.emit(0x3E,41,0xCF);
    // BIT indexed forms never copy to a register. Other target codes except 6 do.
    word(0x3A,DA_OPCODE);a.emit(0x47,0xE6,0xC0,0x07,0x07,0xFE,1);jr(0x28,'DA_CB_DONE');a.emit(0x78,0xE6,7,0xFE,6);jr(0x28,'DA_CB_DONE');a.emit(0xF5,0x3E,44,0xCF,0xF1);jr(0x18,'DA_CB_REGISTER_A');
    a.label('DA_CB_REGISTER');word(0x3A,DA_OPCODE);a.emit(0xE6,7);
    a.label('DA_CB_REGISTER_A');a.ldHLLabel('DA_REGISTER_POINTERS');call('DA_LOOKUP');call('BIOS_PRINT_STRING');
    a.label('DA_CB_DONE');jp('DA_PRINT_DONE');

    a.org(0x0D00);
    a.label('MONITOR_READ');call('MONITOR_SNAPSHOT');word(0x21,MON_BUFFER);a.emit(0x06,63);call('BIOS_GETLINE');
    a.emit(0xB7);a.absolute(0xCA,'MONITOR_PROMPT');
    a.emit(0x4F,0x7E);call('MONITOR_UPPER');
    a.emit(0xFE,68);a.absolute(0xCA,'MONITOR_DUMP_PARSE');
    a.emit(0xFE,82);a.absolute(0xCA,'MONITOR_REGISTERS_PARSE');
    a.emit(0xFE,85);a.absolute(0xCA,'MONITOR_UNASSEMBLE_PARSE');
    a.emit(0xFE,66);a.absolute(0xCA,'MONITOR_BOOT_TEST');
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
    a.emit(0x79);word(0x32,MON_RANGE_FLAGS);
    a.emit(0x79,0xFE,6);jr(0x28,'MONITOR_DUMP_FIRST');a.emit(0xFE,11);a.absolute(0xC2,'MONITOR_ERROR');
    a.label('MONITOR_DUMP_FIRST');
    a.emit(0x23,0x7E,0xFE,32);a.absolute(0xC2,'MONITOR_ERROR');
    a.emit(0x23);call('BIOS_PARSE_HEX16');a.absolute(0xD2,'MONITOR_ERROR'); // NC
    a.emit(0xED,0x53,lo(MON_RANGE_START),hi(MON_RANGE_START));
    // Legacy form is 64 bytes. Range form computes inclusive modular distance,
    // capped at 256 bytes so one command cannot monopolize the console.
    word(0x3A,MON_RANGE_FLAGS);a.emit(0xFE,6);jr(0x20,'MONITOR_DUMP_RANGE');
    word(0x01,64);a.emit(0xAF);word(0x32,MON_RANGE_FLAGS);jr(0x18,'MONITOR_DUMP_READY');
    a.label('MONITOR_DUMP_RANGE');a.emit(0x7E,0xFE,32);a.absolute(0xC2,'MONITOR_ERROR');
    a.emit(0x23);call('BIOS_PARSE_HEX16');a.absolute(0xD2,'MONITOR_ERROR');
    word(0x2A,MON_RANGE_START);a.emit(0x7B,0x95,0x4F,0x7A,0x9C,0x47,0x03); // BC=end-start+1
    a.emit(0x78,0xB7);jr(0x20,'MONITOR_DUMP_CAP');a.emit(0x79,0xB7);jr(0x28,'MONITOR_DUMP_CAP');
    a.emit(0xAF);word(0x32,MON_RANGE_FLAGS);jr(0x18,'MONITOR_DUMP_READY');
    a.label('MONITOR_DUMP_CAP');word(0x01,256);a.emit(0x3E,1);word(0x32,MON_RANGE_FLAGS);
    a.label('MONITOR_DUMP_READY');word(0x2A,MON_RANGE_START);
    a.label('MONITOR_DUMP_ROW');call('BIOS_PRINT_HEX16');a.emit(0x3E,58,0xCF,0x1E,8);
    a.label('MONITOR_DUMP_BYTE');a.emit(0x3E,32,0xCF,0x7E);call('BIOS_PRINT_HEX8');a.emit(0x23,0x0B,0x78,0xB1);
    jr(0x28,'MONITOR_DUMP_DONE');a.emit(0x1D);jr(0x20,'MONITOR_DUMP_BYTE');call('BIOS_NEWLINE');jr(0x18,'MONITOR_DUMP_ROW');
    a.label('MONITOR_DUMP_DONE');call('BIOS_NEWLINE');word(0x3A,MON_RANGE_FLAGS);a.emit(0xB7);jr(0x28,'MONITOR_DUMP_EXIT');
    a.ldHLLabel('MONITOR_RANGE_LIMIT_TEXT');call('BIOS_PRINT_STRING');
    a.label('MONITOR_DUMP_EXIT');jp('MONITOR_PROMPT');

    a.label('MONITOR_REGISTERS_PARSE');a.emit(0x79,0xFE,1);a.absolute(0xC2,'MONITOR_ERROR');
    for(const [label,address] of [
      ['MON_REG_AF',0],['MON_REG_BC',2],['MON_REG_DE',4],['MON_REG_HL',6]
    ]){a.ldHLLabel(label);call('BIOS_PRINT_STRING');word(0x2A,MON_CONTEXT+address);call('BIOS_PRINT_HEX16');}
    call('BIOS_NEWLINE');
    for(const [label,address] of [
      ['MON_REG_AF2',8],['MON_REG_BC2',10],['MON_REG_DE2',12],['MON_REG_HL2',14]
    ]){a.ldHLLabel(label);call('BIOS_PRINT_STRING');word(0x2A,MON_CONTEXT+address);call('BIOS_PRINT_HEX16');}
    call('BIOS_NEWLINE');
    for(const [label,address] of [['MON_REG_IX',16],['MON_REG_IY',18],['MON_REG_SP',20]]){
      a.ldHLLabel(label);call('BIOS_PRINT_STRING');word(0x2A,MON_CONTEXT+address);call('BIOS_PRINT_HEX16');
    }
    a.ldHLLabel('MON_REG_I');call('BIOS_PRINT_STRING');word(0x3A,MON_CONTEXT+22);call('BIOS_PRINT_HEX8');
    a.ldHLLabel('MON_REG_R');call('BIOS_PRINT_STRING');word(0x3A,MON_CONTEXT+23);call('BIOS_PRINT_HEX8');call('BIOS_NEWLINE');jp('MONITOR_PROMPT');

    a.label('MONITOR_UNASSEMBLE_PARSE');a.emit(0x79);word(0x32,MON_RANGE_FLAGS);
    a.emit(0xFE,6);jr(0x28,'MONITOR_U_FIRST');a.emit(0xFE,11);a.absolute(0xC2,'MONITOR_ERROR');
    a.label('MONITOR_U_FIRST');a.emit(0x23,0x7E,0xFE,32);a.absolute(0xC2,'MONITOR_ERROR');a.emit(0x23);
    call('BIOS_PARSE_HEX16');a.absolute(0xD2,'MONITOR_ERROR');a.emit(0xED,0x53,lo(MON_RANGE_START),hi(MON_RANGE_START));
    word(0x3A,MON_RANGE_FLAGS);a.emit(0xFE,6);jr(0x20,'MONITOR_U_RANGE');
    word(0x01,8);a.emit(0xAF);word(0x32,MON_RANGE_FLAGS);jr(0x18,'MONITOR_U_READY');
    a.label('MONITOR_U_RANGE');a.emit(0x7E,0xFE,32);a.absolute(0xC2,'MONITOR_ERROR');a.emit(0x23);
    call('BIOS_PARSE_HEX16');a.absolute(0xD2,'MONITOR_ERROR');word(0x2A,MON_RANGE_START);
    a.emit(0x7B,0x95,0x4F,0x7A,0x9C,0x47,0x03); // BC=end-start+1 modular
    a.emit(0x78,0xB7);jr(0x20,'MONITOR_U_CAP_BYTES');a.emit(0x79,0xB7);jr(0x28,'MONITOR_U_CAP_BYTES');
    a.emit(0x3E,1);word(0x32,MON_RANGE_FLAGS);jr(0x18,'MONITOR_U_READY');
    a.label('MONITOR_U_CAP_BYTES');word(0x01,256);a.emit(0x3E,3);word(0x32,MON_RANGE_FLAGS);
    a.label('MONITOR_U_READY');a.emit(0xED,0x43,lo(MON_RANGE_COUNT),hi(MON_RANGE_COUNT),0xAF);word(0x32,MON_RANGE_FLAGS+1);word(0x2A,MON_RANGE_START);
    a.label('MONITOR_U_LOOP');call('BIOS_DISASM_ONE');a.emit(0x5F,0x16,0); // DE=consumed, HL=next
    word(0x3A,MON_RANGE_FLAGS);a.emit(0xE6,1);jr(0x28,'MONITOR_U_DEFAULT_COUNT');
    a.emit(0xED,0x4B,lo(MON_RANGE_COUNT),hi(MON_RANGE_COUNT),0x79,0x93,0x4F,0x78,0x9A,0x47);
    a.emit(0xDA);a.dataWord('MONITOR_U_DONE'); // JP C,done: consumed reached/passed boundary
    a.emit(0x78,0xB1);jr(0x28,'MONITOR_U_DONE');a.emit(0xED,0x43,lo(MON_RANGE_COUNT),hi(MON_RANGE_COUNT));
    word(0x3A,MON_RANGE_FLAGS+1);a.emit(0x3C);word(0x32,MON_RANGE_FLAGS+1);a.emit(0xFE,32);jr(0x38,'MONITOR_U_LOOP');
    word(0x3A,MON_RANGE_FLAGS);a.emit(0xF6,2);word(0x32,MON_RANGE_FLAGS);jr(0x18,'MONITOR_U_DONE');
    a.label('MONITOR_U_DEFAULT_COUNT');a.emit(0xED,0x4B,lo(MON_RANGE_COUNT),hi(MON_RANGE_COUNT),0x0B,0xED,0x43,lo(MON_RANGE_COUNT),hi(MON_RANGE_COUNT),0x78,0xB1);jr(0x20,'MONITOR_U_LOOP');
    a.label('MONITOR_U_DONE');word(0x3A,MON_RANGE_FLAGS);a.emit(0xE6,2);jr(0x28,'MONITOR_U_EXIT');a.ldHLLabel('MONITOR_RANGE_LIMIT_TEXT');call('BIOS_PRINT_STRING');
    a.label('MONITOR_U_EXIT');jp('MONITOR_PROMPT');

    // Compact ROM tables. BASE/ED entries contain instruction length followed
    // by a zero-terminated template. Index and CB families are derived at runtime.
    const emitText=(label,text)=>{a.label(label);a.emit(...[...text].map(ch=>ch.charCodeAt(0)),0);};
    a.org(0x2000);
    a.label('DA_INDEX_AFFECTED_BITS');
    for(let group=0;group<32;group++){
      let bits=0;for(let bit=0;bit<8;bit++)if(decoder.decodeIndex(group*8+bit,'IX').affected)bits|=1<<bit;a.emit(bits);
    }
    a.label('DA_INDEX_MEMORY_BITS');
    for(let group=0;group<32;group++){
      let bits=0;for(let bit=0;bit<8;bit++)if(decoder.decodeIndex(group*8+bit,'IX').indexedMemory)bits|=1<<bit;a.emit(bits);
    }
    a.label('DA_BASE_POINTERS');for(let op=0;op<256;op++)a.dataWord(`DA_BASE_${op}`);
    for(let op=0;op<256;op++){
      const d=decoder.decodeBase(op)||{length:1,mnemonic:'DB n'};
      a.label(`DA_BASE_${op}`);a.emit(d.length,...[...d.mnemonic].map(ch=>ch.charCodeAt(0)),0);
    }
    const edUnique=[],edIndex=[];
    for(let op=0;op<256;op++){
      const d=decoder.decodeED(op),mnemonic=d.mnemonic.replace('unused','UNUSED'),key=d.length+'|'+mnemonic;let index=edUnique.findIndex(x=>x.key===key);
      if(index<0){index=edUnique.length;edUnique.push({key,d:{...d,mnemonic}});}edIndex.push(index);
    }
    a.label('DA_ED_POINTERS');for(const index of edIndex)a.dataWord(`DA_ED_${index}`);
    edUnique.forEach(({d},index)=>{a.label(`DA_ED_${index}`);a.emit(d.length,...[...d.mnemonic].map(ch=>ch.charCodeAt(0)),0);});
    const rotate=['RLC','RRC','RL','RR','SLA','SRA','SLL','SRL'],groups=['BIT','RES','SET'],regs=['B','C','D','E','H','L','(HL)','A'];
    a.label('DA_ROTATE_POINTERS');rotate.forEach((_,i)=>a.dataWord(`DA_ROTATE_${i}`));rotate.forEach((s,i)=>emitText(`DA_ROTATE_${i}`,s));
    a.label('DA_GROUP_POINTERS');groups.forEach((_,i)=>a.dataWord(`DA_GROUP_${i}`));groups.forEach((s,i)=>emitText(`DA_GROUP_${i}`,s));
    a.label('DA_REGISTER_POINTERS');regs.forEach((_,i)=>a.dataWord(`DA_REGISTER_${i}`));regs.forEach((s,i)=>emitText(`DA_REGISTER_${i}`,s));
    emitText('DA_TEXT_DB','DB ');emitText('DA_TEXT_PREFIX_LIMIT','h ; PREFIX LIMIT');

    // RAM handoff is deliberately located in Extension ROM. It validates that
    // LOW_RAM is requested and the target is outside the lower 16 KiB, copies
    // the three instruction continuation to high RAM, then never returns.
    a.org(0x3000);
    a.label('BIOS_RAM_HANDOFF');
    a.emit(0x47,0xCB,0x47);                 // LD B,A / BIT 0,A
    jr(0x28,'BIOS_RAM_HANDOFF_FAIL');
    a.emit(0x7C,0xFE,0x40);                 // LD A,H / CP 40h
    jr(0x38,'BIOS_RAM_HANDOFF_FAIL');
    a.emit(0x78,0xE5,0xF5);                 // LD A,B / PUSH HL / PUSH AF
    a.ldHLLabel('RAM_HANDOFF_TRAMPOLINE_TEMPLATE');
    word(0x11,RAM_HANDOFF_TRAMPOLINE);word(0x01,3);a.emit(0xED,0xB0); // LDIR
    a.emit(0xF1,0xE1);word(0xC3,RAM_HANDOFF_TRAMPOLINE); // POP AF/HL / JP trampoline
    a.label('BIOS_RAM_HANDOFF_FAIL');a.emit(0xB7,0xC9); // clear carry / RET
    a.label('RAM_HANDOFF_TRAMPOLINE_TEMPLATE');
    a.emit(0xD3,MEMORY_CONTROL_PORT,0xE9);   // OUT (00h),A / JP (HL)

    // Visible proof of the future OS-loader path. B copies an original payload
    // to RAM, constructs the reset vector through shadow writes, then performs
    // the same non-returning handoff that a disk loader will use.
    const line1='SHINO-80 RAM BOOT',line2='ALL 64K RAM ONLINE',demo=[];
    const demoEmit=(...values)=>demo.push(...values.map(value=>Number(value)&0xFF));
    const demoWord=(opcode,value)=>demoEmit(opcode,lo(value),hi(value));
    demoWord(0x21,TEXT_VRAM_BASE);demoEmit(0x36,0);demoWord(0x11,TEXT_VRAM_BASE+1);demoWord(0x01,TEXT_VRAM_BYTES-1);demoEmit(0xED,0xB0);
    const line1Pointer=demo.length+1;demoWord(0x21,0);demoWord(0x11,TEXT_VRAM_BASE);demoWord(0x01,line1.length);demoEmit(0xED,0xB0);
    const line2Pointer=demo.length+1;demoWord(0x21,0);demoWord(0x11,TEXT_VRAM_BASE+TEXT_COLS);demoWord(0x01,line2.length);demoEmit(0xED,0xB0);
    demoWord(0x21,0x3852);demoWord(0x22,RAM_HANDOFF_SIGNATURE); // R8
    demoWord(0x21,0x2130);demoWord(0x22,RAM_HANDOFF_SIGNATURE+2); // 0!
    demoEmit(0x76); // HALT; no ROM BIOS call exists after page-out
    const line1Address=RAM_HANDOFF_DEMO_ENTRY+demo.length;
    const line2Address=line1Address+line1.length;
    demo[line1Pointer]=lo(line1Address);demo[line1Pointer+1]=hi(line1Address);
    demo[line2Pointer]=lo(line2Address);demo[line2Pointer+1]=hi(line2Address);
    demoEmit(...[...line1,...line2].map(ch=>ch.charCodeAt(0)));

    a.label('MONITOR_BOOT_TEST');a.emit(0x79,0xFE,1);a.absolute(0xC2,'MONITOR_ERROR');
    a.ldHLLabel('RAM_HANDOFF_DEMO_IMAGE');word(0x11,RAM_HANDOFF_DEMO_ENTRY);word(0x01,demo.length);a.emit(0xED,0xB0);
    a.emit(0x3E,MEMORY_CONTROL_SHADOW_WRITE,0xD3,MEMORY_CONTROL_PORT);
    a.emit(0x3E,0xC3);word(0x32,0x0000);word(0x21,RAM_HANDOFF_DEMO_ENTRY);word(0x22,0x0001);
    word(0x21,RAM_HANDOFF_DEMO_ENTRY);a.emit(0x3E,MEMORY_CONTROL_LOW_RAM);jp('BIOS_RAM_HANDOFF');
    a.label('RAM_HANDOFF_DEMO_IMAGE');a.emit(...demo);

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
        ramHandoffTrampoline:RAM_HANDOFF_TRAMPOLINE,
        ramHandoffDemoEntry:RAM_HANDOFF_DEMO_ENTRY,
        ramHandoffSignature:RAM_HANDOFF_SIGNATURE,
        ramHandoffDemoBytes:demo.length,
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
    KEY_DATA_PORT,KEY_STATUS_PORT,MEMORY_CONTROL_PORT,
    RAM_HANDOFF_TRAMPOLINE,RAM_HANDOFF_DEMO_ENTRY,RAM_HANDOFF_SIGNATURE,
    buildSystemRom
  };
});
