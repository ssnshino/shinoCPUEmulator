'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const profiles=require('../src/devices/shino80/shino80-media-profiles.js');
const {buildSystemDiskV3}=require('../src/firmware/shino80/shino80-system-disk.js');

const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'deploy','one_page_shino80_v0.0.9_z80_base_complete.html'),'utf8');
const executablePath=process.env.CHROMIUM_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',error=>errors.push(String(error)));
    await page.setContent(html,{waitUntil:'load'});await page.waitForTimeout(100);
    const inspector=page.locator('#compactDeviceInspector'),button=name=>inspector.getByRole('button',{name,exact:true});
    const selectDrive=async drive=>{await page.locator('button[data-view="devices"]:visible').click();await page.locator(`[data-device="disk-${drive?'b':'a'}"]`).click();await page.waitForTimeout(30);};
    const chooseImport=async(bytes,name)=>{const chooserPromise=page.waitForEvent('filechooser');await button('IMPORT / REPLACE DISK IMAGE').click();const chooser=await chooserPromise;await chooser.setFiles({name,mimeType:'application/octet-stream',buffer:Buffer.from(bytes)});await page.waitForTimeout(80);};
    const exportImage=async()=>{const downloadPromise=page.waitForEvent('download');await button('EXPORT DISK IMAGE').click();const download=await downloadPromise,stream=await download.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);return Buffer.concat(chunks);};
    await selectDrive(1);
    for(const profile of profiles.MEDIA_PROFILES){
      const image=profiles.createBlankMediaImage(profile.id,{fill:0x40+profile.id});
      await chooseImport(image,`${profile.name}.s80d`);const pending=await inspector.innerText();assert(pending.includes(`${profile.id.toString(16).padStart(2,'0').toUpperCase()}h ${profile.name}`));assert(pending.includes(`${profile.cylinders}C × ${profile.heads}H × ${profile.physicalSectorsPerTrack}S`));
      await button('CONFIRM IMPORT').click();await page.waitForTimeout(30);assert.deepEqual(await exportImage(),Buffer.from(image));
      await button('EJECT').click();assert((await inspector.innerText()).includes('EJECTED'));assert((await inspector.innerText()).includes(profile.name));
      await button('INSERT EJECTED DISK').click();assert((await inspector.innerText()).includes('INSERTED'));assert((await inspector.innerText()).includes(profile.name));
    }
    await chooseImport(Buffer.alloc(123),'unsupported.s80d');assert((await inspector.innerText()).includes('IMPORT REJECTED — UNSUPPORTED MEDIA SIZE: 123 BYTES'));

    const system=buildSystemDiskV3();await selectDrive(0);await chooseImport(system.image,'SHINO80_2HD_JP_SYSTEM.s80d');assert((await inspector.innerText()).includes('01h 2HD-JP'));await button('CONFIRM IMPORT').click();
    await page.locator('#powerBtn').click();await page.locator('#runPauseBtn').click();await page.waitForTimeout(1800);await page.locator('#runPauseBtn').click();
    let display='';for(let address=0xC000;address<=0xC700;address+=0x100){await page.locator('.bottom-nav button[data-view="memory"]').click();await page.locator('#memoryAddress').fill(address.toString(16));await page.locator('#memoryAddressForm').press('Enter');await page.waitForTimeout(20);display+=String.fromCharCode(...(await page.locator('#memoryGrid [data-address]').allTextContents()).map(value=>parseInt(value,16)));}
    assert(display.includes('SHINO-80 CP/M 2.2'),display);assert(display.includes('A>'),display);assert.deepEqual(errors,[]);
    console.log('SHINO-80 PHASE 3 CHECKPOINT E: MULTI-PROFILE HOST IMPORT / EXPORT / BOOT PASS');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
