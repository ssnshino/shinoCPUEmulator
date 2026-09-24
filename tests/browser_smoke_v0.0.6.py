from pathlib import Path
import os
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'deploy'/'one_page_shino80_v0.0.6_z80_phase1d.html').read_text()
chromium=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    page=browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='load');page.wait_for_timeout(180)
    assert page.locator('#selfTest').inner_text()=='PHASE 1D SELF TEST PASS'
    page.locator('.bottom-nav button[data-view="cpu"]').click()

    for _ in range(3): page.locator('#stepBtn').click();page.wait_for_timeout(35)
    assert page.locator('#displayInst').inner_text()=='CALL 0010h'
    assert page.locator('.regrow[data-key="sp"] .reghex').inner_text()=='EFFE'
    assert page.locator('#displayPc').inner_text()=='0010'

    for _ in range(2): page.locator('#stepBtn').click();page.wait_for_timeout(35)
    assert page.locator('#displayInst').inner_text()=='CALL 0020h'
    assert page.locator('.regrow[data-key="sp"] .reghex').inner_text()=='EFFC'
    assert page.locator('#displayPc').inner_text()=='0020'

    for _ in range(2): page.locator('#stepBtn').click();page.wait_for_timeout(35)
    assert page.locator('#displayInst').inner_text()=='RET'
    assert page.locator('.regrow[data-key="sp"] .reghex').inner_text()=='EFFE'
    assert page.locator('#displayPc').inner_text()=='0014'

    for _ in range(2): page.locator('#stepBtn').click();page.wait_for_timeout(35)
    assert page.locator('#displayInst').inner_text()=='RET'
    assert page.locator('.regrow[data-key="sp"] .reghex').inner_text()=='F000'
    assert page.locator('#displayPc').inner_text()=='0008'
    assert not errors
    print('PHASE 1D Chromium nested CALL/RET smoke PASS')
    browser.close()
