
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SHINO_BUS=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const ADDRESS_MASK=0xFFFF;
  const DATA_MASK=0xFF;

  class Shino80Bus {
    constructor({traceLimit=256,romRanges=[],ioDevices=[]}={}){
      this.memory=new Uint8Array(0x10000);
      this.ioPorts=new Uint8Array(0x10000);
      this.ioPorts.fill(0xFF);
      this._traceBuffer=[];this._traceStart=0;this._traceCount=0;this._traceLimit=0;
      this.traceLimit=traceLimit;
      this.sequence=0;
      this.romRanges=(romRanges||[]).map(range=>{
        const start=Number(range[0])&ADDRESS_MASK,end=Number(range[1])&ADDRESS_MASK;
        if(end<start)throw new RangeError('ROM range must not wrap');
        return [start,end];
      });
      this.ioDevices=[];
      for(const device of ioDevices||[])this.attachIoDevice(device);
    }

    normalizeAddress(address){return Number(address)&ADDRESS_MASK;}
    normalizeData(value){return Number(value)&DATA_MASK;}
    isRomAddress(address){
      const addr=this.normalizeAddress(address);
      return this.romRanges.some(([start,end])=>addr>=start&&addr<=end);
    }

    // Ordered array snapshot for observers; mutate through clearTrace(), not trace.
    get trace(){
      const records=new Array(this._traceCount);
      for(let i=0;i<records.length;i++)records[i]=this._traceBuffer[(this._traceStart+i)%this._traceLimit];
      return records;
    }
    get traceCount(){return this._traceCount;}
    get traceLimit(){return this._traceLimit;}
    set traceLimit(value){
      if(!Number.isSafeInteger(value)||value<0)throw new RangeError('traceLimit must be a nonnegative integer');
      const retained=value?this.trace.slice(-value):[];
      this._traceLimit=value;this._traceBuffer=new Array(value);
      this._traceStart=0;this._traceCount=retained.length;
      for(let i=0;i<retained.length;i++)this._traceBuffer[i]=retained[i];
    }
    clearTrace(){this._traceBuffer.fill(undefined);this._traceStart=0;this._traceCount=0;}

    attachIoDevice(device){
      if(!device||typeof device.handlesPort!=='function')throw new TypeError('I/O device must implement handlesPort(port)');
      if(this.ioDevices.includes(device))return device;
      this.ioDevices.push(device);
      return device;
    }

    detachIoDevice(device){
      const index=this.ioDevices.indexOf(device);
      if(index>=0)this.ioDevices.splice(index,1);
      return index>=0;
    }

    ioDeviceFor(port){
      const address=this.normalizeAddress(port);
      return this.ioDevices.find(device=>device.handlesPort(address))||null;
    }

    emit(event){
      const record={seq:++this.sequence,...event};
      if(this._traceLimit){
        if(this._traceCount<this._traceLimit){
          this._traceBuffer[(this._traceStart+this._traceCount)%this._traceLimit]=record;
          this._traceCount++;
        }else{
          this._traceBuffer[this._traceStart]=record;
          this._traceStart=(this._traceStart+1)%this._traceLimit;
        }
      }
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

    cpuIoRead(port,{tState=0,purpose='IO_READ',signals=['IORQ','RD'],meta={}}={}){
      const address=this.normalizeAddress(port);
      const device=this.ioDeviceFor(address);
      const data=this.normalizeData(device&&typeof device.readPort==='function'?device.readPort(address):this.ioPorts[address]);
      this.emit({
        tState,actor:'CPU',space:'IO',operation:'READ',address,data,purpose,
        signals:[...signals],meta:{...meta,...(device?{device:device.id||'IO_DEVICE'}:{})}
      });
      return data;
    }

    cpuIoWrite(port,value,{tState=0,purpose='IO_WRITE',signals=['IORQ','WR'],meta={}}={}){
      const address=this.normalizeAddress(port),data=this.normalizeData(value);
      const device=this.ioDeviceFor(address);
      if(device&&typeof device.writePort==='function')device.writePort(address,data);
      else this.ioPorts[address]=data;
      this.emit({
        tState,actor:'CPU',space:'IO',operation:'WRITE',address,data,purpose,
        signals:[...signals],meta:{...meta,...(device?{device:device.id||'IO_DEVICE'}:{})}
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
    debugIoPeek(port){
      const address=this.normalizeAddress(port),device=this.ioDeviceFor(address);
      return this.normalizeData(device&&typeof device.debugPeekPort==='function'?device.debugPeekPort(address):this.ioPorts[address]);
    }
    debugIoPoke(port,value){
      const address=this.normalizeAddress(port),data=this.normalizeData(value),device=this.ioDeviceFor(address);
      if(device&&typeof device.debugPokePort==='function')device.debugPokePort(address,data);
      else this.ioPorts[address]=data;
    }
    clearIoPorts(value=0xFF){this.ioPorts.fill(this.normalizeData(value));}
    resetIoDevices(){for(const device of this.ioDevices)if(typeof device.reset==='function')device.reset();}
    clearWritableMemory(value=0){
      const data=this.normalizeData(value);
      for(let address=0;address<=ADDRESS_MASK;address++)if(!this.isRomAddress(address))this.memory[address]=data;
    }

    load(bytes,start=0){
      const base=this.normalizeAddress(start);
      for(let n=0;n<bytes.length;n++)this.memory[(base+n)&ADDRESS_MASK]=this.normalizeData(bytes[n]);
    }
  }

  return {Shino80Bus,ADDRESS_MASK,DATA_MASK};
});
