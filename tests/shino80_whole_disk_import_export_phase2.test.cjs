'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'deploy','one_page_shino80_v0.0.9_z80_base_complete.html'),'utf8');
const executablePath=process.env.CHROMIUM_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const IMAGE_SIZE=256256;

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],requests=[];
    page.on('pageerror',error=>errors.push(String(error)));
    page.on('request',request=>requests.push(request.url()));
    await page.setContent(html,{waitUntil:'load'});await page.waitForTimeout(120);

    const inspector=page.locator('#compactDeviceInspector');
    const diskA=page.locator('[data-device="disk-a"]'),diskB=page.locator('[data-device="disk-b"]');
    const button=name=>inspector.getByRole('button',{name,exact:true});
    const selectDrive=async drive=>{await page.locator('button[data-view="devices"]:visible').click();await (drive===0?diskA:diskB).click();await page.waitForTimeout(40);};
    const waitText=async text=>page.waitForFunction(expected=>document.querySelector('#compactDeviceInspector')?.innerText.includes(expected),text,{timeout:3000});
    const chooseImport=async (bytes,name)=>{
      const chooserPromise=page.waitForEvent('filechooser');
      await button('IMPORT / REPLACE DISK IMAGE').click();
      const chooser=await chooserPromise;
      await chooser.setFiles({name,mimeType:'application/octet-stream',buffer:Buffer.from(bytes)});
      await page.waitForTimeout(80);
    };
    const exportImage=async()=>{
      const downloadPromise=page.waitForEvent('download');
      await button('EXPORT DISK IMAGE').click();
      const download=await downloadPromise,stream=await download.createReadStream(),chunks=[];
      for await(const chunk of stream)chunks.push(chunk);
      return {name:download.suggestedFilename(),bytes:Buffer.concat(chunks)};
    };
    const readVisibleMemoryText=async address=>{
      await page.locator('.bottom-nav button[data-view="memory"]').click();await page.waitForTimeout(35);
      await page.locator('#memoryAddress').fill(address);await page.locator('#memoryAddressForm').press('Enter');await page.waitForTimeout(35);
      return String.fromCharCode(...(await page.locator('#memoryGrid [data-address]').allTextContents()).map(value=>parseInt(value,16)));
    };
    const readDisplayMemoryText=async()=>{let text='';for(let address=0xC000;address<=0xC700;address+=0x100)text+=await readVisibleMemoryText(address.toString(16));return text;};
    const typeCpmCommand=async text=>{await page.keyboard.type(text);await page.keyboard.press('Enter');await page.waitForTimeout(650);};
    const bootAndPause=async delay=>{await page.locator('#powerBtn').click();await page.locator('#runPauseBtn').click();await page.waitForTimeout(delay);await page.locator('#runPauseBtn').click();};
    const powerOff=async()=>{if(await page.locator('#powerBtn').getAttribute('aria-pressed')==='true'){await page.locator('#powerBtn').click();await page.waitForTimeout(60);}};

    await selectDrive(0);
    let exported=await exportImage();
    assert.equal(exported.name,'SHINO80_DRIVE_A.s80d');assert.equal(exported.bytes.length,IMAGE_SIZE);
    assert.equal(exported.bytes.subarray(0,4).toString('ascii'),'S80B');
    const systemImage=Buffer.from(exported.bytes);

    await selectDrive(1);
    exported=await exportImage();
    assert.equal(exported.name,'SHINO80_DRIVE_B.s80d');assert.equal(exported.bytes.length,IMAGE_SIZE);
    assert(exported.bytes.every(byte=>byte===0xE5));
    const blankImage=Buffer.from(exported.bytes),patternImage=Buffer.alloc(IMAGE_SIZE,0x5A);
    const traceBefore=await page.locator('#traceSummary').innerText();

    // INSERTED pending is transactional. EXPORT remains available and byte exact,
    // while target EJECT and every second IMPORT entry point are disabled.
    await chooseImport(patternImage,'pattern.s80d');await waitText('IMPORT PENDING');
    assert((await inspector.innerText()).includes('pattern.s80d'));assert((await inspector.innerText()).includes('INSERTED'));
    assert.equal(await button('EJECT').isDisabled(),true);
    await button('EJECT').evaluate(element=>element.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    assert((await inspector.innerText()).includes('INSERTED'));
    exported=await exportImage();assert.deepEqual(exported.bytes,blankImage);
    await selectDrive(0);assert.equal(await button('IMPORT / REPLACE DISK IMAGE').isDisabled(),true);assert.equal(await button('EXPORT DISK IMAGE').isEnabled(),true);
    await selectDrive(1);await button('CONFIRM IMPORT').click();await waitText('IMPORT COMPLETE');
    assert((await inspector.innerText()).includes('INSERTED'));exported=await exportImage();assert.deepEqual(exported.bytes,patternImage);
    assert.equal(await page.locator('#traceSummary').innerText(),traceBefore,'host media actions must not fabricate Bus events');

    await chooseImport(blankImage,'cancel.s80d');await waitText('IMPORT PENDING');await button('CANCEL').click();await waitText('EXISTING MEDIUM UNCHANGED');
    exported=await exportImage();assert.deepEqual(exported.bytes,patternImage);

    await chooseImport(Buffer.alloc(100),'wrong-size.bin');await waitText('IMPORT REJECTED');
    assert((await inspector.innerText()).includes('EXPECTED 256,256 BYTES'));exported=await exportImage();assert.deepEqual(exported.bytes,patternImage);

    await page.evaluate(()=>{globalThis.__s80RealArrayBuffer=File.prototype.arrayBuffer;File.prototype.arrayBuffer=()=>Promise.reject(new Error('test read failure'));});
    await chooseImport(blankImage,'read-failure.s80d');await waitText('FILE READ FAILED');
    await page.evaluate(()=>{File.prototype.arrayBuffer=globalThis.__s80RealArrayBuffer;delete globalThis.__s80RealArrayBuffer;});
    exported=await exportImage();assert.deepEqual(exported.bytes,patternImage);

    // Async reads still revalidate ownership: a state change before pending is
    // established rejects the candidate without touching either copy.
    await page.evaluate(()=>{
      globalThis.__s80RealArrayBuffer=File.prototype.arrayBuffer;
      File.prototype.arrayBuffer=function(){
        const file=this;
        return new Promise((resolve,reject)=>{globalThis.__s80ResolveArrayBuffer=()=>globalThis.__s80RealArrayBuffer.call(file).then(resolve,reject);});
      };
    });
    await chooseImport(blankImage,'ownership-change.s80d');
    await button('EJECT').click();await waitText('EJECTED');
    await page.evaluate(()=>globalThis.__s80ResolveArrayBuffer());await waitText('MEDIA OWNERSHIP CHANGED WHILE READING');
    await page.evaluate(()=>{File.prototype.arrayBuffer=globalThis.__s80RealArrayBuffer;delete globalThis.__s80RealArrayBuffer;delete globalThis.__s80ResolveArrayBuffer;});
    exported=await exportImage();assert.deepEqual(exported.bytes,patternImage);

    // EJECTED shelf IMPORT replaces shelf bytes but does not insert the disk.
    await chooseImport(blankImage,'blank-ejected.s80d');await waitText('IMPORT PENDING');
    assert.equal(await button('INSERT EJECTED DISK').isDisabled(),true);
    await button('INSERT EJECTED DISK').evaluate(element=>element.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    assert((await inspector.innerText()).includes('EJECTED'));
    await button('CONFIRM IMPORT').click();await waitText('IMPORT COMPLETE');
    assert((await inspector.innerText()).includes('EJECTED'));exported=await exportImage();assert.deepEqual(exported.bytes,blankImage);
    await chooseImport(patternImage,'pattern-ejected.s80d');await waitText('IMPORT PENDING');await button('CONFIRM IMPORT').click();
    assert((await inspector.innerText()).includes('EJECTED'));exported=await exportImage();assert.deepEqual(exported.bytes,patternImage);
    await button('INSERT EJECTED DISK').click();assert((await inspector.innerText()).includes('INSERTED'));

    // POWER ON immediately discards pending state and both handler/UI guards hold.
    await chooseImport(blankImage,'power-cancel.s80d');await waitText('IMPORT PENDING');
    await page.locator('#powerBtn').click();await page.waitForTimeout(60);assert(!(await inspector.innerText()).includes('IMPORT PENDING'));
    assert((await inspector.innerText()).includes('POWER TURNED ON'));
    assert.equal(await button('EXPORT DISK IMAGE').isDisabled(),true);assert.equal(await button('IMPORT / REPLACE DISK IMAGE').isDisabled(),true);
    await button('EXPORT DISK IMAGE').evaluate(element=>element.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    await button('IMPORT / REPLACE DISK IMAGE').evaluate(element=>element.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    assert(!(await inspector.innerText()).includes('IMPORT PENDING'));
    await powerOff();await selectDrive(1);exported=await exportImage();assert.deepEqual(exported.bytes,patternImage);

    // Restore a valid blank B:, boot A:, create WORK.COM through CP/M, then prove
    // EXPORT -> replacement -> IMPORT restores guest-visible filesystem data.
    await chooseImport(blankImage,'blank-b.s80d');await waitText('IMPORT PENDING');await button('CONFIRM IMPORT').click();
    await bootAndPause(1200);let displayText=await readDisplayMemoryText();assert(displayText.includes('A>'),displayText);
    await page.locator('#runPauseBtn').click();await page.locator('#moreBtn').click();await page.locator('[data-more-action="keyboard"]').click();
    await typeCpmCommand('b:');await typeCpmCommand('save 1 work.com');await typeCpmCommand('dir');
    await page.locator('#keyboardCapture').evaluate(element=>element.blur());await page.locator('#runPauseBtn').click();
    displayText=await readDisplayMemoryText();assert.match(displayText,/WORK\s+COM/);
    await powerOff();await selectDrive(1);const workImage=(await exportImage()).bytes;
    await chooseImport(blankImage,'replace-b.s80d');await waitText('IMPORT PENDING');await button('CONFIRM IMPORT').click();
    exported=await exportImage();assert.deepEqual(exported.bytes,blankImage);
    await chooseImport(workImage,'work-b.s80d');await waitText('IMPORT PENDING');await button('CONFIRM IMPORT').click();
    await bootAndPause(1200);await page.locator('#runPauseBtn').click();await page.locator('#moreBtn').click();await page.locator('[data-more-action="keyboard"]').click();
    await typeCpmCommand('b:');await typeCpmCommand('dir');await page.locator('#keyboardCapture').evaluate(element=>element.blur());await page.locator('#runPauseBtn').click();
    displayText=await readDisplayMemoryText();assert.match(displayText,/WORK\s+COM/);

    // A accepts any correctly sized native payload without host-side boot repair.
    // A nonbootable image reaches ROM MON; re-importing the exact system image restores autoboot.
    await powerOff();await selectDrive(0);await chooseImport(Buffer.alloc(IMAGE_SIZE,0),'nonbootable-a.s80d');await waitText('IMPORT PENDING');
    assert((await inspector.innerText()).includes('Bootability is not checked'));await button('CONFIRM IMPORT').click();
    await bootAndPause(900);displayText=await readDisplayMemoryText();assert(displayText.includes('MON'),displayText);assert(!displayText.includes('SHINO-80 CP/M 2.2'),displayText);
    await powerOff();await selectDrive(0);await chooseImport(systemImage,'system-a.s80d');await waitText('IMPORT PENDING');await button('CONFIRM IMPORT').click();
    await bootAndPause(1200);displayText=await readDisplayMemoryText();assert(displayText.includes('SHINO-80 CP/M 2.2'),displayText);assert(displayText.includes('A>'),displayText);
    await powerOff();await selectDrive(0);exported=await exportImage();assert.deepEqual(exported.bytes,systemImage);

    for(const viewport of [{width:1280,height:900},{width:900,height:400},{width:390,height:844}]){
      await page.setViewportSize(viewport);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,JSON.stringify(viewport));
      await selectDrive(0);assert.equal(await page.locator('button[data-disk-action="export"]:visible').isVisible(),true);assert.equal(await page.locator('button[data-disk-action="import"]:visible').isVisible(),true);
    }
    assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
    console.log('SHINO-80 PHASE 2 whole-disk IMPORT + EXPORT Chromium regression PASS');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
