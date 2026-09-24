
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_BUS=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const ADDRESS_MASK=0xFFFF;
  const DATA_MASK=0xFF;

  class Shino80Bus {
    constructor({traceLimit=256,romRanges=[]}={}){
      this.memory=new Uint8Array(0x10000);
      this.trace=[];
      this.traceLimit=traceLimit;
      this.sequence=0;
      this.romRanges=(romRanges||[]).map(range=>{
        const start=Number(range[0])&ADDRESS_MASK,end=Number(range[1])&ADDRESS_MASK;
        if(end<start)throw new RangeError('ROM range must not wrap');
        return [start,end];
      });
    }

    normalizeAddress(address){return Number(address)&ADDRESS_MASK;}
    normalizeData(value){return Number(value)&DATA_MASK;}
    isRomAddress(address){
      const addr=this.normalizeAddress(address);
      return this.romRanges.some(([start,end])=>addr>=start&&addr<=end);
    }

    clearTrace(){this.trace.length=0;}

    emit(event){
      const record={seq:++this.sequence,...event};
      this.trace.push(record);
      if(this.trace.length>this.traceLimit)this.trace.splice(0,this.trace.length-this.traceLimit);
      return record;
    }

    cpuRead(address,{tState=0,purpose='MEMORY_READ',signals=['MREQ','RD'],meta={}}={}){
      const addr=this.normalizeAddress(address);
      const data=this.memory[addr];
      this.emit({
        tState,
        actor:'CPU',
        space:'MEMORY',
        operation:'READ',
        address:addr,
        data,
        purpose,
        signals:[...signals],
        meta:{...meta}
      });
      return data;
    }

    cpuWrite(address,value,{tState=0,purpose='MEMORY_WRITE',signals=['MREQ','WR'],meta={}}={}){
      const addr=this.normalizeAddress(address),data=this.normalizeData(value);
      if(this.isRomAddress(addr)){
        this.emit({
          tState,
          actor:'CPU',
          space:'MEMORY',
          operation:'WRITE_BLOCKED',
          address:addr,
          data,
          purpose:'ROM_WRITE_BLOCKED',
          signals:[...signals],
          meta:{...meta,requestedPurpose:purpose}
        });
        return data;
      }
      this.memory[addr]=data;
      this.emit({
        tState,
        actor:'CPU',
        space:'MEMORY',
        operation:'WRITE',
        address:addr,
        data,
        purpose,
        signals:[...signals],
        meta:{...meta}
      });
      return data;
    }

    emitRefresh({tState=0,i=0,r=0}={}){
      const i8=Number(i)&0xFF;
      const r7=Number(r)&0x7F;
      // A7 is intentionally not modeled yet. The official manual guarantees I on A15-A8
      // and the lower seven bits of R as the refresh counter contribution.
      const address=(i8<<8)|r7;
      return this.emit({
        tState,
        actor:'CPU',
        space:'MEMORY',
        operation:'REFRESH',
        address,
        data:null,
        purpose:'MEMORY_REFRESH',
        signals:['MREQ','RFSH'],
        meta:{precision:'M_CYCLE_ABSTRACT',i:i8,r7,a7Mode:'NOT_MODELED'}
      });
    }

    debugPeek(address){return this.memory[this.normalizeAddress(address)];}
    debugPoke(address,value){this.memory[this.normalizeAddress(address)]=this.normalizeData(value);}

    load(bytes,start=0){
      const base=this.normalizeAddress(start);
      for(let n=0;n<bytes.length;n++)this.memory[(base+n)&ADDRESS_MASK]=this.normalizeData(bytes[n]);
    }
  }

  return {Shino80Bus,ADDRESS_MASK,DATA_MASK};
});

