(function(root,factory){
  const busApi=(typeof module==='object'&&module.exports)?require('../../machine/shino80/shino80-bus.js'):root.SHINO_BUS;
  const decoderApi=(typeof module==='object'&&module.exports)?require('./z80-decoder.js'):root.SHINO_Z80_DECODER;
  const api=factory(busApi,decoderApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_Z80=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(busApi,decoderApi){
  'use strict';
  if(!busApi||!busApi.Shino80Bus)throw new Error('SHINO Z80 CORE: bus API missing');
  if(!decoderApi||!decoderApi.decodeBase)throw new Error('SHINO Z80 CORE: decoder API missing');

  const {decodeBase,REG8_KEYS}=decoderApi;
  const hex=(value,width)=>((Number(value)>>>0).toString(16).toUpperCase().padStart(width,'0'));

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
    executeDescriptor(desc,ctx){
      const s=this.state;
      switch(desc.kind){
        case 'NOP':return desc.mnemonic;
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
      const ctx={address,opcode,startTState,bytes:[opcode]},mnemonic=this.executeDescriptor(desc,ctx);
      s.tStates+=desc.tStates;s.instructions+=1;
      this.lastInstruction={address,opcode,bytes:[...ctx.bytes],mnemonic,family:desc.family,tStates:desc.tStates,startTState,endTState:s.tStates};
      return {...this.lastInstruction,bytes:[...this.lastInstruction.bytes]};
    }
    runInstructions(count=1){const n=Math.max(0,Math.floor(Number(count)||0));let result=null;for(let i=0;i<n;i++)result=this.step();return result;}
    snapshot(){return JSON.parse(JSON.stringify(this.state));}
  }

  const FLAG_BITS=Object.freeze({S:7,Z:6,Y:5,H:4,X:3,PV:2,N:1,C:0});
  function flagState(f){const v=Number(f)&0xFF;return Object.fromEntries(Object.entries(FLAG_BITS).map(([name,bit])=>[name,!!(v&(1<<bit))]));}
  return {Z80Core,coldState,FLAG_BITS,flagState};
});