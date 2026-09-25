(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_Z80_DECODER=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const REG8_NAMES=Object.freeze(['B','C','D','E','H','L','(HL)','A']);
  const REG8_KEYS=Object.freeze(['b','c','d','e','h','l',null,'a']);
  const REG16_DD_NAMES=Object.freeze(['BC','DE','HL','SP']);
  const REG16_QQ_NAMES=Object.freeze(['BC','DE','HL','AF']);
  const COND_NAMES=Object.freeze(['NZ','Z','NC','C','PO','PE','P','M']);
  const ALU_NAMES=Object.freeze(['ADD A,','ADC A,','SUB ','SBC A,','AND ','XOR ','OR ','CP ']);

  function decodeBase(opcode){
    const op=Number(opcode)&0xFF;

    switch(op){
      case 0xCB:return {kind:'PREFIX',family:'PREFIX',prefix:'CB',mnemonic:'PREFIX CB',length:1,tStates:4};
      case 0xDD:return {kind:'PREFIX',family:'PREFIX',prefix:'DD',mnemonic:'PREFIX DD',length:1,tStates:4};
      case 0xED:return {kind:'PREFIX',family:'PREFIX',prefix:'ED',mnemonic:'PREFIX ED',length:1,tStates:4};
      case 0xFD:return {kind:'PREFIX',family:'PREFIX',prefix:'FD',mnemonic:'PREFIX FD',length:1,tStates:4};
      case 0x00:return {kind:'NOP',family:'CONTROL',mnemonic:'NOP',length:1,tStates:4};
      case 0x07:return {kind:'ROT_A',family:'ROTATE',rotate:'RLCA',mnemonic:'RLCA',length:1,tStates:4};
      case 0x08:return {kind:'EX_AF_ALT',family:'EXCHANGE',mnemonic:"EX AF,AF'",length:1,tStates:4};
      case 0x0F:return {kind:'ROT_A',family:'ROTATE',rotate:'RRCA',mnemonic:'RRCA',length:1,tStates:4};
      case 0x17:return {kind:'ROT_A',family:'ROTATE',rotate:'RLA',mnemonic:'RLA',length:1,tStates:4};
      case 0x1F:return {kind:'ROT_A',family:'ROTATE',rotate:'RRA',mnemonic:'RRA',length:1,tStates:4};
      case 0x22:return {kind:'LD_MEM_NN_HL',family:'LD',mnemonic:'LD (nn),HL',length:3,tStates:16};
      case 0x27:return {kind:'DAA',family:'ALU',mnemonic:'DAA',length:1,tStates:4};
      case 0x2A:return {kind:'LD_HL_MEM_NN',family:'LD',mnemonic:'LD HL,(nn)',length:3,tStates:16};
      case 0x2F:return {kind:'CPL',family:'ALU',mnemonic:'CPL',length:1,tStates:4};
      case 0x37:return {kind:'SCF',family:'ALU',mnemonic:'SCF',length:1,tStates:4};
      case 0x3F:return {kind:'CCF',family:'ALU',mnemonic:'CCF',length:1,tStates:4};

      case 0x10:return {kind:'DJNZ_E',family:'CONTROL_FLOW',condition:'B!=0',mnemonic:'DJNZ e',length:2,tStatesTaken:13,tStatesNotTaken:8};
      case 0x18:return {kind:'JR_E',family:'CONTROL_FLOW',mnemonic:'JR e',length:2,tStates:12};
      case 0x20:return {kind:'JR_CC_E',family:'CONTROL_FLOW',condition:'NZ',mnemonic:'JR NZ,e',length:2,tStatesTaken:12,tStatesNotTaken:7};
      case 0x28:return {kind:'JR_CC_E',family:'CONTROL_FLOW',condition:'Z',mnemonic:'JR Z,e',length:2,tStatesTaken:12,tStatesNotTaken:7};
      case 0x30:return {kind:'JR_CC_E',family:'CONTROL_FLOW',condition:'NC',mnemonic:'JR NC,e',length:2,tStatesTaken:12,tStatesNotTaken:7};
      case 0x38:return {kind:'JR_CC_E',family:'CONTROL_FLOW',condition:'C',mnemonic:'JR C,e',length:2,tStatesTaken:12,tStatesNotTaken:7};

      case 0x76:return {kind:'HALT',family:'CONTROL',mnemonic:'HALT',length:1,tStates:4};
      case 0xC3:return {kind:'JP_NN',family:'CONTROL_FLOW',mnemonic:'JP nn',length:3,tStates:10};
      case 0xC9:return {kind:'RET',family:'STACK_FLOW',mnemonic:'RET',length:1,tStates:10};
      case 0xCD:return {kind:'CALL_NN',family:'STACK_FLOW',mnemonic:'CALL nn',length:3,tStates:17};
      case 0xD3:return {kind:'OUT_N_A',family:'IO',mnemonic:'OUT (n),A',length:2,tStates:11};
      case 0xD9:return {kind:'EXX',family:'EXCHANGE',mnemonic:'EXX',length:1,tStates:4};
      case 0xDB:return {kind:'IN_A_N',family:'IO',mnemonic:'IN A,(n)',length:2,tStates:11};
      case 0xE3:return {kind:'EX_SP_HL',family:'EXCHANGE',mnemonic:'EX (SP),HL',length:1,tStates:19};
      case 0xE9:return {kind:'JP_HL',family:'CONTROL_FLOW',mnemonic:'JP (HL)',length:1,tStates:4};
      case 0xEB:return {kind:'EX_DE_HL',family:'EXCHANGE',mnemonic:'EX DE,HL',length:1,tStates:4};
      case 0xF3:return {kind:'DI',family:'INTERRUPT_CONTROL',mnemonic:'DI',length:1,tStates:4};
      case 0xF9:return {kind:'LD_SP_HL',family:'LD',mnemonic:'LD SP,HL',length:1,tStates:6};
      case 0xFB:return {kind:'EI',family:'INTERRUPT_CONTROL',mnemonic:'EI',length:1,tStates:4};
    }

    if((op&0xC7)===0x04){
      const target=(op>>3)&7;
      if(target===6)return {kind:'INC_MEM_HL',family:'INC_DEC',mnemonic:'INC (HL)',length:1,tStates:11};
      return {kind:'INC_R',family:'INC_DEC',targetCode:target,mnemonic:`INC ${REG8_NAMES[target]}`,length:1,tStates:4};
    }
    if((op&0xC7)===0x05){
      const target=(op>>3)&7;
      if(target===6)return {kind:'DEC_MEM_HL',family:'INC_DEC',mnemonic:'DEC (HL)',length:1,tStates:11};
      return {kind:'DEC_R',family:'INC_DEC',targetCode:target,mnemonic:`DEC ${REG8_NAMES[target]}`,length:1,tStates:4};
    }
    if((op&0xCF)===0x03){
      const pair=(op>>4)&3;
      return {kind:'INC_DD',family:'INC_DEC_16',pairCode:pair,mnemonic:`INC ${REG16_DD_NAMES[pair]}`,length:1,tStates:6};
    }
    if((op&0xCF)===0x0B){
      const pair=(op>>4)&3;
      return {kind:'DEC_DD',family:'INC_DEC_16',pairCode:pair,mnemonic:`DEC ${REG16_DD_NAMES[pair]}`,length:1,tStates:6};
    }
    if((op&0xCF)===0x09){
      const pair=(op>>4)&3;
      return {kind:'ADD_HL_DD',family:'ALU_16',pairCode:pair,mnemonic:`ADD HL,${REG16_DD_NAMES[pair]}`,length:1,tStates:11};
    }

    if((op&0xC0)===0x40){
      const dst=(op>>3)&7,src=op&7;
      if(dst===6)return {kind:'LD_MEM_HL_R',family:'LD',srcCode:src,mnemonic:`LD (HL),${REG8_NAMES[src]}`,length:1,tStates:7};
      if(src===6)return {kind:'LD_R_MEM_HL',family:'LD',dstCode:dst,mnemonic:`LD ${REG8_NAMES[dst]},(HL)`,length:1,tStates:7};
      return {kind:'LD_R_R',family:'LD',dstCode:dst,srcCode:src,mnemonic:`LD ${REG8_NAMES[dst]},${REG8_NAMES[src]}`,length:1,tStates:4};
    }

    if((op&0xC7)===0x06 && op<0x40){
      const dst=(op>>3)&7;
      if(dst===6)return {kind:'LD_MEM_HL_N',family:'LD',mnemonic:'LD (HL),n',length:2,tStates:10};
      return {kind:'LD_R_N',family:'LD',dstCode:dst,mnemonic:`LD ${REG8_NAMES[dst]},n`,length:2,tStates:7};
    }
    if((op&0xCF)===0x01 && op<0x40){
      const pair=(op>>4)&3;
      return {kind:'LD_DD_NN',family:'LD',pairCode:pair,mnemonic:`LD ${REG16_DD_NAMES[pair]},nn`,length:3,tStates:10};
    }

    if(op>=0x80&&op<=0xBF){
      const alu=(op>>3)&7,src=op&7;
      return {kind:'ALU_R',family:'ALU',aluCode:alu,srcCode:src,mnemonic:`${ALU_NAMES[alu]}${REG8_NAMES[src]}`,length:1,tStates:src===6?7:4};
    }

    if((op&0xC7)===0xC6){
      const alu=(op>>3)&7;
      return {kind:'ALU_N',family:'ALU',aluCode:alu,mnemonic:`${ALU_NAMES[alu]}n`,length:2,tStates:7};
    }

    if((op&0xC7)===0xC0){
      const cond=(op>>3)&7;
      return {kind:'RET_CC',family:'STACK_FLOW',condition:COND_NAMES[cond],mnemonic:`RET ${COND_NAMES[cond]}`,length:1,tStatesTaken:11,tStatesNotTaken:5};
    }
    if((op&0xC7)===0xC2){
      const cond=(op>>3)&7;
      return {kind:'JP_CC_NN',family:'CONTROL_FLOW',condition:COND_NAMES[cond],mnemonic:`JP ${COND_NAMES[cond]},nn`,length:3,tStates:10};
    }
    if((op&0xC7)===0xC4){
      const cond=(op>>3)&7;
      return {kind:'CALL_CC_NN',family:'STACK_FLOW',condition:COND_NAMES[cond],mnemonic:`CALL ${COND_NAMES[cond]},nn`,length:3,tStatesTaken:17,tStatesNotTaken:10};
    }
    if((op&0xC7)===0xC7){
      const vector=op&0x38;
      return {kind:'RST',family:'STACK_FLOW',vector,mnemonic:`RST ${vector.toString(16).toUpperCase().padStart(2,'0')}h`,length:1,tStates:11};
    }
    if((op&0xCF)===0xC1){
      const pair=(op>>4)&3;
      return {kind:'POP_QQ',family:'STACK',pairCode:pair,mnemonic:`POP ${REG16_QQ_NAMES[pair]}`,length:1,tStates:10};
    }
    if((op&0xCF)===0xC5){
      const pair=(op>>4)&3;
      return {kind:'PUSH_QQ',family:'STACK',pairCode:pair,mnemonic:`PUSH ${REG16_QQ_NAMES[pair]}`,length:1,tStates:11};
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

  return {
    decodeBase,
    REG8_NAMES,REG8_KEYS,
    REG16_DD_NAMES,REG16_QQ_NAMES,
    COND_NAMES,ALU_NAMES
  };
});