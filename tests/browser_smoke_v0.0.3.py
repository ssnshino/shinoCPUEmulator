from pathlib import Path
import os
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'deploy'/'one_page_shino80_v0.0.3_z80_phase1a.html').read_text()
chromium=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='load');page.wait_for_timeout(250)
    assert page.locator('#selfTest').inner_text()=='PHASE 1A SELF TEST PASS'
    page.set_viewport_size({'width':390,'height':844})
    page.locator('#moreBtn').click()
    page.wait_for_timeout(120)
    assert page.locator('#moreMenu').get_attribute('aria-hidden')=='false'
    assert page.locator('#morePaceValue').inner_text()=='VISUAL'
    page.locator('[data-more-action="pace"]').click()
    assert page.locator('#morePaceValue').inner_text()=='FAST'
    page.locator('[data-more-action="reset"]').click()
    page.wait_for_timeout(120)
    assert page.locator('#statusPc').inner_text()=='0000'
    page.locator('.navbtn[data-view="cpu"]').click()
    expected=['LD A,41h','LD B,22h','LD HL,0080h','LD (HL),A','LD C,(HL)']
    for x in expected:
        page.locator('#stepBtn').click();page.wait_for_timeout(60);assert page.locator('#displayInst').inner_text()==x
    assert page.locator('#statusPc').inner_text()=='0009';assert page.locator('#statusT').inner_text()=='38';assert not errors
    print('PHASE 1A Chromium teaching-program smoke PASS')
    browser.close()
