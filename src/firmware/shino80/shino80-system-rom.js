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
  const VRAM_PAGES=8;

  const lo=v=>v&0xFF,hi=v=>(v>>8)&0xFF;

  function buildSystemRom(){
    const program=[];
    let textChars=0;
    const emit=(...bytes)=>program.push(...bytes.map(v=>v&0xFF));
    const ldSp=nn=>emit(0x31,lo(nn),hi(nn));
    const ldA=n=>emit(0x3E,n&0xFF);
    const ldHL=nn=>emit(0x21,lo(nn),hi(nn));
    const ldB=n=>emit(0x06,n&0xFF);
    const putAAt=address=>emit(0x32,lo(address),hi(address));
    const putAt=(address,code)=>{ldA(code);putAAt(address);};
    const writeText=(row,col,text)=>{
      let address=TEXT_VRAM_BASE+row*TEXT_COLS+col;
      for(const ch of text){putAt(address++,ch.charCodeAt(0));textChars++;}
    };
    const patchRelative=(operandIndex,target)=>{
      const after=operandIndex+1;
      program[operandIndex]=(target-after)&0xFF;
    };

    // RESET / IPL entry.
    ldSp(0xF000);

    // DISPLAY / VRAM TEST:
    // each 256-byte VRAM page is filled with A..H.
    ldA('A'.charCodeAt(0));
    ldHL(TEXT_VRAM_BASE);
    ldB(VRAM_PAGES);
    const testLoop=program.length;
    emit(0x77);       // LD (HL),A
    emit(0x2C);       // INC L
    emit(0x20,0x00);  // JR NZ,testLoop
    const testJrNz=program.length-1;
    emit(0x24);       // INC H
    emit(0x3C);       // INC A
    emit(0x10,0x00);  // DJNZ testLoop
    const testDjnz=program.length-1;
    patchRelative(testJrNz,testLoop);
    patchRelative(testDjnz,testLoop);
    const testDone=program.length;

    // Short machine-side diagnostic hold. In VISUAL observer pace this loop
    // is intentionally shown slowly enough to inspect the full CRT.
    ldB(0x00);
    const testHoldLoop=program.length;
    emit(0x10,0xFE);  // DJNZ self, 256 iterations from B=00h
    const testHoldDone=program.length;

    // IPL clears C000h-C7FFh itself after the display test.
    ldA(0x00);
    ldHL(TEXT_VRAM_BASE);
    ldB(VRAM_PAGES);
    const clearLoop=program.length;
    emit(0x77);       // LD (HL),A
    emit(0x2C);       // INC L
    emit(0x20,0x00);  // JR NZ,clearLoop
    const clearJrNz=program.length-1;
    emit(0x24);       // INC H
    emit(0x10,0x00);  // DJNZ clearLoop
    const clearDjnz=program.length-1;
    patchRelative(clearJrNz,clearLoop);
    patchRelative(clearDjnz,clearLoop);
    const clearDone=program.length;

    writeText(0,0,'SHINO-80 IPL');
    writeText(1,0,'VIDEO OK');
    writeText(2,0,'MON');
    writeText(3,0,'*');

    const monitorLoop=program.length;
    emit(0xC3,lo(monitorLoop),hi(monitorLoop)); // JP monitorLoop

    const bytes=new Uint8Array(ROM_SIZE);
    bytes.fill(0xFF);
    bytes.set(program,0);

    const testPageInstructions=(256*3)+3;
    const clearPageInstructions=(256*3)+2;
    const testInstructions=VRAM_PAGES*testPageInstructions;
    const holdInstructions=1+256; // LD B,00h + 256 DJNZ
    const clearInstructions=3+(VRAM_PAGES*clearPageInstructions);
    const instructionsBeforeLoop=4+testInstructions+holdInstructions+clearInstructions+(textChars*2);

    return {
      bytes,
      labels:Object.freeze({
        RESET:0x0000,
        VRAM_TEST_LOOP:testLoop,
        VRAM_TEST_DONE:testDone,
        VRAM_TEST_HOLD_LOOP:testHoldLoop,
        VRAM_TEST_HOLD_DONE:testHoldDone,
        VRAM_CLEAR_LOOP:clearLoop,
        VRAM_CLEAR_DONE:clearDone,
        MONITOR_LOOP:monitorLoop
      }),
      meta:Object.freeze({
        romSize:ROM_SIZE,
        textVramBase:TEXT_VRAM_BASE,
        textCols:TEXT_COLS,
        textRows:TEXT_ROWS,
        vramBytes:VRAM_PAGES*256,
        testPageInstructions,
        clearPageInstructions,
        textChars,
        instructionsBeforeLoop
      })
    };
  }

  return {ROM_SIZE,TEXT_VRAM_BASE,TEXT_COLS,TEXT_ROWS,VRAM_PAGES,buildSystemRom};
});