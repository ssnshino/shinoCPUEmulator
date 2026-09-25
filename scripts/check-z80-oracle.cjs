'use strict';
// External fixture cache/output only; no third-party JSON is vendored into this repo.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Shino80Bus}=require('../src/machine/shino80/shino80-bus.js');
const {Z80Core,coldState}=require('../src/cpu/z80/z80-core.js');
const revision='ebe1875d48f374bcfd4b505d8eb8ee751568b5f7';
const [family,cache,output]=process.argv.slice(2);
if(!['cb','base'].includes(family)||!cache||!output)throw Error('Usage: node scripts/check-z80-oracle.cjs cb|base CACHE_DIR OUTPUT_JSON');
const names=Array.from({length:256},(_,i)=>i).filter(i=>family==='cb'||![0xCB,0xDD,0xED,0xFD].includes(i)).map(i=>(family==='cb'?'cb ':'')+i.toString(16).padStart(2,'0'));
async function main(){
 fs.mkdirSync(cache,{recursive:true});let next=0;
 await Promise.all(Array.from({length:6},async()=>{while(next<names.length){
  const name=names[next++],file=path.join(cache,name+'.json');if(fs.existsSync(file))continue;
  const url=`https://raw.githubusercontent.com/SingleStepTests/z80/${revision}/v1/${encodeURIComponent(name)}.json`;
  const response=await fetch(url);if(!response.ok)throw Error(`${response.status}: ${url}`);
  const data=await response.text();const parsed=JSON.parse(data);if(parsed.length!==1000)throw Error('Unexpected fixture count');fs.writeFileSync(file,data);
 }}));
 const bus=new Shino80Bus({traceLimit:64}),cpu=new Z80Core(bus);
 const sourceHashes=Object.fromEntries(['src/cpu/z80/z80-core.js','src/cpu/z80/z80-decoder.js','src/cpu/z80/z80-flags.js','src/machine/shino80/shino80-bus.js'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..',file))).digest('hex')]));
 const summary={revision,family,sourceHashes,flagMask:'D7',excluded:['WZ','P','Q','X/Y','pin waveforms'],opcodes:[],cases:0,pass:0,failures:0,details:[]};
 const fields=['a','b','c','d','e','h','l','ix','iy','pc','sp','i','r','im'];
 for(const name of names){
  const bytes=fs.readFileSync(path.join(cache,name+'.json')),cases=JSON.parse(bytes);if(cases.length!==1000)throw Error('Invalid fixture count');
  let pass=0;
  for(const [index,test] of cases.entries()){
   const initial=test.initial,expected=test.final;bus.memory.fill(0);bus.ioPorts.fill(255);bus.clearTrace();
   Object.assign(cpu.state,coldState());for(const k of fields)cpu.state[k]=initial[k];cpu.state.f=initial.f;
   for(const [prefix,keys] of [['af_',['aAlt','fAlt']],['bc_',['bAlt','cAlt']],['de_',['dAlt','eAlt']],['hl_',['hAlt','lAlt']]]){cpu.state[keys[0]]=initial[prefix]>>8;cpu.state[keys[1]]=initial[prefix]&255;}
   cpu.state.iff1=!!initial.iff1;cpu.state.iff2=!!initial.iff2;cpu.state.eiDelay=initial.ei;
   for(const [a,v] of initial.ram)bus.memory[a]=v;
   for(const [a,v,kind] of test.ports||[])if(kind==='r')bus.ioPorts[a]=v;
   const mismatch=[];
   try{cpu.step();}catch(e){mismatch.push(['exception',null,String(e)]);}
   const actual=cpu.state;
   for(const k of fields)if(actual[k]!==expected[k])mismatch.push([k,expected[k],actual[k]]);
   if((actual.f&0xD7)!==(expected.f&0xD7))mismatch.push(['F&D7',expected.f&0xD7,actual.f&0xD7]);
   for(const [prefix,keys] of [['af_',['aAlt','fAlt']],['bc_',['bAlt','cAlt']],['de_',['dAlt','eAlt']],['hl_',['hAlt','lAlt']]]){const mask=prefix==='af_'?0xFFD7:65535,v=(actual[keys[0]]<<8)|actual[keys[1]];if((v&mask)!==(expected[prefix]&mask))mismatch.push([prefix,expected[prefix]&mask,v&mask]);}
   for(const [key,other] of [['iff1','iff1'],['iff2','iff2'],['eiDelay','ei']])if(Number(actual[key])!==expected[other])mismatch.push([key,expected[other],Number(actual[key])]);
   if(actual.tStates!==test.cycles.length)mismatch.push(['T-states',test.cycles.length,actual.tStates]);
   for(const [a,v] of expected.ram)if(bus.memory[a]!==v)mismatch.push([`RAM ${a}`,v,bus.memory[a]]);
   const expectedAddresses=new Set(expected.ram.map(([a])=>a));
   for(const e of bus.trace)if(e.space==='MEMORY'&&e.operation==='WRITE'&&!expectedAddresses.has(e.address))mismatch.push(['unexpected RAM write',null,[e.address,e.data]]);
   const ports=bus.trace.filter(e=>e.space==='IO').map(e=>[e.address,e.data,e.operation==='READ'?'r':'w']);
   if(JSON.stringify(ports)!==JSON.stringify(test.ports||[]))mismatch.push(['ports',test.ports||[],ports]);
   if(mismatch.length){summary.failures++;if(summary.details.length<30)summary.details.push({opcode:name,index,name:test.name,initial,expected,actual:{...actual,ram:expected.ram.map(([a])=>[a,bus.memory[a]])},mismatch,expectedT:test.cycles.length,actualT:actual.tStates});}else{pass++;summary.pass++;}
   summary.cases++;
  }
  summary.opcodes.push({opcode:name,cases:cases.length,pass,failures:cases.length-pass,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  console.log(`${name.toUpperCase()} ${pass}/${cases.length} ${pass===cases.length?'PASS':'FAIL'}`);
 }
 fs.writeFileSync(output,JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({opcodes:summary.opcodes.length,cases:summary.cases,pass:summary.pass,failures:summary.failures,output}));if(summary.failures)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
