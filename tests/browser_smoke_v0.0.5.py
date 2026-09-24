from pathlib import Path
import os
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'deploy'/'one_page_shino80_v0.0.5_z80_phase1c.html').read_text()
chromium=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    page=browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='load');page.wait_for_timeout(200)
    assert page.locator('#selfTest').inner_text()=='PHASE 1C SELF TEST PASS'
    page.locator('.bottom-nav button[data-view="cpu"]').click()

    # Reach first DJNZ and verify that PC jumps backward.
    for _ in range(4):
        page.locator('#stepBtn').click();page.wait_for_timeout(50)
    assert page.locator('#displayInst').inner_text()=='DJNZ -3'
    assert page.locator('#statusPc').inner_text()=='0004'

    # Run to conditional JR pair.
    for _ in range(9):
        page.locator('#stepBtn').click();page.wait_for_timeout(35)
    assert page.locator('#displayInst').inner_text()=='JR NZ,+2'
    assert page.locator('#statusPc').inner_text()=='000C'

    page.locator('#stepBtn').click();page.wait_for_timeout(60)
    assert page.locator('#displayInst').inner_text()=='JR Z,+2'
    assert page.locator('#statusPc').inner_text()=='0010'

    assert not errors
    print('PHASE 1C Chromium control-flow smoke PASS')
    browser.close()
