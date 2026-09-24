(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_SYSTEM_ROM=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const ROM_SIZE=0x2000;
  const TEXT_VRAM_BASE=0xC000;
  const TEXT_COLS=80;

  const lo=v=>v&0xFF,hi=v=>(v>>8)&0xFF;

  function buildSystemRom(){
    const program=[];
    const emit=(...bytes)=>program.push(...bytes.map(v=>v&0xFF));
    const ldSp=nn=>emit(0x31,lo(nn),hi(nn));
    const putAt=(address,code)=>{
      emit(0x3E,code&0xFF);       // LD A,n
      emit(0x32,lo(address),hi(address)); // LD (nn),A
    };
    const writeText=(row,col,text)=>{
      let address=TEXT_VRAM_BASE+row*TEXT_COLS+col;
      for(const ch of text)putAt(address++,ch.charCodeAt(0));
    };

    ldSp(0xF000);
    writeText(0,0,'SHINO-80 IPL');
    writeText(1,0,'VIDEO OK');
    writeText(2,0,'MON');
    writeText(3,0,'*');

    const monitorLoop=program.length;
    emit(0xC3,lo(monitorLoop),hi(monitorLoop)); // JP monitorLoop

    const bytes=new Uint8Array(ROM_SIZE);
    bytes.fill(0xFF);
    bytes.set(program,0);

    return {
      bytes,
      labels:Object.freeze({RESET:0x0000,MONITOR_LOOP:monitorLoop}),
      meta:Object.freeze({
        romSize:ROM_SIZE,
        textVramBase:TEXT_VRAM_BASE,
        textCols:TEXT_COLS,
        textRows:25,
        instructionsBeforeLoop:1+(12+8+3+1)*2
      })
    };
  }

  return {ROM_SIZE,TEXT_VRAM_BASE,TEXT_COLS,buildSystemRom};
});