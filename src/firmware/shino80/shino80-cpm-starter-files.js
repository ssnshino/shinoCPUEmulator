(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_CPM_STARTER_FILES=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const CPM_COM_ORIGIN=0x0100;
  const ascii=text=>Uint8Array.from([...text].map(char=>{
    const code=char.charCodeAt(0);if(code>0x7F)throw new RangeError('Starter files must be 7-bit ASCII');return code;
  }));
  const lo=value=>Number(value)&0xFF,hi=value=>(Number(value)>>8)&0xFF;

  function buildPrintCom(message){
    const text=ascii(message),messageAddress=CPM_COM_ORIGIN+9;
    return Uint8Array.from([0x11,lo(messageAddress),hi(messageAddress),0x0E,0x09,0xCD,0x05,0x00,0xC9,...text,0x24]);
  }

  function buildStarterFiles(){
    const welcome=ascii([
      'SHINO-80 CP/M 2.2 STARTER DISK\r\n',
      '\r\n',
      'BUILT-IN CCP COMMANDS:\r\n',
      '  DIR  TYPE  ERA  REN  SAVE  USER\r\n',
      '\r\n',
      'TRY:\r\n',
      '  HELLO\r\n',
      '  S80INFO\r\n',
      '  TYPE WELCOME.TXT\r\n',
      '\r\n',
      'THIS DISK, BIOS AND STARTER FILES ARE ORIGINAL SHINO-80 WORK.\r\n',
      String.fromCharCode(0x1A)
    ].join(''));
    return Object.freeze([
      Object.freeze({name:'WELCOME.TXT',bytes:welcome,padding:0x1A}),
      Object.freeze({name:'HELLO.COM',bytes:buildPrintCom('HELLO FROM SHINO-80!\r\n'),padding:0x1A}),
      Object.freeze({name:'S80INFO.COM',bytes:buildPrintCom('SHINO-80 / CP/M 2.2\r\n44K TPA / 243K A: / CBIOS FA00H\r\n'),padding:0x1A})
    ]);
  }

  return {CPM_COM_ORIGIN,ascii,buildPrintCom,buildStarterFiles};
});
