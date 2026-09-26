'use strict';
const assert=require('node:assert/strict');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
for(const limit of [0,1,3,256,512]){
 const bus=new Shino80Bus({traceLimit:limit}),expected=[];
 for(let i=0;i<1500;i++){
  const data={actor:'CPU',space:'MEMORY',operation:'READ',address:i,data:i&255,tState:i*4,signals:['RD'],meta:{test:i}};
  const record=bus.emit(data);expected.push({seq:i+1,...data});if(expected.length>limit)expected.splice(0,expected.length-limit);
  assert.deepEqual(bus.trace,expected);assert.equal(bus.traceCount,expected.length);assert.equal(record.seq,i+1);
 }
 const previous=bus.trace;const copy=previous.slice();bus.emit({purpose:'NEXT'});assert.deepEqual(previous,copy,'snapshot array must not change');
 bus.clearTrace();assert.deepEqual(bus.trace,[]);assert.equal(bus.sequence,1501);
 assert.equal(bus.emit({purpose:'AFTER_CLEAR'}).seq,1502);
}
{
 const bus=new Shino80Bus({traceLimit:3});for(let i=0;i<6;i++)bus.emit({data:i});
 bus.traceLimit=2;assert.deepEqual(bus.trace.map(e=>e.data),[4,5]);
 bus.traceLimit=5;bus.emit({data:6});assert.deepEqual(bus.trace.map(e=>e.data),[4,5,6]);
 bus.traceLimit=0;assert.deepEqual(bus.trace,[]);bus.traceLimit=1;bus.emit({data:7});assert.equal(bus.trace[0].data,7);
 assert.throws(()=>{bus.traceLimit=-1;},RangeError);assert.throws(()=>new Shino80Bus({traceLimit:1.5}),RangeError);
 const seq=bus.sequence;bus.debugPeek(0);assert.equal(bus.sequence,seq);
}
// Same real instruction stream against legacy append/splice retention.
const {Z80Core}=require('../src/cpu/z80/z80-core.js');
const {buildSystemRom}=require('../src/firmware/shino80/shino80-system-rom.js');
const {Shino80Keyboard}=require('../src/devices/shino80/shino80-keyboard.js');
function machine(legacy){
 const keyboard=new Shino80Keyboard(),bus=new Shino80Bus({traceLimit:512,romRanges:[[0,8191]],ioDevices:[keyboard]});
 if(legacy){const records=[];bus.emit=function(event){const r={seq:++this.sequence,...event};records.push(r);if(records.length>512)records.splice(0,records.length-512);return r;};Object.defineProperty(bus,'trace',{get:()=>records});}
 bus.load(buildSystemRom().bytes,0);const cpu=new Z80Core(bus);cpu.reset();for(const c of 'D 0100\r')keyboard.enqueueByte(c.charCodeAt(0));return {cpu,bus,keyboard};
}
const a=machine(false),b=machine(true);
for(let chunk=0;chunk<300;chunk++){
 a.cpu.runInstructions(100);b.cpu.runInstructions(100);
 assert.deepEqual(a.cpu.state,b.cpu.state);assert.deepEqual(a.bus.trace,b.bus.trace);
}
assert.deepEqual(a.bus.memory,b.bus.memory);assert.equal(a.keyboard.depth,b.keyboard.depth);
a.bus.cpuWrite(0,123);b.bus.cpuWrite(0,123);assert.deepEqual(a.bus.trace,b.bus.trace);
console.log('TRACE RING: retention/snapshot/clear/resize/debug and legacy CPU/Bus equivalence PASS');
