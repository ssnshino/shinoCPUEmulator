from pathlib import Path
import os
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
html=(root/'deploy'/'one_page_shino80_v0.0.4_z80_phase1b.html').read_text()
chromium=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='load');page.wait_for_timeout(200)
    assert page.locator('#selfTest').inner_text()=='PHASE 1B SELF TEST PASS'
    page.locator('.bottom-nav button[data-view="cpu"]').click()

    # LD A,7Fh
    page.locator('#stepBtn').click();page.wait_for_timeout(60)
    assert page.locator('#displayInst').inner_text()=='LD A,7Fh'

    # INC A -> 80h : S,H,P/V
    page.locator('#stepBtn').click();page.wait_for_timeout(80)
    assert page.locator('#displayInst').inner_text()=='INC A'
    assert page.locator('[data-flag="S"] .led').evaluate("e=>e.classList.contains('on')")
    assert page.locator('[data-flag="H"] .led').evaluate("e=>e.classList.contains('on')")
    assert page.locator('[data-flag="PV"] .led').evaluate("e=>e.classList.contains('on')")
    assert not page.locator('[data-flag="Z"] .led').evaluate("e=>e.classList.contains('on')")
    assert not page.locator('[data-flag="N"] .led').evaluate("e=>e.classList.contains('on')")

    # LD B,FFh + INC B -> 00h : Z,H
    page.locator('#stepBtn').click();page.locator('#stepBtn').click();page.wait_for_timeout(80)
    assert page.locator('[data-flag="Z"] .led').evaluate("e=>e.classList.contains('on')")
    assert page.locator('[data-flag="H"] .led').evaluate("e=>e.classList.contains('on')")
    assert not page.locator('[data-flag="S"] .led').evaluate("e=>e.classList.contains('on')")

    # More sheet still works.
    page.locator('#moreBtn').click();page.wait_for_timeout(80)
    assert page.locator('#moreMenu').get_attribute('aria-hidden')=='false'
    page.locator('#moreCloseBtn').click()

    assert not errors
    print('PHASE 1B Chromium flags teaching smoke PASS')
    browser.close()
