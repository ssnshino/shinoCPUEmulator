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
  if(!flagsApi||!flagsApi.inc8||!flagsApi.add8)throw new Error('SHINO Z80 CORE: flags API missing');

  const {decodeBase,decodeCB,decodeED,decodeIndex,REG8_KEYS,ALU_NAMES}=decoderApi;
  const {
    FLAG_BITS,FLAG_MASK,flagState,
    inc8,dec8,add8,sub8,and8,xor8,or8,cp8,
    add16HL,rotateAccumulator,daa8,rotateShift8,bitTest8,
    carryArithmetic16,blockIoFlags,logicFlags
  }=flagsApi;

  const hex=(value,width)=>((Number(value)>>>0).toString(16).toUpperCase().padStart(width,'0'));
  const signed8=value=>{const v=Number(value)&0xFF;return v<0x80?v:v-0x100;};
  const signedText=value=>{const n=signed8(value);return n>=0?`+${n}`:`${n}`;};

  function coldState(){
    return {
      a:0,f:0,b:0,c:0,d:0,e:0,h:0,l:0,
      aAlt:0,fAlt:0,bAlt:0,cAlt:0,dAlt:0,eAlt:0,hAlt:0,lAlt:0,
      ix:0,iy:0,sp:0,pc:0,i:0,r:0,
      iff1:false,iff2:false,im:0,halted:false,eiDelay:0,
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
      s.pc=0;s.i=0;s.r=0;s.iff1=false;s.iff2=false;s.im=0;s.halted=false;s.eiDelay=0;
      s.intLine=false;s.nmiLine=false;s.waitLine=false;s.tStates=0;s.instructions=0;
      this.lastInstruction=null;this.bus.clearTrace();
      this.bus.emit({
        tState:0,actor:'BENCH',space:'CONTROL',operation:'RESET',
        address:null,data:null,purpose:'CPU_RESET',signals:['RESET'],
        meta:{precision:'FUNCTIONAL'}
      });
      return this.snapshot();
    }

    incrementR(){
      const s=this.state;
      s.r=(s.r&0x80)|(((s.r&0x7F)+1)&0x7F);
      return s.r;
    }

    fetchOpcode(offsetT=0){
      const s=this.state,address=s.pc&0xFFFF;
      const opcode=this.bus.cpuRead(address,{
        tState:s.tStates+offsetT,purpose:'OPCODE_FETCH',signals:['M1','MREQ','RD'],
        meta:{precision:'M_CYCLE_ABSTRACT'}
      });
      s.pc=(s.pc+1)&0xFFFF;
      this.incrementR();
      this.bus.emitRefresh({tState:s.tStates+offsetT+2,i:s.i,r:s.r});
      return {address,opcode};
    }

    haltCycle(){
      const s=this.state,address=s.pc&0xFFFF,startTState=s.tStates;
      const data=this.bus.cpuRead(address,{
        tState:startTState,purpose:'HALT_FETCH',signals:['M1','MREQ','RD','HALT'],
        meta:{precision:'M_CYCLE_ABSTRACT',pcIncrement:false}
      });
      this.incrementR();
      this.bus.emitRefresh({tState:startTState+2,i:s.i,r:s.r});
      s.tStates+=4;
      this.lastInstruction={
        address,opcode:0x76,bytes:[0x76],mnemonic:'HALT',family:'CONTROL',
        tStates:4,startTState,endTState:s.tStates,
        branchTaken:null,branchTarget:null,fallThrough:null,condition:null,
        stackBefore:null,stackAfter:null,returnAddress:null,haltCycle:true,data
      };
      return {...this.lastInstruction,bytes:[...this.lastInstruction.bytes]};
    }

    fetchOperandByte(ctx,offsetT=4){
      const s=this.state,address=s.pc&0xFFFF;
      const value=this.bus.cpuRead(address,{
        tState:ctx.startTState+offsetT,purpose:'OPERAND_READ',signals:['MREQ','RD'],
        meta:{precision:'M_CYCLE_ABSTRACT'}
      });
      s.pc=(s.pc+1)&0xFFFF;ctx.bytes.push(value);return value;
    }

    fetchOperandWord(ctx,lowOffset=4){
      const lo=this.fetchOperandByte(ctx,lowOffset);
      const hi=this.fetchOperandByte(ctx,lowOffset+3);
      return lo|(hi<<8);
    }

    readData(address,ctx,offsetT,purpose='DATA_READ'){
      return this.bus.cpuRead(address,{
        tState:ctx.startTState+offsetT,purpose,signals:['MREQ','RD'],
        meta:{precision:'M_CYCLE_ABSTRACT'}
      });
    }

    writeData(address,value,ctx,offsetT,purpose='DATA_WRITE'){
      return this.bus.cpuWrite(address,value,{
        tState:ctx.startTState+offsetT,purpose,signals:['MREQ','WR'],
        meta:{precision:'M_CYCLE_ABSTRACT'}
      });
    }

    readWord(address,ctx,offsetT,purpose='DATA_READ'){
      const addr=Number(address)&0xFFFF;
      const lo=this.readData(addr,ctx,offsetT,purpose);
      const hi=this.readData((addr+1)&0xFFFF,ctx,offsetT+3,purpose);
      return lo|(hi<<8);
    }

    writeWord(address,value,ctx,offsetT,purpose='DATA_WRITE'){
      const addr=Number(address)&0xFFFF,v=Number(value)&0xFFFF;
      this.writeData(addr,v&0xFF,ctx,offsetT,purpose);
      this.writeData((addr+1)&0xFFFF,(v>>8)&0xFF,ctx,offsetT+3,purpose);
    }

    getReg8(code){
      const key=REG8_KEYS[code&7];
      if(!key)throw new Error('Register code 6 is memory (HL), not an 8-bit register');
      return this.state[key]&0xFF;
    }

    setReg8(code,value){
      const key=REG8_KEYS[code&7];
      if(!key)throw new Error('Register code 6 is memory (HL), not an 8-bit register');
      this.state[key]=Number(value)&0xFF;
    }

    getPair16(code){
      const s=this.state;
      switch(code&3){
        case 0:return ((s.b<<8)|s.c)&0xFFFF;
        case 1:return ((s.d<<8)|s.e)&0xFFFF;
        case 2:return ((s.h<<8)|s.l)&0xFFFF;
        case 3:return s.sp&0xFFFF;
      }
    }

    setPair16(code,value){
      const s=this.state,v=Number(value)&0xFFFF;
      switch(code&3){
        case 0:s.b=(v>>8)&0xFF;s.c=v&0xFF;break;
        case 1:s.d=(v>>8)&0xFF;s.e=v&0xFF;break;
        case 2:s.h=(v>>8)&0xFF;s.l=v&0xFF;break;
        case 3:s.sp=v;break;
      }
    }

    getStackPair(code){
      const s=this.state;
      switch(code&3){
        case 0:return ((s.b<<8)|s.c)&0xFFFF;
        case 1:return ((s.d<<8)|s.e)&0xFFFF;
        case 2:return ((s.h<<8)|s.l)&0xFFFF;
        case 3:return ((s.a<<8)|s.f)&0xFFFF;
      }
    }

    setStackPair(code,value){
      const s=this.state,v=Number(value)&0xFFFF;
      switch(code&3){
        case 0:s.b=(v>>8)&0xFF;s.c=v&0xFF;break;
        case 1:s.d=(v>>8)&0xFF;s.e=v&0xFF;break;
        case 2:s.h=(v>>8)&0xFF;s.l=v&0xFF;break;
        case 3:s.a=(v>>8)&0xFF;s.f=v&0xFF;break;
      }
    }

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
        case 'PO':return !(f&FLAG_MASK.PV);
        case 'PE':return !!(f&FLAG_MASK.PV);
        case 'P':return !(f&FLAG_MASK.S);
        case 'M':return !!(f&FLAG_MASK.S);
        default:throw new Error(`UNKNOWN CONDITION ${condition}`);
      }
    }

    relativeTarget(displacement){
      return (this.state.pc+signed8(displacement))&0xFFFF;
    }

    flowResult(mnemonic,tStates,branchTaken,branchTarget,fallThrough,condition=null){
      return {mnemonic,tStates,branchTaken,branchTarget,fallThrough,condition};
    }

    alu8(aluCode,value){
      const s=this.state,v=Number(value)&0xFF,carry=!!(s.f&FLAG_MASK.C);
      let out;
      switch(aluCode&7){
        case 0:out=add8(s.f,s.a,v,0);s.a=out.result;s.f=out.f;break;
        case 1:out=add8(s.f,s.a,v,carry?1:0);s.a=out.result;s.f=out.f;break;
        case 2:out=sub8(s.f,s.a,v,0);s.a=out.result;s.f=out.f;break;
        case 3:out=sub8(s.f,s.a,v,carry?1:0);s.a=out.result;s.f=out.f;break;
        case 4:out=and8(s.f,s.a,v);s.a=out.result;s.f=out.f;break;
        case 5:out=xor8(s.f,s.a,v);s.a=out.result;s.f=out.f;break;
        case 6:out=or8(s.f,s.a,v);s.a=out.result;s.f=out.f;break;
        case 7:out=cp8(s.f,s.a,v);s.f=out.f;break;
      }
      return out;
    }

    executeDescriptor(desc,ctx){
      const s=this.state;
      switch(desc.kind){
        case 'PREFIX':
          throw new Error(`UNIMPLEMENTED PREFIX ${desc.prefix} at ${hex(ctx.address,4)}h`);

        case 'NOP':return desc.mnemonic;

        case 'HALT':
          s.halted=true;
          return desc.mnemonic;

        case 'DI':
          s.iff1=false;s.iff2=false;s.eiDelay=0;
          return desc.mnemonic;

        case 'EI':
          s.iff1=true;s.iff2=true;s.eiDelay=1;
          return desc.mnemonic;

        case 'ROT_A':{
          const next=rotateAccumulator(s.f,s.a,desc.rotate);
          s.a=next.result;s.f=next.f;
          return desc.mnemonic;
        }

        case 'DAA':{
          const next=daa8(s.f,s.a);s.a=next.result;s.f=next.f;return desc.mnemonic;
        }

        case 'CPL':
          s.a=(~s.a)&0xFF;
          s.f=(s.f&(FLAG_MASK.S|FLAG_MASK.Z|FLAG_MASK.PV|FLAG_MASK.C|FLAG_MASK.Y|FLAG_MASK.X))|FLAG_MASK.H|FLAG_MASK.N;
          return desc.mnemonic;

        case 'SCF':
          s.f=(s.f&(FLAG_MASK.S|FLAG_MASK.Z|FLAG_MASK.PV|FLAG_MASK.Y|FLAG_MASK.X))|FLAG_MASK.C;
          return desc.mnemonic;

        case 'CCF':{
          const oldC=!!(s.f&FLAG_MASK.C);
          s.f=(s.f&(FLAG_MASK.S|FLAG_MASK.Z|FLAG_MASK.PV|FLAG_MASK.Y|FLAG_MASK.X))|
            (oldC?FLAG_MASK.H:0)|(oldC?0:FLAG_MASK.C);
          return desc.mnemonic;
        }

        case 'EX_AF_ALT':{
          [s.a,s.aAlt]=[s.aAlt,s.a];[s.f,s.fAlt]=[s.fAlt,s.f];
          return desc.mnemonic;
        }

        case 'EXX':
          [s.b,s.bAlt]=[s.bAlt,s.b];[s.c,s.cAlt]=[s.cAlt,s.c];
          [s.d,s.dAlt]=[s.dAlt,s.d];[s.e,s.eAlt]=[s.eAlt,s.e];
          [s.h,s.hAlt]=[s.hAlt,s.h];[s.l,s.lAlt]=[s.lAlt,s.l];
          return desc.mnemonic;

        case 'EX_DE_HL':
          [s.d,s.h]=[s.h,s.d];[s.e,s.l]=[s.l,s.e];
          return desc.mnemonic;

        case 'EX_SP_HL':{
          const oldHL=this.getHL(),sp=s.sp&0xFFFF;
          const fromStack=this.readWord(sp,ctx,4,'STACK_READ');
          this.writeData((sp+1)&0xFFFF,(oldHL>>8)&0xFF,ctx,11,'STACK_WRITE');
          this.writeData(sp,oldHL&0xFF,ctx,14,'STACK_WRITE');
          this.setPair16(2,fromStack);
          return desc.mnemonic;
        }

        case 'INC_DD':
          this.setPair16(desc.pairCode,(this.getPair16(desc.pairCode)+1)&0xFFFF);
          return desc.mnemonic;

        case 'DEC_DD':
          this.setPair16(desc.pairCode,(this.getPair16(desc.pairCode)-1)&0xFFFF);
          return desc.mnemonic;

        case 'ADD_HL_DD':{
          const next=add16HL(s.f,this.getHL(),this.getPair16(desc.pairCode));
          this.setPair16(2,next.result);s.f=next.f;
          return desc.mnemonic;
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

        case 'ALU_R':{
          const value=desc.srcCode===6?this.readData(this.getHL(),ctx,4):this.getReg8(desc.srcCode);
          this.alu8(desc.aluCode,value);
          return desc.mnemonic;
        }

        case 'ALU_N':{
          const value=this.fetchOperandByte(ctx,4);
          this.alu8(desc.aluCode,value);
          return desc.mnemonic.replace('n',`${hex(value,2)}h`);
        }

        case 'LD_R_R':
          this.setReg8(desc.dstCode,this.getReg8(desc.srcCode));
          return desc.mnemonic;

        case 'LD_R_N':{
          const n=this.fetchOperandByte(ctx,4);this.setReg8(desc.dstCode,n);
          return desc.mnemonic.replace('n',`${hex(n,2)}h`);
        }

        case 'LD_DD_NN':{
          const nn=this.fetchOperandWord(ctx,4);this.setPair16(desc.pairCode,nn);
          return desc.mnemonic.replace('nn',`${hex(nn,4)}h`);
        }

        case 'LD_R_MEM_HL':{
          const v=this.readData(this.getHL(),ctx,4);this.setReg8(desc.dstCode,v);return desc.mnemonic;
        }

        case 'LD_MEM_HL_R':
          this.writeData(this.getHL(),this.getReg8(desc.srcCode),ctx,4);return desc.mnemonic;

        case 'LD_MEM_HL_N':{
          const n=this.fetchOperandByte(ctx,4);this.writeData(this.getHL(),n,ctx,7);
          return `LD (HL),${hex(n,2)}h`;
        }

        case 'LD_A_MEM_BC':s.a=this.readData(this.getBC(),ctx,4);return desc.mnemonic;
        case 'LD_A_MEM_DE':s.a=this.readData(this.getDE(),ctx,4);return desc.mnemonic;
        case 'LD_MEM_BC_A':this.writeData(this.getBC(),s.a,ctx,4);return desc.mnemonic;
        case 'LD_MEM_DE_A':this.writeData(this.getDE(),s.a,ctx,4);return desc.mnemonic;

        case 'LD_A_MEM_NN':{
          const nn=this.fetchOperandWord(ctx,4);s.a=this.readData(nn,ctx,10);
          return `LD A,(${hex(nn,4)}h)`;
        }

        case 'LD_MEM_NN_A':{
          const nn=this.fetchOperandWord(ctx,4);this.writeData(nn,s.a,ctx,10);
          return `LD (${hex(nn,4)}h),A`;
        }

        case 'LD_MEM_NN_HL':{
          const nn=this.fetchOperandWord(ctx,4);this.writeWord(nn,this.getHL(),ctx,10);
          return `LD (${hex(nn,4)}h),HL`;
        }

        case 'LD_HL_MEM_NN':{
          const nn=this.fetchOperandWord(ctx,4),word=this.readWord(nn,ctx,10);
          this.setPair16(2,word);
          return `LD HL,(${hex(nn,4)}h)`;
        }

        case 'LD_SP_HL':
          s.sp=this.getHL();return desc.mnemonic;

        case 'JP_NN':{
          const target=this.fetchOperandWord(ctx,4),fallThrough=s.pc;
          s.pc=target;
          return this.flowResult(`JP ${hex(target,4)}h`,desc.tStates,true,target,fallThrough,'ALWAYS');
        }

        case 'JP_CC_NN':{
          const target=this.fetchOperandWord(ctx,4),fallThrough=s.pc,taken=this.conditionTrue(desc.condition);
          if(taken)s.pc=target;
          return this.flowResult(`JP ${desc.condition},${hex(target,4)}h`,desc.tStates,taken,target,fallThrough,desc.condition);
        }

        case 'JP_HL':{
          const target=this.getHL(),fallThrough=s.pc;s.pc=target;
          return this.flowResult(`JP (HL)`,desc.tStates,true,target,fallThrough,'ALWAYS');
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

        case 'CALL_NN':{
          const target=this.fetchOperandWord(ctx,4),returnAddress=s.pc,stackBefore=s.sp;
          this.pushWord(returnAddress,ctx,11);
          const stackAfter=s.sp;s.pc=target;
          return {
            mnemonic:`CALL ${hex(target,4)}h`,tStates:desc.tStates,
            branchTaken:true,branchTarget:target,fallThrough:returnAddress,condition:'CALL',
            stackBefore,stackAfter,returnAddress
          };
        }

        case 'CALL_CC_NN':{
          const target=this.fetchOperandWord(ctx,4),returnAddress=s.pc,taken=this.conditionTrue(desc.condition);
          const stackBefore=s.sp;
          if(taken){this.pushWord(returnAddress,ctx,11);s.pc=target;}
          return {
            mnemonic:`CALL ${desc.condition},${hex(target,4)}h`,
            tStates:taken?desc.tStatesTaken:desc.tStatesNotTaken,
            branchTaken:taken,branchTarget:target,fallThrough:returnAddress,condition:desc.condition,
            stackBefore,stackAfter:s.sp,returnAddress
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

        case 'RET_CC':{
          const fallThrough=s.pc,taken=this.conditionTrue(desc.condition),stackBefore=s.sp;
          if(!taken)return {
            mnemonic:`RET ${desc.condition}`,tStates:desc.tStatesNotTaken,
            branchTaken:false,branchTarget:null,fallThrough,condition:desc.condition,
            stackBefore,stackAfter:s.sp,returnAddress:null
          };
          const returnAddress=this.popWord(ctx,5),stackAfter=s.sp;s.pc=returnAddress;
          return {
            mnemonic:`RET ${desc.condition}`,tStates:desc.tStatesTaken,
            branchTaken:true,branchTarget:returnAddress,fallThrough,condition:desc.condition,
            stackBefore,stackAfter,returnAddress
          };
        }

        case 'RST':{
          const returnAddress=s.pc,stackBefore=s.sp;
          this.pushWord(returnAddress,ctx,5);
          s.pc=desc.vector;
          return {
            mnemonic:desc.mnemonic,tStates:desc.tStates,
            branchTaken:true,branchTarget:desc.vector,fallThrough:returnAddress,condition:'RST',
            stackBefore,stackAfter:s.sp,returnAddress
          };
        }

        case 'PUSH_QQ':{
          const value=this.getStackPair(desc.pairCode),stackBefore=s.sp;
          this.pushWord(value,ctx,5);
          return {mnemonic:desc.mnemonic,tStates:desc.tStates,stackBefore,stackAfter:s.sp};
        }

        case 'POP_QQ':{
          const stackBefore=s.sp,value=this.popWord(ctx,4);
          this.setStackPair(desc.pairCode,value);
          return {mnemonic:desc.mnemonic,tStates:desc.tStates,stackBefore,stackAfter:s.sp};
        }

        case 'IN_A_N':{
          const n=this.fetchOperandByte(ctx,4),oldA=s.a&0xFF,port=((oldA<<8)|n)&0xFFFF;
          s.a=this.bus.cpuIoRead(port,{
            tState:ctx.startTState+7,purpose:'IO_READ',signals:['IORQ','RD'],
            meta:{precision:'M_CYCLE_ABSTRACT',portMode:'A_HIGH_N_LOW'}
          });
          return `IN A,(${hex(n,2)}h)`;
        }

        case 'OUT_N_A':{
          const n=this.fetchOperandByte(ctx,4),port=((s.a<<8)|n)&0xFFFF;
          this.bus.cpuIoWrite(port,s.a,{
            tState:ctx.startTState+7,purpose:'IO_WRITE',signals:['IORQ','WR'],
            meta:{precision:'M_CYCLE_ABSTRACT',portMode:'A_HIGH_N_LOW'}
          });
          return `OUT (${hex(n,2)}h),A`;
        }

        default:
          throw new Error(`UNIMPLEMENTED DECODE KIND ${desc.kind}`);
      }
    }

    executeCB(desc,ctx){
      const s=this.state,memory=desc.targetCode===6,address=this.getHL();
      const value=memory?this.readData(address,ctx,8):s[REG8_KEYS[desc.targetCode]];
      let result=value;
      if(desc.kind==='CB_BIT')s.f=bitTest8(s.f,value,desc.operation);
      else{
        if(desc.kind==='CB_ROTATE'){
          const shifted=rotateShift8(s.f,value,desc.rotate);result=shifted.result;s.f=shifted.f;
        }else if(desc.kind==='CB_RES')result=value&~(1<<desc.operation);
        else result=value|(1<<desc.operation);
        if(memory)this.writeData(address,result,ctx,12);
        else s[REG8_KEYS[desc.targetCode]]=result;
      }
      return desc.mnemonic;
    }

    executeED(desc,ctx){
      const s=this.state;
      const ioOptions=(offset,write)=>({tState:ctx.startTState+offset,purpose:write?'IO_WRITE':'IO_READ',signals:['IORQ',write?'WR':'RD'],meta:{precision:'M_CYCLE_ABSTRACT',portMode:'BC'}});
      switch(desc.kind){
        case 'ED_NOP':break;
        case 'ED_IN':{
          const value=this.bus.cpuIoRead(this.getBC(),ioOptions(8,false));
          if(desc.regCode!==6)this.setReg8(desc.regCode,value);
          s.f=logicFlags(s.f,value,false)|(s.f&1);break;
        }
        case 'ED_OUT':this.bus.cpuIoWrite(this.getBC(),desc.regCode===6?0:this.getReg8(desc.regCode),ioOptions(8,true));break;
        case 'ED_ARITH16':{
          const result=carryArithmetic16(s.f,this.getHL(),this.getPair16(desc.pairCode),desc.subtract);
          this.setPair16(2,result.result);s.f=result.f;break;
        }
        case 'ED_LD16':{
          const address=this.fetchOperandWord(ctx,8);
          if(desc.load)this.setPair16(desc.pairCode,this.readWord(address,ctx,14));
          else this.writeWord(address,this.getPair16(desc.pairCode),ctx,14);
          return desc.mnemonic.replace('nn',hex(address,4)+'h');
        }
        case 'ED_NEG':{const result=sub8(s.f,0,s.a);s.a=result.result;s.f=result.f;break;}
        case 'ED_RETURN':{
          const stackBefore=s.sp,fallThrough=s.pc;s.pc=this.popWord(ctx,8);s.iff1=s.iff2;
          return {mnemonic:desc.mnemonic,tStates:14,stackBefore,stackAfter:s.sp,branchTaken:true,branchTarget:s.pc,fallThrough};
        }
        case 'ED_IM':s.im=desc.mode;break;
        case 'ED_SPECIAL':{
          const key=desc.special.toLowerCase();
          if(desc.loadA){s.a=s[key];s.f=(logicFlags(s.f,s.a,false)&~4)|(s.iff2?4:0)|(s.f&1);}
          else s[key]=s.a;
          break;
        }
        case 'ED_NIBBLE':{
          const address=this.getHL(),value=this.readData(address,ctx,8),low=s.a&15;
          const result=desc.left?((value<<4)|low)&255:(low<<4)|(value>>4);
          s.a=(s.a&240)|(desc.left?value>>4:value&15);
          this.writeData(address,result,ctx,15);s.f=logicFlags(s.f,s.a,false)|(s.f&1);break;
        }
        case 'ED_BLOCK':{
          const address=this.getHL(),dir=desc.direction,op=desc.operation;
          let repeat=false;
          if(op<2){
            const value=this.readData(address,ctx,8);
            if(op===0){
              this.writeData(this.getDE(),value,ctx,11);this.setPair16(1,this.getDE()+dir);
              s.f&=0xE9; // retain S/Z/X/Y/C; H/N clear, PV set from remaining BC below
            }else s.f=(sub8(s.f,s.a,value).f&~5)|(s.f&1);
            this.setPair16(2,address+dir);this.setPair16(0,this.getBC()-1);
            if(this.getBC()!==0)s.f|=4;
            repeat=desc.repeat&&this.getBC()!==0&&(op===0||!(s.f&0x40));
          }else{
            let value,sum;
            if(op===2){
              value=this.bus.cpuIoRead(this.getBC(),ioOptions(9,false));
              this.writeData(address,value,ctx,13);s.b=(s.b-1)&255;
              sum=value+((s.c+dir)&255);
            }else{
              value=this.readData(address,ctx,9);s.b=(s.b-1)&255;
              this.bus.cpuIoWrite(this.getBC(),value,ioOptions(12,true));
              sum=value+((address+dir)&255);
            }
            this.setPair16(2,address+dir);repeat=desc.repeat&&s.b!==0;
            s.f=blockIoFlags(s.f,s.b,value,sum,repeat);
          }
          const fallThrough=s.pc;if(repeat)s.pc=(s.pc-2)&65535;
          return {mnemonic:desc.mnemonic,tStates:repeat?21:16,branchTaken:repeat,branchTarget:repeat?s.pc:null,fallThrough};
        }
        default:throw new Error('UNIMPLEMENTED ED KIND '+desc.kind);
      }
      return desc.mnemonic;
    }

    executeIndex(desc,ctx){
      if(!desc.affected)return this.executeDescriptor(desc,ctx);
      const s=this.state,key=desc.index.toLowerCase();
      // ctx starts at the terminal opcode M1; descriptor timing includes one prefix.
      const get=code=>code===4?s[key]>>>8:code===5?s[key]&255:this.getReg8(code);
      const set=(code,value)=>{if(code===4)s[key]=((value&255)<<8)|(s[key]&255);else if(code===5)s[key]=(s[key]&0xFF00)|(value&255);else this.setReg8(code,value);};
      if(desc.indexedMemory){
        const displacement=this.fetchOperandByte(ctx,4),address=(s[key]+signed8(displacement))&65535;
        let mnemonic=desc.mnemonic.replace('+d',signedText(displacement));
        switch(desc.kind){
          case 'LD_R_MEM_HL':this.setReg8(desc.dstCode,this.readData(address,ctx,12));break;
          case 'LD_MEM_HL_R':this.writeData(address,this.getReg8(desc.srcCode),ctx,12);break;
          case 'LD_MEM_HL_N':{const value=this.fetchOperandByte(ctx,7);this.writeData(address,value,ctx,12);mnemonic=mnemonic.replace(',n',','+hex(value,2)+'h');break;}
          case 'ALU_R':this.alu8(desc.aluCode,this.readData(address,ctx,12));break;
          case 'INC_MEM_HL':case 'DEC_MEM_HL':{
            const value=this.readData(address,ctx,12),next=desc.kind==='INC_MEM_HL'?inc8(s.f,value):dec8(s.f,value);
            this.writeData(address,next.result,ctx,16);s.f=next.f;break;
          }
          default:throw new Error('UNIMPLEMENTED INDEX MEMORY '+desc.kind);
        }
        return mnemonic;
      }
      switch(desc.kind){
        case 'LD_DD_NN':s[key]=this.fetchOperandWord(ctx,4);return desc.mnemonic.replace('nn',hex(s[key],4)+'h');
        case 'INC_DD':s[key]=(s[key]+1)&65535;break;
        case 'DEC_DD':s[key]=(s[key]-1)&65535;break;
        case 'ADD_HL_DD':{const next=add16HL(s.f,s[key],desc.pairCode===2?s[key]:this.getPair16(desc.pairCode));s[key]=next.result;s.f=next.f;break;}
        case 'LD_MEM_NN_HL':case 'LD_HL_MEM_NN':{
          const address=this.fetchOperandWord(ctx,4);
          if(desc.kind==='LD_MEM_NN_HL')this.writeWord(address,s[key],ctx,10);else s[key]=this.readWord(address,ctx,10);
          return desc.mnemonic.replace('nn',hex(address,4)+'h');
        }
        case 'LD_R_R':set(desc.dstCode,get(desc.srcCode));break;
        case 'LD_R_N':{const value=this.fetchOperandByte(ctx,4);set(desc.dstCode,value);return desc.mnemonic.replace(',n',','+hex(value,2)+'h');}
        case 'INC_R':case 'DEC_R':{const next=desc.kind==='INC_R'?inc8(s.f,get(desc.targetCode)):dec8(s.f,get(desc.targetCode));set(desc.targetCode,next.result);s.f=next.f;break;}
        case 'ALU_R':this.alu8(desc.aluCode,get(desc.srcCode));break;
        case 'LD_SP_HL':s.sp=s[key];break;
        case 'JP_HL':{const fallThrough=s.pc;s.pc=s[key];return this.flowResult(desc.mnemonic,desc.tStates,true,s.pc,fallThrough,'ALWAYS');}
        case 'PUSH_QQ':case 'POP_QQ':{
          const stackBefore=s.sp;if(desc.kind==='PUSH_QQ')this.pushWord(s[key],ctx,5);else s[key]=this.popWord(ctx,4);
          return {mnemonic:desc.mnemonic,tStates:desc.tStates,stackBefore,stackAfter:s.sp};
        }
        case 'EX_SP_HL':{
          const old=s[key],sp=s.sp,value=this.readWord(sp,ctx,4,'STACK_READ');
          this.writeData((sp+1)&65535,old>>>8,ctx,11,'STACK_WRITE');this.writeData(sp,old&255,ctx,14,'STACK_WRITE');s[key]=value;break;
        }
        default:throw new Error('UNIMPLEMENTED INDEX KIND '+desc.kind);
      }
      return desc.mnemonic;
    }

    step(){
      const s=this.state;
      if(s.halted)return this.haltCycle();

      const startTState=s.tStates,{address,opcode}=this.fetchOpcode();
      let desc=decodeBase(opcode);
      if(!desc)throw new Error(`UNIMPLEMENTED OPCODE ${hex(opcode,2)}h at ${hex(address,4)}h`);

      const ctx={address,opcode,startTState,bytes:[opcode]};
      let terminal=opcode,index=null,prefixCount=0;
      while(terminal===0xDD||terminal===0xFD){
        index=terminal===0xDD?'IX':'IY';prefixCount++;
        // A complete address-space loop of prefixes cannot retire; keep the host responsive.
        if(prefixCount>=65536)throw new Error('INDEX PREFIX STREAM exceeds one address space');
        terminal=this.fetchOpcode(prefixCount*4).opcode;ctx.bytes.push(terminal);
      }
      ctx.startTState=startTState+prefixCount*4;
      if(index&&terminal===0xCB)throw new Error('UNIMPLEMENTED INDEXED CB (PHASE 1I)');
      if(terminal===0xCB||terminal===0xED){const second=this.fetchOpcode(prefixCount*4+4).opcode;ctx.bytes.push(second);desc=terminal===0xCB?decodeCB(second):decodeED(second);}
      else if(index)desc=decodeIndex(terminal,index);
      const execution=terminal===0xCB?this.executeCB(desc,ctx):terminal===0xED?this.executeED(desc,ctx):index?this.executeIndex(desc,ctx):this.executeDescriptor(desc,ctx);
      const detail=typeof execution==='string'?{mnemonic:execution,tStates:desc.tStates}:execution;
      const actualTStates=(detail.tStates??desc.tStates)+(index?(terminal===0xED?prefixCount:prefixCount-1)*4:0);
      if(!Number.isFinite(actualTStates))throw new Error(`MISSING T-STATES FOR ${detail.mnemonic||desc.kind}`);

      s.tStates+=actualTStates;s.instructions+=1;
      if(s.eiDelay>0&&terminal!==0xFB)s.eiDelay=Math.max(0,s.eiDelay-1);

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

    runInstructions(count=1){
      const n=Math.max(0,Math.floor(Number(count)||0));
      let result=null;
      for(let i=0;i<n;i++)result=this.step();
      return result;
    }

    snapshot(){return JSON.parse(JSON.stringify(this.state));}
  }

  return {Z80Core,coldState,FLAG_BITS,flagState};
});
