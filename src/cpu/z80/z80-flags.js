(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_Z80_FLAGS=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const FLAG_BITS=Object.freeze({S:7,Z:6,Y:5,H:4,X:3,PV:2,N:1,C:0});
  const FLAG_MASK=Object.freeze({
    S:0x80,Z:0x40,Y:0x20,H:0x10,X:0x08,PV:0x04,N:0x02,C:0x01
  });

  function flagState(f){
    const v=Number(f)&0xFF;
    return Object.fromEntries(Object.entries(FLAG_BITS).map(([name,bit])=>[name,!!(v&(1<<bit))]));
  }

  // PHASE 1B policy:
  // - implement documented INC/DEC flags exactly
  // - preserve C because Zilog documents C as unaffected
  // - preserve undocumented Y/X until their real behavior is researched separately
  function preservedUnaffected(oldF){
    return Number(oldF)&(FLAG_MASK.C|FLAG_MASK.Y|FLAG_MASK.X);
  }

  function inc8(oldF,value){
    const before=Number(value)&0xFF;
    const result=(before+1)&0xFF;
    let f=preservedUnaffected(oldF);
    if(result&0x80)f|=FLAG_MASK.S;
    if(result===0)f|=FLAG_MASK.Z;
    if((before&0x0F)===0x0F)f|=FLAG_MASK.H;
    if(before===0x7F)f|=FLAG_MASK.PV;
    // N is reset for INC.
    return {result,f};
  }

  function dec8(oldF,value){
    const before=Number(value)&0xFF;
    const result=(before-1)&0xFF;
    let f=preservedUnaffected(oldF)|FLAG_MASK.N;
    if(result&0x80)f|=FLAG_MASK.S;
    if(result===0)f|=FLAG_MASK.Z;
    if((before&0x0F)===0x00)f|=FLAG_MASK.H;
    if(before===0x80)f|=FLAG_MASK.PV;
    return {result,f};
  }

  return {FLAG_BITS,FLAG_MASK,flagState,inc8,dec8};
});