'use strict';

const fs=require('node:fs');
const path=require('node:path');
const repo=path.resolve(__dirname,'../..');
const {createBlankBlockImage}=require(path.join(repo,'src/devices/shino80/shino80-block-device.js'));
const cpm=require(path.join(repo,'src/firmware/shino80/shino80-cpm-filesystem.js'));
const {buildPrintCom}=require(path.join(repo,'src/firmware/shino80/shino80-cpm-starter-files.js'));

class Asm {
  constructor(origin=0x0100){this.origin=origin;this.bytes=[];this.labels=new Map();this.fixups=[];}
  get pc(){return this.origin+this.bytes.length;}
  emit(...values){for(const value of values)this.bytes.push(value&0xFF);return this;}
  word(value){this.emit(value,value>>8);return this;}
  label(name){if(this.labels.has(name))throw new Error(`duplicate label ${name}`);this.labels.set(name,this.pc);return this;}
  abs(opcode,label){this.emit(...(Array.isArray(opcode)?opcode:[opcode]));const at=this.bytes.length;this.word(0);this.fixups.push({kind:'abs',at,label});return this;}
  rel(opcode,label){this.emit(opcode);const at=this.bytes.length;this.emit(0);this.fixups.push({kind:'rel',at,label});return this;}
  address(label){const at=this.bytes.length;this.word(0);this.fixups.push({kind:'abs',at,label});return this;}
  text(value){for(const char of value)this.emit(char.charCodeAt(0));return this;}
  resolve(){
    for(const fix of this.fixups){
      const target=this.labels.get(fix.label);if(target===undefined)throw new Error(`unknown label ${fix.label}`);
      if(fix.kind==='abs'){this.bytes[fix.at]=target&0xFF;this.bytes[fix.at+1]=(target>>8)&0xFF;continue;}
      const next=this.origin+fix.at+1,delta=target-next;if(delta< -128||delta>127)throw new Error(`relative jump ${fix.label} out of range: ${delta}`);this.bytes[fix.at]=delta&0xFF;
    }
    return Uint8Array.from(this.bytes);
  }
}

function buildBalls(){
  const a=new Asm();
  // Clear the 80x25 VRAM, then place a fixed heading on row zero.
  a.label('START').abs(0xCD,'CLEAR').abs(0x21,'TITLE').emit(0x11).word(0xC000).emit(0x01).word(42).emit(0xED,0xB0);
  for(let i=0;i<6;i++){
    a.emit(0x3A).address(`Y${i}`).emit(0x47,0x3A).address(`X${i}`).emit(0x4F,0x3E,'Oo*@+#'.charCodeAt(i)).abs(0xCD,'DRAW');
  }
  a.label('FRAME');
  for(let i=0;i<6;i++){
    // Erase the old glyph.
    a.emit(0x3A).address(`Y${i}`).emit(0x47,0x3A).address(`X${i}`).emit(0x4F,0x3E,0x20).abs(0xCD,'DRAW');
    // Reflect X direction at columns 0 and 79, then move.
    a.emit(0x3A).address(`X${i}`).emit(0xB7).rel(0x20,`X_NOT_MIN_${i}`);
    a.emit(0x3A).address(`DX${i}`).emit(0xFE,0xFF).rel(0x20,`X_NOT_MIN_${i}`).emit(0x3E,0x01,0x32).address(`DX${i}`);
    a.label(`X_NOT_MIN_${i}`).emit(0x3A).address(`X${i}`).emit(0xFE,79).rel(0x20,`X_READY_${i}`);
    a.emit(0x3A).address(`DX${i}`).emit(0xFE,0x01).rel(0x20,`X_READY_${i}`).emit(0x3E,0xFF,0x32).address(`DX${i}`);
    a.label(`X_READY_${i}`).emit(0x3A).address(`DX${i}`).emit(0x47,0x3A).address(`X${i}`).emit(0x80,0x32).address(`X${i}`);
    // Rows 0-1 are reserved for the heading; reflect between rows 2 and 24.
    a.emit(0x3A).address(`Y${i}`).emit(0xFE,2).rel(0x20,`Y_NOT_MIN_${i}`);
    a.emit(0x3A).address(`DY${i}`).emit(0xFE,0xFF).rel(0x20,`Y_NOT_MIN_${i}`).emit(0x3E,0x01,0x32).address(`DY${i}`);
    a.label(`Y_NOT_MIN_${i}`).emit(0x3A).address(`Y${i}`).emit(0xFE,24).rel(0x20,`Y_READY_${i}`);
    a.emit(0x3A).address(`DY${i}`).emit(0xFE,0x01).rel(0x20,`Y_READY_${i}`).emit(0x3E,0xFF,0x32).address(`DY${i}`);
    a.label(`Y_READY_${i}`).emit(0x3A).address(`DY${i}`).emit(0x47,0x3A).address(`Y${i}`).emit(0x80,0x32).address(`Y${i}`);
    // Draw at the new coordinate.
    a.emit(0x3A).address(`Y${i}`).emit(0x47,0x3A).address(`X${i}`).emit(0x4F,0x3E,'Oo*@+#'.charCodeAt(i)).abs(0xCD,'DRAW');
  }
  // A short frame delay. C/c is consumed directly from the keyboard device.
  a.emit(0x06,40).label('DELAY_OUTER').emit(0x0E,0x00).label('DELAY_INNER').emit(0x0D).rel(0x20,'DELAY_INNER').rel(0x10,'DELAY_OUTER');
  a.emit(0xDB,0x21,0xE6,0x01).abs(0xCA,'FRAME').emit(0xDB,0x20,0xE6,0xDF,0xFE,0x43).abs(0xC2,'FRAME').abs(0xC3,'EXIT');

  // Restore the active CBIOS cursor state, then re-enter CCP directly. This
  // avoids a needless full warm-boot rescan of a large B: medium.
  a.label('EXIT').abs(0xCD,'CLEAR').emit(0x21).word(0xC000).emit(0x3A).word(0x0002).emit(0xFE,0xF4).rel(0x20,'EXIT_V2');
  a.emit(0x22).word(0xFBF7).emit(0xAF,0x32).word(0xFBF9).rel(0x18,'EXIT_CCP');
  a.label('EXIT_V2').emit(0x22).word(0xFC30).emit(0xAF,0x32).word(0xFC32);
  a.label('EXIT_CCP').emit(0x3A).word(0x0004).emit(0xE6,0x01,0x4F,0xC3).word(0x9400);
  a.label('CLEAR').emit(0x21).word(0xC000).emit(0x36,0x20,0x11).word(0xC001).emit(0x01).word(1999).emit(0xED,0xB0,0xC9);
  // DRAW: A=glyph, B=row, C=column. Clobbers AF/DE/HL only.
  a.label('DRAW').emit(0xF5,0x78,0x6F,0x26,0x00,0x29,0x29,0x29,0x29,0x54,0x5D,0x29,0x29,0x19,0x16,0x00,0x59,0x19,0x11).word(0xC000).emit(0x19,0xF1,0x77,0xC9);
  a.label('TITLE').text('SHINO-80 BALLS DEMO - PRESS C TO STOP     ');
  const starts=[[4,3,1,1],[17,7,1,0xFF],[31,12,0xFF,1],[46,18,1,0xFF],[62,22,0xFF,0xFF],[75,5,0xFF,1]];
  for(let i=0;i<starts.length;i++){
    const [x,y,dx,dy]=starts[i];a.label(`X${i}`).emit(x).label(`Y${i}`).emit(y).label(`DX${i}`).emit(dx).label(`DY${i}`).emit(dy);
  }
  return a.resolve();
}

function addPutc(a){
  a.label('PUTC').emit(0xF5,0xC5,0xD5,0xE5,0x5F,0x0E,0x02,0xCD,0x05,0x00,0xE1,0xD1,0xC1,0xF1,0xC9);
}

function buildMonx(){
  const a=new Asm();
  a.label('START').abs(0xCD,'BANNER');
  a.label('LOOP').abs(0x11,'PROMPT').emit(0x0E,0x09,0xCD,0x05,0x00).abs(0x11,'BUFFER').emit(0x0E,0x0A,0xCD,0x05,0x00);
  a.emit(0x3A).address('COUNT').emit(0xB7).rel(0x28,'LOOP').abs(0x21,'INPUT').emit(0x7E,0xE6,0xDF,0x23);
  const commands=[['H','CMD_HELP'],['D','CMD_DUMP'],['E','CMD_EDIT'],['F','CMD_FILL'],['M','CMD_MOVE'],['S','CMD_SEARCH'],['G','CMD_GO'],['C','CMD_CLEAR'],['Q','CMD_QUIT']];
  for(const [key,label] of commands)a.emit(0xFE,key.charCodeAt(0)).abs(0xCA,label);
  a.abs(0xC3,'ERROR');

  a.label('CMD_HELP').abs(0xCD,'BANNER').abs(0xC3,'LOOP');
  a.label('CMD_QUIT').abs(0x11,'BYE').emit(0x0E,0x09,0xCD,0x05,0x00,0xC9);
  a.label('CMD_CLEAR').emit(0x06,27).label('CLEAR_LOOP').emit(0x3E,0x0D).abs(0xCD,'PUTC').emit(0x3E,0x0A).abs(0xCD,'PUTC').rel(0x10,'CLEAR_LOOP').abs(0xC3,'LOOP');

  // D aaaa: fixed 128-byte dump, eight rows of sixteen bytes.
  a.label('CMD_DUMP').abs(0xCD,'PARSE16').abs(0xDA,'ERROR').emit(0xED,0x53).address('ADDR').emit(0x3E,8,0x32).address('LINES');
  a.label('DUMP_LINE').emit(0xED,0x5B).address('ADDR').abs(0xCD,'PRINT_DE_HEX').emit(0x3E,0x3A).abs(0xCD,'PUTC').emit(0x3E,0x20).abs(0xCD,'PUTC').emit(0x2A).address('ADDR').emit(0x3E,16,0x32).address('ITEMS');
  a.label('DUMP_BYTE').emit(0x7E).abs(0xCD,'PRINT_HEX8').emit(0x3E,0x20).abs(0xCD,'PUTC').emit(0x23,0x3A).address('ITEMS').emit(0x3D,0x32).address('ITEMS').rel(0x20,'DUMP_BYTE');
  a.emit(0x22).address('ADDR').abs(0xCD,'CRLF').emit(0x3A).address('LINES').emit(0x3D,0x32).address('LINES').rel(0x20,'DUMP_LINE').abs(0xC3,'LOOP');

  // E aaaa dd: edit one byte.
  a.label('CMD_EDIT').abs(0xCD,'PARSE16').abs(0xDA,'ERROR').emit(0xED,0x53).address('ADDR').abs(0xCD,'PARSE8').abs(0xDA,'ERROR').emit(0x2A).address('ADDR').emit(0x77).abs(0xCD,'OK').abs(0xC3,'LOOP');

  // F aaaa bbbb dd: inclusive fill.
  a.label('CMD_FILL').abs(0xCD,'PARSE16').abs(0xDA,'ERROR').emit(0xED,0x53).address('ADDR').abs(0xCD,'PARSE16').abs(0xDA,'ERROR').emit(0xED,0x53).address('END').abs(0xCD,'PARSE8').abs(0xDA,'ERROR').emit(0x32).address('VALUE').abs(0xCD,'VALIDATE_RANGE').abs(0xDA,'ERROR').emit(0x2A).address('ADDR');
  a.label('FILL_LOOP').emit(0x3A).address('VALUE').emit(0x77,0xED,0x5B).address('END').emit(0x7C,0xBA).rel(0x20,'FILL_NEXT').emit(0x7D,0xBB).rel(0x28,'FILL_DONE');
  a.label('FILL_NEXT').emit(0x23).rel(0x18,'FILL_LOOP').label('FILL_DONE').abs(0xCD,'OK').abs(0xC3,'LOOP');

  // M aaaa bbbb cccc: forward copy inclusive.
  a.label('CMD_MOVE').abs(0xCD,'PARSE16').abs(0xDA,'ERROR').emit(0xED,0x53).address('ADDR').abs(0xCD,'PARSE16').abs(0xDA,'ERROR').emit(0xED,0x53).address('END').abs(0xCD,'PARSE16').abs(0xDA,'ERROR').emit(0xED,0x53).address('DEST').abs(0xCD,'VALIDATE_RANGE').abs(0xDA,'ERROR');
  a.emit(0x2A).address('END').emit(0xED,0x5B).address('ADDR').emit(0xB7,0xED,0x52,0x23,0x44,0x4D,0x2A).address('ADDR').emit(0xED,0x5B).address('DEST').emit(0xED,0xB0).abs(0xCD,'OK').abs(0xC3,'LOOP');

  // S aaaa bbbb dd: list every matching address.
  a.label('CMD_SEARCH').abs(0xCD,'PARSE16').abs(0xDA,'ERROR').emit(0xED,0x53).address('ADDR').abs(0xCD,'PARSE16').abs(0xDA,'ERROR').emit(0xED,0x53).address('END').abs(0xCD,'PARSE8').abs(0xDA,'ERROR').emit(0x32).address('VALUE').abs(0xCD,'VALIDATE_RANGE').abs(0xDA,'ERROR').emit(0xAF,0x32).address('FOUND').emit(0x2A).address('ADDR');
  a.label('SEARCH_LOOP').emit(0x3A).address('VALUE').emit(0xBE).rel(0x20,'SEARCH_CHECK_END').emit(0x7C,0x57,0x7D,0x5F).abs(0xCD,'PRINT_DE_HEX').abs(0xCD,'CRLF').emit(0x3E,1,0x32).address('FOUND');
  a.label('SEARCH_CHECK_END').emit(0xED,0x5B).address('END').emit(0x7C,0xBA).rel(0x20,'SEARCH_NEXT').emit(0x7D,0xBB).rel(0x28,'SEARCH_DONE');
  a.label('SEARCH_NEXT').emit(0x23).rel(0x18,'SEARCH_LOOP');
  a.label('SEARCH_DONE').emit(0x3A).address('FOUND').emit(0xB7).rel(0x20,'SEARCH_RETURN').abs(0x11,'NOT_FOUND').emit(0x0E,0x09,0xCD,0x05,0x00);
  a.label('SEARCH_RETURN').abs(0xC3,'LOOP');

  // G aaaa: jump to address. The target owns control from this point.
  a.label('CMD_GO').abs(0xCD,'PARSE16').abs(0xDA,'ERROR').emit(0xEB,0xE9);

  a.label('ERROR').abs(0x11,'BAD').emit(0x0E,0x09,0xCD,0x05,0x00).abs(0xC3,'LOOP');
  a.label('OK').abs(0x11,'OK_TEXT').emit(0x0E,0x09,0xCD,0x05,0x00,0xC9);
  a.label('BANNER').abs(0x11,'HELP').emit(0x0E,0x09,0xCD,0x05,0x00,0xC9);

  // Parse four or two hexadecimal digits at HL, skipping ASCII spaces.
  a.label('SKIP_SPACE').emit(0x7E,0xFE,0x20).rel(0x20,'SKIP_DONE').emit(0x23).rel(0x18,'SKIP_SPACE').label('SKIP_DONE').emit(0xC9);
  a.label('PARSE16').abs(0xCD,'SKIP_SPACE').emit(0x11,0x00,0x00,0x06,0x04).rel(0x18,'PARSE_LOOP');
  a.label('PARSE8').abs(0xCD,'SKIP_SPACE').emit(0x11,0x00,0x00,0x06,0x02);
  a.label('PARSE_LOOP').emit(0x7E).abs(0xCD,'HEX_NIBBLE').emit(0xD8,0x4F,0xCB,0x23,0xCB,0x12,0xCB,0x23,0xCB,0x12,0xCB,0x23,0xCB,0x12,0xCB,0x23,0xCB,0x12,0x7B,0xB1,0x5F,0x23).rel(0x10,'PARSE_LOOP').emit(0x7B,0xB7,0xC9);
  a.label('HEX_NIBBLE').emit(0xFE,0x30).rel(0x38,'HEX_BAD').emit(0xFE,0x3A).rel(0x38,'HEX_DIGIT').emit(0xE6,0xDF,0xFE,0x41).rel(0x38,'HEX_BAD').emit(0xFE,0x47).rel(0x30,'HEX_BAD').emit(0xD6,0x37,0xB7,0xC9).label('HEX_DIGIT').emit(0xD6,0x30,0xB7,0xC9).label('HEX_BAD').emit(0x37,0xC9);
  a.label('VALIDATE_RANGE').emit(0x2A).address('END').emit(0xED,0x5B).address('ADDR').emit(0xB7,0xED,0x52,0xC9);

  addPutc(a);
  a.label('CRLF').emit(0x3E,0x0D).abs(0xCD,'PUTC').emit(0x3E,0x0A).abs(0xCD,'PUTC').emit(0xC9);
  a.label('PRINT_DE_HEX').emit(0x7A).abs(0xCD,'PRINT_HEX8').emit(0x7B).abs(0xCD,'PRINT_HEX8').emit(0xC9);
  a.label('PRINT_HEX8').emit(0xF5,0x0F,0x0F,0x0F,0x0F,0xE6,0x0F).abs(0xCD,'PRINT_NIBBLE').emit(0xF1,0xE6,0x0F).abs(0xCD,'PRINT_NIBBLE').emit(0xC9);
  a.label('PRINT_NIBBLE').emit(0xFE,0x0A).rel(0x38,'NIBBLE_DIGIT').emit(0xC6,0x37).rel(0x18,'NIBBLE_OUT').label('NIBBLE_DIGIT').emit(0xC6,0x30).label('NIBBLE_OUT').abs(0xC3,'PUTC');

  a.label('PROMPT').text('\r\nMONX> $');
  a.label('HELP').text('\r\nMONX 1.0 - SHINO-80 EXTENDED MONITOR\r\nH HELP   D aaaa        DUMP 128 BYTES\r\nE aaaa dd             EDIT BYTE\r\nF aaaa bbbb dd        FILL INCLUSIVE\r\nM aaaa bbbb cccc      MOVE FORWARD\r\nS aaaa bbbb dd        SEARCH BYTE\r\nG aaaa                GO / EXECUTE\r\nC CLEAR  Q QUIT\r\nHEX MUST USE EXACTLY 4/2 DIGITS.$');
  a.label('BAD').text('\r\n? SYNTAX OR RANGE$');
  a.label('OK_TEXT').text('\r\nOK$');
  a.label('NOT_FOUND').text('NOT FOUND\r\n$');
  a.label('BYE').text('\r\nRETURN TO CP/M\r\n$');
  a.label('BUFFER').emit(63).label('COUNT').emit(0).label('INPUT');for(let i=0;i<64;i++)a.emit(0);
  for(const name of ['ADDR','END','DEST'])a.label(name).emit(0,0);
  for(const name of ['VALUE','LINES','ITEMS','FOUND'])a.label(name).emit(0);
  return a.resolve();
}

function buildBeep(){
  const a=new Asm();
  a.emit(0x06,3).label('BEEP_LOOP').emit(0x3E,0x07,0xD3,0x40,0xC5,0x06,90);
  a.label('WAIT_OUT').emit(0x0E,0).label('WAIT_IN').emit(0x0D).rel(0x20,'WAIT_IN').rel(0x10,'WAIT_OUT').emit(0xC1).rel(0x10,'BEEP_LOOP').emit(0xC9);
  return a.resolve();
}

const balls=buildBalls(),monx=buildMonx(),beep=buildBeep();
const about=buildPrintCom('SHINO-80 DEMO DISK 1.0\r\nBALLS  MULTI-BALL ANIMATION (C STOPS)\r\nMONX   EXTENDED MEMORY MONITOR\r\nBEEP   THREE SHORT BEEPS\r\nTYPE README.TXT FOR DETAILS\r\n');
const readme=[
  'SHINO-80 DEMO DISK 1.0 / CLASSIC / DRIVE B:',
  '',
  'COMMANDS:',
  '  BALLS    SIX BOUNCING BALLS. PRESS C TO STOP.',
  '  MONX     EXTENDED INTERACTIVE MEMORY MONITOR.',
  '  BEEP     THREE SHORT BEEPS.',
  '  ABOUT    THIS DISK SUMMARY.',
  '',
  'MONX COMMANDS (HEX):',
  '  D aaaa              DUMP 128 BYTES',
  '  E aaaa dd           EDIT ONE BYTE',
  '  F aaaa bbbb dd      FILL INCLUSIVE RANGE',
  '  M aaaa bbbb cccc    MOVE RANGE FORWARD',
  '  S aaaa bbbb dd      SEARCH BYTE',
  '  G aaaa              GO / EXECUTE ADDRESS',
  '  C                   CLEAR SCREEN',
  '  H                   HELP',
  '  Q                   RETURN TO CP/M',
  '',
  'WARNING: E/F/M/G CAN CHANGE LIVE RAM. POWER OR RESET RECOVERS.',
  'BALLS USES SHINO-80 VRAM AND KEYBOARD PORTS DIRECTLY.',
  'C CLEARS THE SCREEN AND RETURNS TO THE CURRENT CP/M DRIVE.',
  '',
  'INSTALL: POWER OFF, SELECT VIRTUAL DISK B, IMPORT THIS .S80D,',
  'POWER ON, THEN ENTER B: AND DIR.',
  ''
].join('\r\n')+'\x1A';
const ballSource=`; BALLS.COM summary source (Z80, ORG 0100H)\r\n; Clears VRAM C000H-C7CFH, animates six glyphs, polls ports 21H/20H.\r\n; Press C: clear VRAM, restore the CBIOS cursor, and re-enter CCP.\r\n; The shipped COM is generated from the exact byte builder used for this disk.\r\n\x1A`;
const monSource=`; MONX.COM command contract (Z80, ORG 0100H)\r\n; Uses CP/M BDOS 0005H functions 02H, 09H and 0AH.\r\n; D dump, E edit, F fill, M move, S search, G go, C clear, H help, Q quit.\r\n; The shipped COM is generated from the exact byte builder used for this disk.\r\n\x1A`;
const files=[
  {name:'README.TXT',bytes:readme,padding:0x1A},
  {name:'BALLS.COM',bytes:balls,padding:0x1A},
  {name:'MONX.COM',bytes:monx,padding:0x1A},
  {name:'BEEP.COM',bytes:beep,padding:0x1A},
  {name:'ABOUT.COM',bytes:about,padding:0x1A},
  {name:'BALLS.ASM',bytes:ballSource,padding:0x1A},
  {name:'MONX.ASM',bytes:monSource,padding:0x1A}
];
const blank=createBlankBlockImage();
const packed=cpm.buildFilesystem(blank,files);
const output=path.resolve(process.argv[2]||path.join(__dirname,'SHINO80_DEMOS_CLASSIC_256K.s80d'));
fs.writeFileSync(output,packed.image);
const manifest={output,profile:'CLASSIC',imageBytes:packed.image.length,programBytes:{balls:balls.length,monx:monx.length,beep:beep.length,about:about.length},files:packed.files};
process.stdout.write(JSON.stringify(manifest,null,2)+'\n');
