'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'deploy','one_page_shino80_v0.0.9_z80_base_complete.html'),'utf8');
const executablePath=process.env.CHROMIUM_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

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
    const readDisplayMemoryText=async()=>{
      let text='';
      for(let pageAddress=0xC000;pageAddress<=0xC700;pageAddress+=0x100)text+=await readVisibleMemoryText(pageAddress.toString(16));
      return text;
    };
    const typeCpmCommand=async text=>{await page.keyboard.type(text);await page.keyboard.press('Enter');await page.waitForTimeout(650);};
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

    // Compact/mobile uses one shared inline inspector for independent A/B media.
    await page.locator('.bottom-nav button[data-view="devices"]').click();await page.waitForTimeout(80);
    const diskA=page.locator('[data-device="disk-a"]'),diskB=page.locator('[data-device="disk-b"]');
    assert((await diskA.innerText()).includes('VIRTUAL DISK A'));assert((await diskA.innerText()).includes('OFF'));
    assert((await diskB.innerText()).includes('VIRTUAL DISK B'));assert((await diskB.innerText()).includes('OFF'));
    await diskA.click();await page.waitForTimeout(80);
    const compactInspector=page.locator('#compactDeviceInspector');
    assert.equal(await compactInspector.isVisible(),true);
    assert((await compactInspector.innerText()).includes('SYSTEM / TOOLS'));assert((await compactInspector.innerText()).includes('INSERTED'));
    const compactEject=compactInspector.getByRole('button',{name:'EJECT',exact:true});
    const compactInsert=compactInspector.getByRole('button',{name:'INSERT EJECTED DISK',exact:true});
    const compactExport=compactInspector.getByRole('button',{name:'EXPORT DISK IMAGE',exact:true});
    const compactImport=compactInspector.getByRole('button',{name:'IMPORT / REPLACE DISK IMAGE',exact:true});
    assert.equal(await compactEject.isEnabled(),true);assert.equal(await compactInsert.isDisabled(),true);
    assert.equal(await compactExport.isEnabled(),true);assert.equal(await compactImport.isEnabled(),true);
    await diskB.click();await page.waitForTimeout(80);
    assert((await compactInspector.innerText()).includes('USER / WORK / INTERCHANGE'));
    assert((await compactInspector.innerText()).includes('00h CLASSIC'));
    assert((await compactInspector.innerText()).includes('NOT AN AUTOBOOT SOURCE'));
    assert.equal(await compactEject.isEnabled(),true);assert.equal(await compactInsert.isDisabled(),true);

    // Boot from A:, switch through the real CCP to blank B:, and create WORK.COM.
    await page.locator('#powerBtn').click();await page.waitForTimeout(100);
    assert.equal(await compactEject.isDisabled(),true);assert.equal(await compactInsert.isDisabled(),true);
    assert.equal(await compactExport.isDisabled(),true);assert.equal(await compactImport.isDisabled(),true);
    await compactEject.evaluate(button=>button.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    assert((await compactInspector.innerText()).includes('INSERTED'),'powered B handler must reject eject');
    await page.locator('#runPauseBtn').click();await page.waitForTimeout(1200);
    await page.locator('#moreBtn').click();await page.locator('[data-more-action="keyboard"]').click();
    await typeCpmCommand('b:');await typeCpmCommand('dir');await typeCpmCommand('save 1 work.com');await typeCpmCommand('dir');
    await page.locator('#keyboardCapture').evaluate(element=>element.blur());await page.locator('#runPauseBtn').click();
    let displayText=await readDisplayMemoryText();
    assert(displayText.includes('B>'),displayText);assert(displayText.includes('NO FILE'),displayText);assert.match(displayText,/WORK\s+COM/);

    // POWER OFF B-only EJECT/REINSERT preserves A and does not fabricate Bus events.
    await page.locator('#powerBtn').click();await page.waitForTimeout(80);
    await page.locator('.bottom-nav button[data-view="devices"]').click();await diskB.click();await page.waitForTimeout(80);
    const traceBeforeBEject=await page.locator('#traceSummary').innerText();
    await compactEject.click();await page.waitForTimeout(80);
    assert((await compactInspector.innerText()).includes('EJECTED'));assert.equal(await page.locator('#traceSummary').innerText(),traceBeforeBEject);
    await diskA.click();await page.waitForTimeout(80);assert((await compactInspector.innerText()).includes('INSERTED'));
    await diskB.click();await page.waitForTimeout(80);assert.equal(await compactInsert.isEnabled(),true);
    await compactInsert.click();await page.waitForTimeout(80);
    assert((await compactInspector.innerText()).includes('INSERTED'));assert.equal(await page.locator('#traceSummary').innerText(),traceBeforeBEject);

    // Cold boot still starts at A:, then B: retains WORK.COM.
    await page.locator('#powerBtn').click();await page.waitForTimeout(100);
    await page.locator('#runPauseBtn').click();await page.waitForTimeout(1200);await page.locator('#runPauseBtn').click();
    displayText=await readDisplayMemoryText();assert(displayText.includes('SHINO-80 CP/M 2.2'),displayText);assert(displayText.includes('A>'),displayText);
    await page.locator('#runPauseBtn').click();await page.locator('#moreBtn').click();await page.locator('[data-more-action="keyboard"]').click();
    await typeCpmCommand('b:');await typeCpmCommand('dir');
    await page.locator('#keyboardCapture').evaluate(element=>element.blur());await page.locator('#runPauseBtn').click();
    displayText=await readDisplayMemoryText();assert(displayText.includes('B>'),displayText);assert.match(displayText,/WORK\s+COM/);

    // The real compact RESET control re-enters ROM autoboot on A: without
    // clearing RAM or losing B media. Returning to B: still finds WORK.COM.
    await page.locator('#moreBtn').click();await page.locator('[data-more-action="reset"]').click();await page.waitForTimeout(100);
    await page.locator('#runPauseBtn').click();await page.waitForTimeout(1200);await page.locator('#runPauseBtn').click();
    displayText=await readDisplayMemoryText();assert(displayText.includes('A>'),displayText);
    await page.locator('#memoryAddress').fill('0004');await page.locator('#memoryAddressForm').press('Enter');await page.waitForTimeout(80);
    assert.equal(parseInt(await page.locator('[data-address="0004"]').innerText(),16)&0x0F,0);
    await page.locator('#runPauseBtn').click();await page.locator('#moreBtn').click();await page.locator('[data-more-action="keyboard"]').click();
    await typeCpmCommand('b:');await typeCpmCommand('dir');
    await page.locator('#keyboardCapture').evaluate(element=>element.blur());await page.locator('#runPauseBtn').click();
    displayText=await readDisplayMemoryText();assert(displayText.includes('B>'),displayText);assert.match(displayText,/WORK\s+COM/);

    // A: missing with valid B: must fall back to ROM MON; B is never booted.
    await page.locator('#powerBtn').click();await page.waitForTimeout(80);
    await page.locator('.bottom-nav button[data-view="devices"]').click();await diskA.click();await page.waitForTimeout(80);
    const traceBeforeAEject=await page.locator('#traceSummary').innerText();await compactEject.click();await page.waitForTimeout(80);
    assert((await compactInspector.innerText()).includes('EJECTED'));assert.equal(await page.locator('#traceSummary').innerText(),traceBeforeAEject);
    await diskB.click();await page.waitForTimeout(80);assert((await compactInspector.innerText()).includes('INSERTED'));
    await page.locator('#powerBtn').click();await page.waitForTimeout(100);
    assert.equal(await compactEject.isDisabled(),true);assert.equal(await compactInsert.isDisabled(),true);
    await compactEject.evaluate(button=>button.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    assert((await compactInspector.innerText()).includes('INSERTED'),'powered B handler must reject eject');
    await page.locator('#runPauseBtn').click();await page.waitForTimeout(900);await page.locator('#runPauseBtn').click();
    const monitorText=await readDisplayMemoryText();assert(monitorText.includes('MON'),monitorText);assert(!monitorText.includes('SHINO-80 CP/M 2.2'),monitorText);

    // Restore A and leave the machine in the normal powered/paused CP/M state.
    await page.locator('#powerBtn').click();await page.waitForTimeout(80);
    await page.locator('.bottom-nav button[data-view="devices"]').click();await diskA.click();await page.waitForTimeout(80);
    assert.equal(await compactInsert.isEnabled(),true);await compactInsert.click();await page.waitForTimeout(80);
    assert((await compactInspector.innerText()).includes('INSERTED'));
    await page.locator('#powerBtn').click();await page.locator('#runPauseBtn').click();await page.waitForTimeout(1200);await page.locator('#runPauseBtn').click();
    const cpmText=await readVisibleMemoryText('C000');assert(cpmText.includes('SHINO-80 CP/M 2.2'),cpmText);assert(cpmText.includes('A>'),cpmText);

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

    const diskAText=await diskA.innerText(),diskBText=await diskB.innerText();
    assert(diskAText.includes('VIRTUAL DISK A'));assert(diskAText.includes('READY'));
    assert(diskBText.includes('VIRTUAL DISK B'));assert(diskBText.includes('READY'));
    await diskA.click();await page.waitForTimeout(80);inspector=await page.locator('#inspectorContent').innerText();
    for(const expected of ['INSERTED','00h CLASSIC','77C × 1H × 26S','256,256 BYTES','30h–38h','S80B v2 / RAW · CP/M 2.2','A:','AUTOBOOT','MON O','IDLE'])assert(inspector.includes(expected),`${expected}\n${inspector}`);
    await diskB.click();await page.waitForTimeout(80);inspector=await page.locator('#inspectorContent').innerText();
    for(const expected of ['INSERTED','00h CLASSIC','77C × 1H × 26S','256,256 BYTES','30h–38h','USER / WORK / INTERCHANGE','RAW .s80d · CP/M DATA','B:','NOT AN AUTOBOOT SOURCE','IDLE'])assert(inspector.includes(expected),`${expected}\n${inspector}`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);

    await page.setViewportSize({width:1280,height:900});await page.waitForTimeout(180);
    assert.notEqual(await page.locator('.toolbar').evaluate(element=>getComputedStyle(element).display),'none');
    assert.notEqual(await page.locator('#inspectorContent').evaluate(element=>getComputedStyle(element).display),'none');
    const desktopInspector=page.locator('#inspectorContent');
    assert.equal(await desktopInspector.getByRole('button',{name:'EJECT',exact:true}).isVisible(),true);
    assert.equal(await desktopInspector.getByRole('button',{name:'EJECT',exact:true}).isDisabled(),true);
    assert.equal(await desktopInspector.getByRole('button',{name:'INSERT EJECTED DISK',exact:true}).isDisabled(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);

    await page.setViewportSize({width:900,height:400});await page.waitForTimeout(180);
    assert.equal(await page.locator('#inspector').evaluate(element=>getComputedStyle(element).display),'none');
    assert.equal(await compactInspector.isVisible(),true);
    assert.equal(await compactInspector.getByRole('button',{name:'EJECT',exact:true}).isVisible(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
    console.log('v0.0.9 Chromium CP/M A:/B: dual-drive + filesystem + cursor + beeper machine regression PASS');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
