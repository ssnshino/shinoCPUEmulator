(function(root,factory){
  const busApi=(typeof module==='object'&&module.exports)
    ?require('../../machine/shino80/shino80-bus.js')
    :root.SHINO_BUS;
  const api=factory(busApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_Z80=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(busApi){
  'use strict';

  if(!busApi||!busApi.Shino80Bus)throw new Error('SHINO Z80 CORE: bus API missing');

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

  class Z80Core {
    constructor(bus){
      if(!(bus instanceof busApi.Shino80Bus))throw new TypeError('Z80Core requires Shino80Bus');
      this.bus=bus;
      this.state=coldState();
      this.lastInstruction=null;
    }

    reset(){
      const s=this.state;
      // UM0080 documents RESET as clearing PC, I, R, interrupt enable state, and selecting IM 0.
      // Other programmer-visible general registers are intentionally left untouched here.
      s.pc=0;
      s.i=0;
      s.r=0;
      s.iff1=false;
      s.iff2=false;
      s.im=0;
      s.halted=false;
      s.intLine=false;
      s.nmiLine=false;
      s.waitLine=false;
      // Bench counters are emulator instrumentation, not Z80 architectural registers.
      s.tStates=0;
      s.instructions=0;
      this.lastInstruction=null;
      this.bus.clearTrace();
      this.bus.emit({
        tState:0,actor:'BENCH',space:'CONTROL',operation:'RESET',address:null,data:null,
        purpose:'CPU_RESET',signals:['RESET'],meta:{precision:'FUNCTIONAL'}
      });
      return this.snapshot();
    }

    incrementR(){
      const s=this.state;
      s.r=(s.r&0x80)|(((s.r&0x7F)+1)&0x7F);
      return s.r;
    }

    fetchOpcode(){
      const s=this.state;
      const address=s.pc&0xFFFF;
      const opcode=this.bus.cpuRead(address,{
        tState:s.tStates,
        purpose:'OPCODE_FETCH',
        signals:['M1','MREQ','RD'],
        meta:{precision:'M_CYCLE_ABSTRACT'}
      });
      s.pc=(s.pc+1)&0xFFFF;
      this.incrementR();
      // The refresh portion occupies T3/T4 of M1. This is an abstract M-cycle trace,
      // not a pin-perfect T-state model yet.
      this.bus.emitRefresh({tState:s.tStates+2,i:s.i,r:s.r});
      return {address,opcode};
    }

    step(){
      const s=this.state;
      if(s.halted)return {halted:true,tStates:0,mnemonic:'HALT'};

      const beforeT=s.tStates;
      const {address,opcode}=this.fetchOpcode();
      let mnemonic,tStates;

      switch(opcode){
        case 0x00:
          mnemonic='NOP';
          tStates=4;
          break;
        default:
          throw new Error(`UNIMPLEMENTED OPCODE ${opcode.toString(16).padStart(2,'0').toUpperCase()}h at ${address.toString(16).padStart(4,'0').toUpperCase()}h`);
      }

      s.tStates+=tStates;
      s.instructions+=1;
      this.lastInstruction={address,opcode,mnemonic,tStates,startTState:beforeT,endTState:s.tStates};
      return {...this.lastInstruction};
    }

    runInstructions(count=1){
      const n=Math.max(0,Math.floor(Number(count)||0));
      let result=null;
      for(let i=0;i<n;i++)result=this.step();
      return result;
    }

    snapshot(){
      return JSON.parse(JSON.stringify(this.state));
    }
  }

  const FLAG_BITS=Object.freeze({S:7,Z:6,Y:5,H:4,X:3,PV:2,N:1,C:0});

  function flagState(f){
    const v=Number(f)&0xFF;
    return Object.fromEntries(Object.entries(FLAG_BITS).map(([name,bit])=>[name,!!(v&(1<<bit))]));
  }

  return {Z80Core,coldState,FLAG_BITS,flagState};
});
