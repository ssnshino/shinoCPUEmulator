from pathlib import Path
import os
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
html=(root/'deploy'/'one_page_shino80_v0.0.9_z80_base_complete.html').read_text()
chromium=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='load');page.wait_for_timeout(180)

    assert page.locator('#selfTest').inner_text()=='PHASE 2A.1 SELF TEST PASS'
    assert page.locator('#machineState').inner_text()=='POWER OFF'
    assert page.locator('#runPauseBtn').is_disabled()
    assert page.locator('.monitor-model').inner_text()=='DM-80'
    assert page.locator('.monitor-maker').inner_text()=='SHINOMIYA'
    assert page.locator('#crtViewport').get_attribute('data-render-mode')=='AA'

    box_c=page.locator('#crtCanvas').bounding_box()
    box_r=page.locator('#crtViewport').bounding_box()
    assert abs(box_c['width']-box_r['width'])<1.5
    assert abs(box_c['height']-box_r['height'])<1.5
    assert abs((box_r['width']/box_r['height'])-1.6)<0.02

    page.locator('#powerBtn').click();page.wait_for_timeout(100)
    page.locator('#moreBtn').click();page.locator('[data-more-action="pace"]').click()
    page.locator('#moreCloseBtn').click();page.wait_for_timeout(220)

    page.locator('#runPauseBtn').click()
    page.wait_for_function("document.querySelector('#busTrace')?.textContent.includes('IO_READ')",timeout=4000)
    page.locator('#runPauseBtn').click();page.wait_for_timeout(100)
    assert 'IO_READ' in page.locator('#busTrace').inner_text()

    before=page.locator('#crtCanvas').evaluate('canvas => canvas.toDataURL()')
    page.locator('#runPauseBtn').click()
    page.locator('#moreBtn').click()
    page.locator('[data-more-action="keyboard"]').click()
    assert page.evaluate('document.activeElement?.id')=='keyboardCapture'
    assert page.locator('#app').evaluate("app => app.classList.contains('keyboard-mode')")
    assert page.locator('.toolbar').evaluate("element => getComputedStyle(element).display")=='none'
    assert page.locator('.bottom-nav').evaluate("element => getComputedStyle(element).display")=='none'
    page.keyboard.type('h')
    page.keyboard.press('Enter')
    page.wait_for_function("previous => document.querySelector('#crtCanvas').toDataURL() !== previous",arg=before,timeout=4000)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')

    page.locator('#keyboardCapture').evaluate('element => element.blur()')
    page.locator('#runPauseBtn').click();page.wait_for_timeout(100)
    assert not page.locator('#app').evaluate("app => app.classList.contains('keyboard-mode')")

    page.locator('.bottom-nav button[data-view="cpu"]').click();page.wait_for_timeout(80)
    inspector=page.locator('#inspectorContent').inner_text()
    assert 'BASE 252/252 ONLINE' in inspector

    assert not errors
    print('v0.0.9 Chromium Z80 BASE COMPLETE + machine regression PASS')
    browser.close()
