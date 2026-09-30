'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {F000,F001,foreign,fdi,d88}=require('./fixtures/shino80_phase4_fixtures.cjs');
const native=require('../src/devices/shino80/shino80-media-profiles.js');
const media=require('../src/host/shino80-foreign-media.js');
const generated=fs.readFileSync(path.join(__dirname,'../deploy/one_page_shino80_v0.0.9_z80_base_complete.html'),'utf8');
// Test-only observer handles. No public debugger execution hook in the product.
const html=generated.replace('  const cpu=new Z80Core(bus);','  window.__testBus=bus;window.__testDisk=diskA;\n  const cpu=new Z80Core(bus);');assert.notEqual(html,generated);
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox','--disable-gpu']});
  try{for(const viewport of [{width:390,height:844},{width:1280,height:900},{width:900,height:400}]){
    const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setContent(html);await page.waitForTimeout(40);
    const compact=viewport.width<720||viewport.height<500,inspector=page.locator(compact?'#compactDeviceInspector':'#inspectorContent');
    const button=name=>inspector.getByRole('button',{name,exact:true}),field=name=>inspector.locator(`[data-foreign-field="${name}"]`);
    const bridge=async()=>{await page.locator('[data-view="devices"]:visible').first().click();await page.locator('[data-device="foreign-bridge"]').click();};
    const drive=async()=>{await page.locator('[data-device="disk-b"]').click();};
    const open=async(bytes,name='synthetic.bin')=>{const promise=page.waitForEvent('filechooser');await button('OPEN FOREIGN IMAGE').click();await (await promise).setFiles({name,mimeType:'application/octet-stream',buffer:Buffer.from(bytes)});await page.waitForTimeout(50);};
    const snapshot=()=>page.evaluate(()=>({a:Array.from(__testDisk.exportImage({drive:0})||[]),b:Array.from(__testDisk.exportImage({drive:1})||[]),sequence:__testBus.sequence}));
    const initial=await snapshot();await bridge();
    await open(new Uint8Array(10),'invalid.d88');assert((await inspector.innerText()).includes('FAILED'));
    const original=foreign(F000,[{name:'HELLO.COM',user:0,bytes:new Uint8Array(128).fill(0x1A)},{name:'OTHER.BIN',user:15,bytes:new Uint8Array(128).fill(15)}]);
    const first=d88(original.raw),second=d88(foreign(F001).raw,F001),multi=new Uint8Array(first.length+second.length);multi.set(first);multi.set(second,first.length);
    await open(multi,'renamed.fdi');assert.equal(await field('profile').inputValue(),'');assert.equal(await field('disk').locator('option').count(),2);
    await field('disk').selectOption('1');await field('profile').selectOption('F001');assert((await inspector.innerText()).includes('PROFILE_MATCHED'));
    await field('disk').selectOption('0');assert.equal(await field('profile').inputValue(),'');await field('profile').selectOption('F000');
    await field('user').selectOption('15');assert.equal(await field('file').count(),1);await field('file').check();await field('user').selectOption('all');assert.equal(await field('file').count(),2);await field('file').first().check();
    for(const p of native.MEDIA_PROFILES){await field('destination').selectOption(String(p.id));await button('BUILD SHINO DISK').click();assert((await inspector.innerText()).includes('BUILT'));const event=page.waitForEvent('download');await button('DOWNLOAD .s80d').click();const download=await event,stream=await download.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);const bytes=Buffer.concat(chunks);assert.equal(bytes.length,p.imageBytes);assert.deepEqual(bytes,Buffer.from(media.buildNative(media.readFilesystem(media.parse(first).disks[0],'F000').files,p.id).bytes));}
    assert.deepEqual(await snapshot(),initial,'Host open/select/build/download do not touch A/B or Bus');
    await field('destination').selectOption('0');await button('BUILD SHINO DISK').click();await button('SEND TO NATIVE IMPORT B').click();assert.deepEqual(await snapshot(),initial,'Pending send is not a mount');await drive();
    assert((await inspector.innerText()).includes('IMPORT PENDING'));await button('CANCEL').click();assert.deepEqual(await snapshot(),initial);
    await bridge();await button('SEND TO NATIVE IMPORT B').click();await drive();await button('CONFIRM IMPORT').click();const after=await snapshot();assert.deepEqual(after.a,initial.a);assert.equal(after.sequence,initial.sequence);assert.notDeepEqual(after.b,initial.b);
    // EJECTED target replacement retains ownership until explicit reinsert.
    await button('EJECT').click();const shelf=await snapshot();await bridge();await button('SEND TO NATIVE IMPORT B').click();await drive();assert(await button('INSERT EJECTED DISK').isDisabled());await button('CONFIRM IMPORT').click();assert((await inspector.innerText()).includes('EJECTED'));await button('INSERT EJECTED DISK').click();
    // POWER discards pending; ownership race is rejected by existing commit guard.
    await bridge();await button('SEND TO NATIVE IMPORT B').click();await page.locator('#powerBtn').click();await page.locator('#powerBtn').click();await drive();assert.equal(await button('CONFIRM IMPORT').count(),0);
    await bridge();await button('SEND TO NATIVE IMPORT B').click();await page.evaluate(()=>__testDisk.eject({drive:1}));await drive();await button('CONFIRM IMPORT').click();assert((await inspector.innerText()).includes('OWNERSHIP CHANGED'));
    await bridge();await open(fdi(foreign(F001).raw,F001));await field('profile').selectOption('F001');await field('file').check();await button('BUILD SHINO DISK').click();assert((await inspector.innerText()).includes('BUILT'));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');assert.deepEqual(errors,[]);
    await page.screenshot({path:`/tmp/shino80-phase4-${viewport.width}x${viewport.height}.png`,fullPage:true});
    console.log(`PHASE 4 BROWSER ${viewport.width}x${viewport.height}: bridge/selection/capacity/download/pending/cancel/power/ownership/bus PASS`);await page.close();
  }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
