(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_BEEPER=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const BEEPER_PORT=0x40;

  class Shino80Beeper{
    constructor(){this.id='SHINO80_BEEPER';this.reset();}
    lowPort(port){return Number(port)&0xFF;}
    handlesPort(port){return this.lowPort(port)===BEEPER_PORT;}
    readPort(port){return this.handlesPort(port)?this.lastValue:0xFF;}
    writePort(port,value){
      if(!this.handlesPort(port))return;
      this.lastValue=Number(value)&0xFF;
      this.triggerCount++;
      this.sequence++;
    }
    debugPeekPort(port){return this.readPort(port);}
    debugPokePort(port,value){this.writePort(port,value);}
    reset(){this.lastValue=0;this.triggerCount=0;this.sequence=0;}
  }

  return {Shino80Beeper,BEEPER_PORT};
});
