(function(root,factory){
  const busApi=(typeof module==='object'&&module.exports)?require('../../machine/shino80/shino80-bus.js'):root.SHINO_BUS;
  const decoderApi=(typeof module==='object'&&module.exports)?require('./z80-decoder.js'):root.SHINO_Z80_DECODER;
  const flagsApi=(typeof module==='object'&&module.exports)?require('./z80-flags.js'):root.SHINO_Z80_FLAGS;
  const api=factory(busApi,decoderApi,flagsApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_Z80=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(busApi,decoderApi,flagsApi){
  'use strict';
  if(!busApi||!busApi.Shino80Bus)throw new Error('SHINO Z80 CORE: bus API missing');
  if(!decoderApi||!decoderApi.decodeBase)throw new Error('SHINO Z80 CORE: decoder API missing');
  if(!flagsApi||!flagsApi.inc8||!flagsApi.dec8)throw new Error('SHINO Z80 CORE: flags API missing');

  const {decodeBase,REG8_KEYS}=decoderApi;
  const {FLAG_BITS,FLAG_MASK,flagState,inc8,dec8}=flagsApi;
  const hex=(value,width)=>((Number(value)>>>0).toString(16).toUpperCase().padStart(width,'0'));
  const signed8=value=>{const v=Number(value)&0xFF;return v<0x80?v:v-0x100;};
  const signedText=value=>{const n=signed8(value);return n>=0?`+${n}`:`${n}`;};

  function coldState(){
    return {
      a:0,f:0,b:0,c:0,d:0,e:0,h:0,l:0,
      aAlt:0,fAlt:0,bAlt:0,cAlt:0,dAlt:0,eAlt:0,hAlt:0,lAlt:0,
      ix:0,iy:0,sp:0,pc:0,i:0,r:0,
      iff1:false,iff2:false,im:0,halted:false,
      intLine:false,nmiLine:false,waitLine:false,
      tStates:0,instructions:0
    };
  }

  class Z80Core{
    constructor(bus){
      if(!(bus instanceof busApi.Shino80Bus))throw new TypeError('Z80Core requires Shino80Bus');
      this.bus=bus;this.state=coldState();this.lastInstruction=null;
    }
    reset(){
      const s=this.state;
      s.pc=0;s.i=0;s.r=0;s.iff1=false;s.iff2=false;s.im=0;s.halted=false;
      s.intLine=false;s.nmiLine=false;s.waitLine=false;s.tStates=0;s.instructions=0;
      this.lastInstruction=null;this.bus.clearTrace();
      this.bus.emit({tState:0,actor:'BENCH',space:'CONTROL',operation:'RESET',address:null,data:null,purpose:'CPU_RESET',signals:['RESET'],meta:{precision:'FUNCTIONAL'}});
      return this.snapshot();
    }
    incrementR(){const s=this.state;s.r=(s.r&0x80)|(((s.r&0x7F)+1)&0x7F);return s.r;}
    fetchOpcode(){
      const s=this.state,address=s.pc&0xFFFF;
      const opcode=this.bus.cpuRead(address,{tState:s.tStates,purpose:'OPCODE_FETCH',signals:['M1','MREQ','RD'],meta:{precision:'M_CYCLE_ABSTRACT'}});
      s.pc=(s.pc+1)&0xFFFF;this.incrementR();
      this.bus.emitRefresh({tState:s.tStates+2,i:s.i,r:s.r});
      return {address,opcode};
    }
    fetchOperandByte(ctx,offsetT=4){
      const s=this.state,address=s.pc&0xFFFF;
      const value=this.bus.cpuRead(address,{tState:ctx.startTState+offsetT,purpose:'OPERAND_READ',signals:['MREQ','RD'],meta:{precision:'M_CYCLE_ABSTRACT'}});
      s.pc=(s.pc+1)&0xFFFF;ctx.bytes.push(value);return value;
    }
    fetchOperandWord(ctx,lowOffset=4){const lo=this.fetchOperandByte(ctx,lowOffset),hi=this.fetchOperandByte(ctx,lowOffset+3);return lo|(hi<<8);}
    readData(address,ctx,offsetT,purpose='DATA_READ'){return this.bus.cpuRead(address,{tState:ctx.startTState+offsetT,purpose,signals:['MREQ','RD'],meta:{precision:'M_CYCLE_ABSTRACT'}});}
    writeData(address,value,ctx,offsetT,purpose='DATA_WRITE'){return this.bus.cpuWrite(address,value,{tState:ctx.startTState+offsetT,purpose,signals:['MREQ','WR'],meta:{precision:'M_CYCLE_ABSTRACT'}});}
    getReg8(code){const key=REG8_KEYS[code&7];if(!key)throw new Error('Register code 6 is memory (HL), not an 8-bit register');return this.state[key]&0xFF;}
    setReg8(code,value){const key=REG8_KEYS[code&7];if(!key)throw new Error('Register code 6 is memory (HL), not an 8-bit register');this.state[key]=Number(value)&0xFF;}
    getPair16(code){const s=this.state;switch(code&3){case 0:return ((s.b<<8)|s.c)&0xFFFF;case 1:return ((s.d<<8)|s.e)&0xFFFF;case 2:return ((s.h<<8)|s.l)&0xFFFF;case 3:return s.sp&0xFFFF;}}
    setPair16(code,value){const s=this.state,v=Number(value)&0xFFFF;switch(code&3){case 0:s.b=(v>>8)&0xFF;s.c=v&0xFF;break;case 1:s.d=(v>>8)&0xFF;s.e=v&0xFF;break;case 2:s.h=(v>>8)&0xFF;s.l=v&0xFF;break;case 3:s.sp=v;break;}}
    getHL(){return ((this.state.h<<8)|this.state.l)&0xFFFF;}
    getBC(){return ((this.state.b<<8)|this.state.c)&0xFFFF;}
    getDE(){return ((this.state.d<<8)|this.state.e)&0xFFFF;}
    pushWord(value,ctx,firstWriteOffset=11){
      const s=this.state,v=Number(value)&0xFFFF;
      const hi=(v>>8)&0xFF,lo=v&0xFF;
      s.sp=(s.sp-1)&0xFFFF;
      this.writeData(s.sp,hi,ctx,firstWriteOffset,'STACK_WRITE');
      s.sp=(s.sp-1)&0xFFFF;
      this.writeData(s.sp,lo,ctx,firstWriteOffset+3,'STACK_WRITE');
      return s.sp;
    }
    popWord(ctx,firstReadOffset=4){
      const s=this.state;
      const lo=this.readData(s.sp,ctx,firstReadOffset,'STACK_READ');
      s.sp=(s.sp+1)&0xFFFF;
      const hi=this.readData(s.sp,ctx,firstReadOffset+3,'STACK_READ');
      s.sp=(s.sp+1)&0xFFFF;
      return lo|(hi<<8);
    }
    conditionTrue(condition){
      const f=this.state.f&0xFF;
      switch(condition){
        case 'NZ':return !(f&FLAG_MASK.Z);
        case 'Z':return !!(f&FLAG_MASK.Z);
        case 'NC':return !(f&FLAG_MASK.C);
        case 'C':return !!(f&FLAG_MASK.C);
        default:throw new Error(`UNKNOWN CONDITION ${condition}`);
      }
    }
    relativeTarget(displacement){return (this.state.pc+signed8(displacement))&0xFFFF;}
    flowResult(mnemonic,tStates,branchTaken,branchTarget,fallThrough,condition=null){
      return {mnemonic,tStates,branchTaken,branchTarget,fallThrough,condition};
    }
    executeDescriptor(desc,ctx){
      const s=this.state;
      switch(desc.kind){
        case 'NOP':return desc.mnemonic;
        case 'CALL_NN':{
          const target=this.fetchOperandWord(ctx,4),returnAddress=s.pc,stackBefore=s.sp;
          this.pushWord(returnAddress,ctx,11);
          const stackAfter=s.sp;
          s.pc=target;
          return {
            mnemonic:`CALL ${hex(target,4)}h`,tStates:desc.tStates,
            branchTaken:true,branchTarget:target,fallThrough:returnAddress,condition:'CALL',
            stackBefore,stackAfter,returnAddress
          };
        }
        case 'RET':{
          const fallThrough=s.pc,stackBefore=s.sp,returnAddress=this.popWord(ctx,4),stackAfter=s.sp;
          s.pc=returnAddress;
          return {
            mnemonic:'RET',tStates:desc.tStates,
            branchTaken:true,branchTarget:returnAddress,fallThrough,condition:'RET',
            stackBefore,stackAfter,returnAddress
          };
        }
        case 'JP_NN':{
          const target=this.fetchOperandWord(ctx,4),fallThrough=s.pc;
          s.pc=target;
          return this.flowResult(`JP ${hex(target,4)}h`,desc.tStates,true,target,fallThrough,'ALWAYS');
        }
        case 'JR_E':{
          const e=this.fetchOperandByte(ctx,4),fallThrough=s.pc,target=this.relativeTarget(e);
          s.pc=target;
          return this.flowResult(`JR ${signedText(e)}`,desc.tStates,true,target,fallThrough,'ALWAYS');
        }
        case 'JR_CC_E':{
          const e=this.fetchOperandByte(ctx,4),fallThrough=s.pc,target=this.relativeTarget(e);
          const taken=this.conditionTrue(desc.condition);
          if(taken)s.pc=target;
          return this.flowResult(`JR ${desc.condition},${signedText(e)}`,taken?desc.tStatesTaken:desc.tStatesNotTaken,taken,target,fallThrough,desc.condition);
        }
        case 'DJNZ_E':{
          const e=this.fetchOperandByte(ctx,5),fallThrough=s.pc,target=this.relativeTarget(e);
          s.b=(s.b-1)&0xFF;
          const taken=s.b!==0;
          if(taken)s.pc=target;
          return this.flowResult(`DJNZ ${signedText(e)}`,taken?desc.tStatesTaken:desc.tStatesNotTaken,taken,target,fallThrough,'B!=0');
        }
        case 'INC_R':{
          const before=this.getReg8(desc.targetCode),next=inc8(s.f,before);
          this.setReg8(desc.targetCode,next.result);s.f=next.f;return desc.mnemonic;
        }
        case 'DEC_R':{
          const before=this.getReg8(desc.targetCode),next=dec8(s.f,before);
          this.setReg8(desc.targetCode,next.result);s.f=next.f;return desc.mnemonic;
        }
        case 'INC_MEM_HL':{
          const address=this.getHL(),before=this.readData(address,ctx,4),next=inc8(s.f,before);
          this.writeData(address,next.result,ctx,8);s.f=next.f;return desc.mnemonic;
        }
        case 'DEC_MEM_HL':{
          const address=this.getHL(),before=this.readData(address,ctx,4),next=dec8(s.f,before);
          this.writeData(address,next.result,ctx,8);s.f=next.f;return desc.mnemonic;
        }
        case 'LD_R_R':this.setReg8(desc.dstCode,this.getReg8(desc.srcCode));return desc.mnemonic;
        case 'LD_R_N':{const n=this.fetchOperandByte(ctx,4);this.setReg8(desc.dstCode,n);return desc.mnemonic.replace('n',`${hex(n,2)}h`);}
        case 'LD_DD_NN':{const nn=this.fetchOperandWord(ctx,4);this.setPair16(desc.pairCode,nn);return desc.mnemonic.replace('nn',`${hex(nn,4)}h`);}
        case 'LD_R_MEM_HL':{const v=this.readData(this.getHL(),ctx,4);this.setReg8(desc.dstCode,v);return desc.mnemonic;}
        case 'LD_MEM_HL_R':this.writeData(this.getHL(),this.getReg8(desc.srcCode),ctx,4);return desc.mnemonic;
        case 'LD_MEM_HL_N':{const n=this.fetchOperandByte(ctx,4);this.writeData(this.getHL(),n,ctx,7);return `LD (HL),${hex(n,2)}h`;}
        case 'LD_A_MEM_BC':s.a=this.readData(this.getBC(),ctx,4);return desc.mnemonic;
        case 'LD_A_MEM_DE':s.a=this.readData(this.getDE(),ctx,4);return desc.mnemonic;
        case 'LD_MEM_BC_A':this.writeData(this.getBC(),s.a,ctx,4);return desc.mnemonic;
        case 'LD_MEM_DE_A':this.writeData(this.getDE(),s.a,ctx,4);return desc.mnemonic;
        case 'LD_A_MEM_NN':{const nn=this.fetchOperandWord(ctx,4);s.a=this.readData(nn,ctx,10);return `LD A,(${hex(nn,4)}h)`;}
        case 'LD_MEM_NN_A':{const nn=this.fetchOperandWord(ctx,4);this.writeData(nn,s.a,ctx,10);return `LD (${hex(nn,4)}h),A`;}
        case 'HALT':throw new Error(`UNIMPLEMENTED HALT OPCODE 76h at ${hex(ctx.address,4)}h`);
        default:throw new Error(`UNIMPLEMENTED DECODE KIND ${desc.kind}`);
      }
    }
    step(){
      const s=this.state;if(s.halted)return {halted:true,tStates:0,mnemonic:'HALT'};
      const startTState=s.tStates,{address,opcode}=this.fetchOpcode(),desc=decodeBase(opcode);
      if(!desc)throw new Error(`UNIMPLEMENTED OPCODE ${hex(opcode,2)}h at ${hex(address,4)}h`);
      const ctx={address,opcode,startTState,bytes:[opcode]},execution=this.executeDescriptor(desc,ctx);
      const detail=typeof execution==='string'?{mnemonic:execution,tStates:desc.tStates}:execution;
      const actualTStates=detail.tStates??desc.tStates;
      if(!Number.isFinite(actualTStates))throw new Error(`MISSING T-STATES FOR ${detail.mnemonic||desc.kind}`);
      s.tStates+=actualTStates;s.instructions+=1;
      this.lastInstruction={
        address,opcode,bytes:[...ctx.bytes],mnemonic:detail.mnemonic,family:desc.family,
        tStates:actualTStates,startTState,endTState:s.tStates,
        branchTaken:detail.branchTaken??null,
        branchTarget:detail.branchTarget??null,
        fallThrough:detail.fallThrough??null,
        condition:detail.condition??null,
        stackBefore:detail.stackBefore??null,
        stackAfter:detail.stackAfter??null,
        returnAddress:detail.returnAddress??null
      };
      return {...this.lastInstruction,bytes:[...this.lastInstruction.bytes]};
    }
    runInstructions(count=1){const n=Math.max(0,Math.floor(Number(count)||0));let result=null;for(let i=0;i<n;i++)result=this.step();return result;}
    snapshot(){return JSON.parse(JSON.stringify(this.state));}
  }

  return {Z80Core,coldState,FLAG_BITS,flagState};
});