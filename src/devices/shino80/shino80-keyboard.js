(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_KEYBOARD=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const KEY_DATA_PORT=0x20;
  const KEY_STATUS_PORT=0x21;
  const KEY_STATUS_READY=0x01;
  const KEY_STATUS_OVERRUN=0x80;
  const DEFAULT_FIFO_CAPACITY=64;

  class Shino80Keyboard {
    constructor({capacity=DEFAULT_FIFO_CAPACITY}={}){
      const size=Number(capacity);
      if(!Number.isInteger(size)||size<1)throw new RangeError('Keyboard FIFO capacity must be a positive integer');
      this.id='SHINO80_KEYBOARD';
      this.capacity=size;
      this.queue=[];
      this.overrun=false;
    }

    lowPort(port){return Number(port)&0xFF;}
    handlesPort(port){const low=this.lowPort(port);return low===KEY_DATA_PORT||low===KEY_STATUS_PORT;}
    status(){return (this.queue.length?KEY_STATUS_READY:0)|(this.overrun?KEY_STATUS_OVERRUN:0);}

    enqueueByte(value){
      if(this.queue.length>=this.capacity){this.overrun=true;return false;}
      this.queue.push(Number(value)&0xFF);
      return true;
    }

    enqueueText(text){
      let accepted=0;
      for(const char of String(text))if(this.enqueueByte(char.charCodeAt(0)))accepted++;
      return accepted;
    }

    readPort(port){
      const low=this.lowPort(port);
      if(low===KEY_STATUS_PORT)return this.status();
      if(low===KEY_DATA_PORT)return this.queue.length?this.queue.shift():0x00;
      return 0xFF;
    }

    writePort(port,value){
      if(this.lowPort(port)===KEY_STATUS_PORT&&(Number(value)&KEY_STATUS_OVERRUN))this.overrun=false;
    }

    debugPeekPort(port){
      const low=this.lowPort(port);
      if(low===KEY_STATUS_PORT)return this.status();
      if(low===KEY_DATA_PORT)return this.queue.length?this.queue[0]:0x00;
      return 0xFF;
    }

    debugPokePort(port,value){
      const low=this.lowPort(port);
      if(low===KEY_DATA_PORT)this.enqueueByte(value);
      if(low===KEY_STATUS_PORT&&!((Number(value)&KEY_STATUS_OVERRUN)))this.overrun=false;
    }

    reset(){this.queue.length=0;this.overrun=false;}
    get depth(){return this.queue.length;}
  }

  return {
    Shino80Keyboard,
    KEY_DATA_PORT,KEY_STATUS_PORT,KEY_STATUS_READY,KEY_STATUS_OVERRUN,
    DEFAULT_FIFO_CAPACITY
  };
});
