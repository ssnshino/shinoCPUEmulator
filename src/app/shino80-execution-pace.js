(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_PACE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Host pacing only: virtual time always comes from completed CPU instructions.
  class ExecutionPace {
    constructor(cpu,{now=()=>performance.now(),hz=4000000,workMs=8,maxInstructions=100000}={}){
      this.cpu=cpu;this.now=now;this.hz=hz;this.workMs=workMs;this.maxInstructions=maxInstructions;
      this.reset(now());
    }
    reset(at=this.now()){
      this.lastAt=at;this.credit=0;this.sampleAt=at;
      this.sampleT=this.cpu.state.tStates;this.mhz=0;
    }
    sample(at=this.now()){
      const elapsed=at-this.sampleAt;
      if(elapsed>=500){
        this.mhz=Math.max(0,this.cpu.state.tStates-this.sampleT)/elapsed/1000;
        this.sampleAt=at;this.sampleT=this.cpu.state.tStates;
      }
    }
    advance(at,mode){
      if(mode!=='REALTIME'&&mode!=='TURBO')throw new Error('Unknown execution pace');
      const elapsed=at-this.lastAt;this.lastAt=at;
      // Hidden/suspended hosts must never accumulate an unbounded catch-up run.
      if(elapsed<0||elapsed>250){this.reset(at);return 0;}
      if(mode==='REALTIME')this.credit=Math.min(this.hz*0.1,this.credit+elapsed*this.hz/1000);
      else this.credit=0;
      const startT=this.cpu.state.tStates,deadline=this.now()+this.workMs;
      let count=0;
      while(count<this.maxInstructions&&(mode==='TURBO'||this.cpu.state.tStates-startT<this.credit)){
        if(count%32===0&&this.now()>=deadline)break;
        this.cpu.step();count++;
      }
      if(mode==='REALTIME')this.credit-=this.cpu.state.tStates-startT;
      this.sample(at);
      return count;
    }
  }
  return {ExecutionPace};
});
