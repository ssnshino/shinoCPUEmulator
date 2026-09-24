(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_Z80_DECODER=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const REG8_NAMES=Object.freeze(['B','C','D','E','H','L','(HL)','A']);
  const REG8_KEYS=Object.freeze(['b','c','d','e','h','l',null,'a']);
  const REG16_DD_NAMES=Object.freeze(['BC','DE','HL','SP']);

  function decodeBase(opcode){
    const op=Number(opcode)&0xFF;
    if(op===0x00)return {kind:'NOP',family:'CONTROL',mnemonic:'NOP',length:1,tStates:4};

    if((op&0xC0)===0x40){
      if(op===0x76)return {kind:'HALT',family:'CONTROL',mnemonic:'HALT',length:1,tStates:4,implemented:false};
      const dst=(op>>3)&7,src=op&7;
      if(dst===6)return {kind:'LD_MEM_HL_R',family:'LD',srcCode:src,mnemonic:`LD (HL),${REG8_NAMES[src]}`,length:1,tStates:7};
      if(src===6)return {kind:'LD_R_MEM_HL',family:'LD',dstCode:dst,mnemonic:`LD ${REG8_NAMES[dst]},(HL)`,length:1,tStates:7};
      return {kind:'LD_R_R',family:'LD',dstCode:dst,srcCode:src,mnemonic:`LD ${REG8_NAMES[dst]},${REG8_NAMES[src]}`,length:1,tStates:4};
    }

    if((op&0xC7)===0x06){
      const dst=(op>>3)&7;
      if(dst===6)return {kind:'LD_MEM_HL_N',family:'LD',mnemonic:'LD (HL),n',length:2,tStates:10};
      return {kind:'LD_R_N',family:'LD',dstCode:dst,mnemonic:`LD ${REG8_NAMES[dst]},n`,length:2,tStates:7};
    }

    if((op&0xCF)===0x01){
      const pair=(op>>4)&3;
      return {kind:'LD_DD_NN',family:'LD',pairCode:pair,mnemonic:`LD ${REG16_DD_NAMES[pair]},nn`,length:3,tStates:10};
    }

    switch(op){
      case 0x02:return {kind:'LD_MEM_BC_A',family:'LD',mnemonic:'LD (BC),A',length:1,tStates:7};
      case 0x12:return {kind:'LD_MEM_DE_A',family:'LD',mnemonic:'LD (DE),A',length:1,tStates:7};
      case 0x0A:return {kind:'LD_A_MEM_BC',family:'LD',mnemonic:'LD A,(BC)',length:1,tStates:7};
      case 0x1A:return {kind:'LD_A_MEM_DE',family:'LD',mnemonic:'LD A,(DE)',length:1,tStates:7};
      case 0x32:return {kind:'LD_MEM_NN_A',family:'LD',mnemonic:'LD (nn),A',length:3,tStates:13};
      case 0x3A:return {kind:'LD_A_MEM_NN',family:'LD',mnemonic:'LD A,(nn)',length:3,tStates:13};
      default:return null;
    }
  }

  return {decodeBase,REG8_NAMES,REG8_KEYS,REG16_DD_NAMES};
});