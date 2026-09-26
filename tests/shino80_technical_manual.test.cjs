'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const {buildData,build}=require('../scripts/build-technical-manual.cjs');
const data=buildData(),byId=Object.fromEntries(data.instructions.map(i=>[i.id,i]));
assert.equal(data.instructions.length,1780);assert.equal(Object.keys(byId).length,1780);
for(const [family,count] of Object.entries({BASE:252,CB:256,ED:256,DD:252,FD:252,DDCB:256,FDCB:256}))assert.equal(data.instructions.filter(i=>i.family===family).length,count,family);
for(const i of data.instructions){
 assert.equal(i.tokens.length,i.length,i.id);assert.equal(i.example.bytes.length,i.length,i.id);
 assert.equal(i.flags.length,6,i.id);assert(i.action.length>0,i.id);
 assert(['official','undocumented','alias','ignored','unused'].includes(i.classification),i.id);
 assert(!i.extra.some(s=>!s||s.includes('undefined')),i.id);
 const timings=i.timing.match(/\d+/g).map(Number);assert(timings.includes(i.example.tStates),i.id+' timing');
 assert(i.example.bytes.every(b=>Number.isInteger(b)&&b>=0&&b<=255),i.id);
 for(const [j,mask] of [128,64,16,4,2,1].entries()){
  const rule=i.flags[j],before=i.example.before.f&mask,after=i.example.after.f&mask;
  if(rule==='—')assert.equal(after,before,i.id+' preserved flag '+j);
  if(rule==='0'||rule==='1')assert.equal(after,Number(rule)*mask,i.id+' fixed flag '+j);
 }
}
const checks={
 'BASE-01':{tokens:['01','lo','hi'],timing:'10'},
 'BASE-3E':{tokens:['3E','n'],timing:'7'},
 'BASE-C4':{timing:'成立 17 / 不成立 10'},
 'DD-36':{tokens:['DD','36','d','n'],timing:'19'},
 'DDCB-46':{tokens:['DD','CB','d','46'],timing:'20',classification:'official'},
 'DDCB-40':{classification:'alias'},'DDCB-00':{classification:'undocumented'},
 'DD-00':{classification:'ignored'},'FD-24':{classification:'undocumented'},
 'CB-30':{classification:'undocumented'},'ED-00':{classification:'unused'},
 'ED-63':{classification:'alias'},'ED-B0':{timing:'継続 21 / 終了 16'}
};
for(const [id,fields] of Object.entries(checks))for(const [key,value] of Object.entries(fields))assert.deepEqual(byId[id][key],value,id+' '+key);
assert.equal(byId['BASE-3E'].example.after.a,0x42);
assert.equal(byId['BASE-01'].example.after.b,0x40);assert.equal(byId['BASE-01'].example.after.c,0);
assert.equal(byId['BASE-C3'].example.after.pc,0x4000);
assert.equal(byId['BASE-18'].example.after.pc,0x2004);
assert.deepEqual(byId['DD-36'].example.memory,[{address:0x4002,before:0x55,after:0x42}]);
assert.equal(byId['CB-00'].example.after.b,4);
assert.equal(byId['BASE-D9'].example.after.bAlt,2);assert.equal(byId['BASE-08'].example.after.aAlt,0x42);
assert.deepEqual(byId['BASE-00'].flags,['—','—','—','—','—','—']);
assert.deepEqual(byId['BASE-A0'].flags,['結果','結果','1','偶数パリティ','0','0']);
assert(byId['CB-46'].xy.includes('WZ'));assert(byId['DDCB-46'].xy.includes('実効アドレス'));
assert.equal(data.machine.romSize,16384);assert.equal(data.machine.bootRomSize,8192);assert.equal(data.machine.extensionRomSize,8192);
assert.equal(data.machine.memoryControlPort,0);assert.equal(data.machine.vramBase,0xC000);assert.equal(data.machine.vramCells,2000);
assert.equal(data.machine.width,640);assert.equal(data.machine.height,400);
assert.equal(data.machine.keyData,0x20);assert.equal(data.machine.keyStatus,0x21);assert.equal(data.machine.fifoCapacity,64);
assert.equal(data.machine.labels.BIOS_API_GETLINE,0x10F);assert.equal(data.machine.labels.BIOS_API_RAM_HANDOFF,0x11E);
assert.equal(data.machine.ramHandoffTrampoline,0xF800);assert.equal(data.machine.ramHandoffDemoEntry,0x8000);assert.equal(data.machine.ramHandoffSignature,0xE180);
assert.equal(data.machine.systemDiskMagic,'S80B');assert.equal(data.machine.systemDiskVersion,1);assert.equal(data.machine.systemDiskEntry,0x8000);assert.equal(data.machine.systemDiskHeader.length,17);
assert.equal(data.machine.cgBytes.length,4096);
assert.equal(crypto.createHash('sha256').update(Buffer.from(data.machine.cgBytes)).digest('hex'),data.machine.cgHash);
const html=build();assert.equal(build(),html,'deterministic output');
assert(!/\/\* MANUAL_(CSS|DATA|JS) \*\//.test(html));
assert(!/<(?:script[^>]*src|link[^>]*href|img[^>]*src)=/i.test(html),'standalone assets');
const embedded=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(embedded.length,2);
for(const [,source] of embedded)new vm.Script(source);
const box={window:{}};vm.runInNewContext(embedded[0][1],box);assert.equal(box.window.MANUAL_DATA.instructions.length,1780);
assert.equal(fs.readFileSync('deploy/shino80_technical_manual_v0.1.html','utf8'),html);
console.log('SHINO-80 TECHNICAL MANUAL: 1780 encoding invariants + fixtures + deterministic offline build PASS');
