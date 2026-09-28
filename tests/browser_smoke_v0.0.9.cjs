'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const {buildSystemDisk}=require('../src/firmware/shino80/shino80-system-disk.js');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'deploy','one_page_shino80_v0.0.9_z80_base_complete.html'),'utf8');
const executablePath=process.env.CHROMIUM_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const expectedFactoryImage=Buffer.from(buildSystemDisk().image);

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],requests=[];
    const readVisibleMemoryText=async address=>{
      await page.locator('.bottom-nav button[data-view="memory"]').click();await page.waitForTimeout(80);
      await page.locator('#memoryAddress').fill(address);await page.locator('#memoryAddressForm').press('Enter');await page.waitForTimeout(80);
      const bytes=await page.locator('#memoryGrid [data-address]').allTextContents();
      return String.fromCharCode(...bytes.map(value=>parseInt(value,16)));
    };
    page.on('pageerror',error=>errors.push(String(error)));
    page.on('request',request=>requests.push(request.url()));
    await page.setContent(html,{waitUntil:'load'});await page.waitForTimeout(180);

    assert.equal(await page.locator('#selfTest').innerText(),'PHASE 2A.1 SELF TEST PASS');
    assert.equal(await page.locator('#machineState').innerText(),'POWER OFF');
    assert.equal(await page.locator('#runPauseBtn').isDisabled(),true);
    assert.equal(await page.locator('#referenceLink').getAttribute('href'),'https://shinomiya-daihanten.wos.ktsys.jp/works/lab/programs/shino80-reference.html');
    assert.equal(await page.locator('#referenceLink').getAttribute('target'),'_blank');
    assert.equal(await page.locator('.monitor-model').innerText(),'DM-80');
    assert.equal(await page.locator('.monitor-maker').innerText(),'SHINOMIYA');
    assert.equal(await page.locator('#crtViewport').getAttribute('data-render-mode'),'AA');

    const canvasBox=await page.locator('#crtCanvas').boundingBox(),viewportBox=await page.locator('#crtViewport').boundingBox();
    assert(Math.abs(canvasBox.width-viewportBox.width)<1.5);
    assert(Math.abs(canvasBox.height-viewportBox.height)<1.5);
    assert(Math.abs(viewportBox.width/viewportBox.height-1.6)<0.02);

    // Compact/mobile uses a Human-visible inline Device inspector. Exercise the
    // complete EJECT -> MON fallback -> REINSERT -> CP/M lifecycle through it.
    await page.locator('.bottom-nav button[data-view="devices"]').click();await page.waitForTimeout(80);
    const disk=page.locator('[data-device="disk-a"]');
    assert((await disk.innerText()).includes('VIRTUAL DISK A'));assert((await disk.innerText()).includes('OFF'));
    await disk.click();await page.waitForTimeout(80);
    const compactInspector=page.locator('#compactDeviceInspector');
    assert.equal(await compactInspector.isVisible(),true);
    assert((await compactInspector.innerText()).includes('INSERTED'));
    const compactEject=compactInspector.getByRole('button',{name:'EJECT',exact:true});
    const compactInsert=compactInspector.getByRole('button',{name:'INSERT EJECTED DISK',exact:true});
    const compactExport=compactInspector.getByRole('button',{name:'EXPORT IMAGE',exact:true});
    assert.equal(await compactEject.isEnabled(),true);assert.equal(await compactInsert.isDisabled(),true);
    assert.equal(await compactExport.isEnabled(),true);
    await page.evaluate(()=>{
      const NativeBlob=Blob,nativeRevoke=URL.revokeObjectURL.bind(URL);
      globalThis.__driveAExportBlobType='';globalThis.__driveAExportRevokeCount=0;
      globalThis.Blob=function(parts,options){globalThis.__driveAExportBlobType=options?.type||'';return new NativeBlob(parts,options);};
      URL.revokeObjectURL=url=>{globalThis.__driveAExportRevokeCount++;nativeRevoke(url);};
    });
    const traceBeforeExport=await page.locator('#traceSummary').innerText();
    const [insertedDownload]=await Promise.all([page.waitForEvent('download'),compactExport.click()]);
    assert.equal(insertedDownload.suggestedFilename(),'SHINO80_DRIVE_A.s80d');
    const insertedBytes=fs.readFileSync(await insertedDownload.path());
    assert.equal(insertedBytes.length,256256);assert.deepEqual(insertedBytes,expectedFactoryImage);
    assert.equal(await page.evaluate(()=>globalThis.__driveAExportBlobType),'application/octet-stream');
    assert.equal(await page.evaluate(()=>globalThis.__driveAExportRevokeCount),0,'object URL must not be revoked synchronously');
    assert((await compactInspector.innerText()).includes('INSERTED'));
    assert.equal(await page.locator('#traceSummary').innerText(),traceBeforeExport);
    const traceBeforeEject=await page.locator('#traceSummary').innerText();
    await compactEject.click();await page.waitForTimeout(80);
    assert((await compactInspector.innerText()).includes('EJECTED'));
    assert.equal(await compactEject.isDisabled(),true);assert.equal(await compactInsert.isEnabled(),true);
    assert.equal(await compactExport.isEnabled(),true);
    assert.equal(await page.locator('#traceSummary').innerText(),traceBeforeEject);
    const traceBeforeShelfExport=await page.locator('#traceSummary').innerText();
    const [ejectedDownload]=await Promise.all([page.waitForEvent('download'),compactExport.click()]);
    assert.equal(ejectedDownload.suggestedFilename(),'SHINO80_DRIVE_A.s80d');
    const ejectedBytes=fs.readFileSync(await ejectedDownload.path());
    assert.deepEqual(ejectedBytes,insertedBytes);
    assert((await compactInspector.innerText()).includes('EJECTED'));
    assert.equal(await compactInsert.isEnabled(),true);
    assert.equal(await page.locator('#traceSummary').innerText(),traceBeforeShelfExport);

    await page.locator('#powerBtn').click();await page.waitForTimeout(100);
    assert.equal(await compactEject.isDisabled(),true);assert.equal(await compactInsert.isDisabled(),true);assert.equal(await compactExport.isDisabled(),true);
    assert((await disk.innerText()).includes('EMPTY'));
    const noPoweredDownload=page.waitForEvent('download',{timeout:300});
    await compactExport.evaluate(button=>button.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    await assert.rejects(noPoweredDownload,/Timeout/);
    assert((await compactInspector.innerText()).includes('EJECTED'),'powered export handler must preserve ejected media');
    assert.equal(await page.locator('#traceSummary').innerText(),traceBeforeShelfExport);
    await compactInsert.evaluate(button=>button.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    assert((await compactInspector.innerText()).includes('EJECTED'),'powered action handler must reject reinsertion');
    await page.locator('#runPauseBtn').click();await page.waitForTimeout(900);await page.locator('#runPauseBtn').click();
    const monitorText=await readVisibleMemoryText('C000');
    assert(monitorText.includes('MON'),monitorText);assert(!monitorText.includes('SHINO-80 CP/M 2.2'),monitorText);

    await page.locator('#powerBtn').click();await page.waitForTimeout(80);
    await page.locator('.bottom-nav button[data-view="devices"]').click();await disk.click();await page.waitForTimeout(80);
    assert.equal(await compactInsert.isEnabled(),true);
    const traceBeforeInsert=await page.locator('#traceSummary').innerText();
    await compactInsert.click();await page.waitForTimeout(80);
    assert((await compactInspector.innerText()).includes('INSERTED'));
    assert.equal(await compactEject.isEnabled(),true);assert.equal(await compactInsert.isDisabled(),true);
    assert.equal(await page.locator('#traceSummary').innerText(),traceBeforeInsert);
    await page.locator('#powerBtn').click();await page.waitForTimeout(100);
    assert.equal(await compactEject.isDisabled(),true);assert.equal(await compactInsert.isDisabled(),true);
    assert((await disk.innerText()).includes('READY'));
    await compactEject.evaluate(button=>button.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    assert((await compactInspector.innerText()).includes('INSERTED'),'powered action handler must reject eject');
    await page.locator('#runPauseBtn').click();await page.waitForTimeout(1200);await page.locator('#runPauseBtn').click();
    const cpmText=await readVisibleMemoryText('C000');
    assert(cpmText.includes('SHINO-80 CP/M 2.2'),cpmText);assert(cpmText.includes('A>'),cpmText);

    await page.locator('#moreBtn').click();await page.locator('[data-more-action="pace"]').click();
    await page.locator('#moreCloseBtn').click();await page.waitForTimeout(220);

    await page.locator('#runPauseBtn').click();
    await page.locator('.bottom-nav button[data-view="bus"]').click();
    await page.waitForFunction(()=>document.querySelector('#busTrace')?.textContent.includes('IO_READ'),null,{timeout:4000});
    await page.locator('#runPauseBtn').click();await page.waitForTimeout(100);
    await page.locator('.bottom-nav button[data-view="display"]').click();

    const before=await page.locator('#crtCanvas').evaluate(canvas=>canvas.toDataURL());
    await page.locator('#runPauseBtn').click();await page.locator('#moreBtn').click();
    await page.locator('[data-more-action="keyboard"]').click();
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'keyboardCapture');
    assert.equal(await page.locator('#app').evaluate(app=>app.classList.contains('keyboard-mode')),true);
    assert.equal(await page.locator('.toolbar').evaluate(element=>getComputedStyle(element).display),'none');
    assert.equal(await page.locator('.bottom-nav').evaluate(element=>getComputedStyle(element).display),'none');
    await page.waitForFunction(previous=>document.querySelector('#crtCanvas').toDataURL()!==previous,before,{timeout:4000});
    await page.waitForTimeout(1200);
    await page.keyboard.type('dir');await page.keyboard.press('Enter');await page.waitForTimeout(500);
    const cursorFrames=new Set();
    for(let i=0;i<6;i++){cursorFrames.add(await page.locator('#crtCanvas').evaluate(canvas=>canvas.toDataURL()));await page.waitForTimeout(180);}
    assert(cursorFrames.size>=2);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);

    await page.locator('#keyboardCapture').evaluate(element=>element.blur());
    await page.locator('#runPauseBtn').click();await page.waitForTimeout(100);
    assert.equal(await page.locator('#app').evaluate(app=>app.classList.contains('keyboard-mode')),false);
    await page.locator('#moreBtn').click();await page.locator('[data-more-action="beep"]').click();await page.waitForTimeout(100);

    await page.locator('.bottom-nav button[data-view="memory"]').click();await page.waitForTimeout(80);
    await page.locator('#memoryAddress').fill('0000');await page.locator('#memoryAddressForm').press('Enter');await page.waitForTimeout(80);
    assert.equal(await page.locator('[data-address="0000"]').innerText(),'C3');
    assert.equal(await page.locator('[data-address="0001"]').innerText(),'03');
    assert.equal(await page.locator('[data-address="0002"]').innerText(),'FA');
    await page.locator('#memoryAddress').fill('9400');await page.locator('#memoryAddressForm').press('Enter');await page.waitForTimeout(80);
    let bytes='';for(let i=0;i<4;i++)bytes+=await page.locator(`[data-address="940${i}"]`).innerText();
    assert.equal(bytes,'C35C97C3');assert((await page.locator('#inspectorContent').innerText()).includes('FULL RAM'));

    await page.locator('.bottom-nav button[data-view="cpu"]').click();await page.waitForTimeout(80);
    assert((await page.locator('#inspectorContent').innerText()).includes('BASE 252/252 ONLINE'));

    await page.locator('.bottom-nav button[data-view="devices"]').click();await page.waitForTimeout(80);
    const beeper=page.locator('[data-device="beeper"]');assert((await beeper.innerText()).includes('ONE-BIT BEEPER'));
    await beeper.click();await page.waitForTimeout(80);
    let inspector=await page.locator('#inspectorContent').innerText();
    assert(inspector.includes('I/O 40h'));assert(inspector.replaceAll('\n','').replaceAll(' ','').includes('Count1'));

    const diskText=await disk.innerText();
    assert(diskText.includes('VIRTUAL DISK A'));assert(diskText.includes('READY'));
    await disk.click();await page.waitForTimeout(80);inspector=await page.locator('#inspectorContent').innerText();
    for(const expected of ['INSERTED','77 TRACKS × 26 SECTORS','256,256 BYTES','30h–36h','S80B v2 · CP/M 2.2','WELCOME.TXT','HELLO.COM','S80INFO.COM','A:','AUTOBOOT','MON O','IDLE'])assert(inspector.includes(expected),`${expected}\n${inspector}`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);

    await page.setViewportSize({width:1280,height:900});await page.waitForTimeout(180);
    assert.notEqual(await page.locator('.toolbar').evaluate(element=>getComputedStyle(element).display),'none');
    assert.notEqual(await page.locator('#inspectorContent').evaluate(element=>getComputedStyle(element).display),'none');
    const desktopInspector=page.locator('#inspectorContent');
    assert.equal(await desktopInspector.getByRole('button',{name:'EJECT',exact:true}).isVisible(),true);
    assert.equal(await desktopInspector.getByRole('button',{name:'EJECT',exact:true}).isDisabled(),true);
    assert.equal(await desktopInspector.getByRole('button',{name:'INSERT EJECTED DISK',exact:true}).isDisabled(),true);
    assert.equal(await desktopInspector.getByRole('button',{name:'EXPORT IMAGE',exact:true}).isVisible(),true);
    assert.equal(await desktopInspector.getByRole('button',{name:'EXPORT IMAGE',exact:true}).isDisabled(),true);
    assert((await desktopInspector.innerText()).includes('EXPORT is read-only but POWER-OFF-only in v0.1.'));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);

    await page.setViewportSize({width:900,height:400});await page.waitForTimeout(180);
    assert.equal(await page.locator('#inspector').evaluate(element=>getComputedStyle(element).display),'none');
    assert.equal(await compactInspector.isVisible(),true);
    assert.equal(await compactInspector.getByRole('button',{name:'EJECT',exact:true}).isVisible(),true);
    assert.equal(await compactInspector.getByRole('button',{name:'EXPORT IMAGE',exact:true}).isVisible(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
    console.log('v0.0.9 Chromium DRIVE A export + CP/M machine regression PASS');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
