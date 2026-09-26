from pathlib import Path
import os
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
html=(root/'deploy'/'one_page_shino80_v0.0.9_z80_base_complete.html').read_text()
chromium=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[];requests=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.on('request',lambda request: requests.append(request.url))
    page.set_content(html,wait_until='load');page.wait_for_timeout(180)

    assert page.locator('#selfTest').inner_text()=='PHASE 2A.1 SELF TEST PASS'
    assert page.locator('#machineState').inner_text()=='POWER OFF'
    assert page.locator('#runPauseBtn').is_disabled()
    assert page.locator('#referenceLink').get_attribute('href')=='https://shinomiya-daihanten.wos.ktsys.jp/works/lab/programs/shino80-reference.html'
    assert page.locator('#referenceLink').get_attribute('target')=='_blank'
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
    page.locator('.bottom-nav button[data-view="bus"]').click()
    page.wait_for_function("document.querySelector('#busTrace')?.textContent.includes('IO_READ')",timeout=4000)
    page.locator('#runPauseBtn').click();page.wait_for_timeout(100)
    assert 'IO_READ' in page.locator('#busTrace').inner_text()
    page.locator('.bottom-nav button[data-view="display"]').click()

    before=page.locator('#crtCanvas').evaluate('canvas => canvas.toDataURL()')
    page.locator('#runPauseBtn').click()
    page.locator('#moreBtn').click()
    page.locator('[data-more-action="keyboard"]').click()
    assert page.evaluate('document.activeElement?.id')=='keyboardCapture'
    assert page.locator('#app').evaluate("app => app.classList.contains('keyboard-mode')")
    assert page.locator('.toolbar').evaluate("element => getComputedStyle(element).display")=='none'
    assert page.locator('.bottom-nav').evaluate("element => getComputedStyle(element).display")=='none'
    page.keyboard.type('o')
    page.keyboard.press('Enter')
    page.wait_for_function("previous => document.querySelector('#crtCanvas').toDataURL() !== previous",arg=before,timeout=4000)
    page.wait_for_timeout(1200)
    cursor_frames=set()
    for _ in range(6):
        cursor_frames.add(page.locator('#crtCanvas').evaluate('canvas => canvas.toDataURL()'))
        page.wait_for_timeout(180)
    assert len(cursor_frames)>=2
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')

    page.locator('#keyboardCapture').evaluate('element => element.blur()')
    page.locator('#runPauseBtn').click();page.wait_for_timeout(100)
    assert not page.locator('#app').evaluate("app => app.classList.contains('keyboard-mode')")
    page.locator('#moreBtn').click();page.locator('[data-more-action="beep"]').click();page.wait_for_timeout(100)

    page.locator('.bottom-nav button[data-view="memory"]').click();page.wait_for_timeout(80)
    page.locator('#memoryAddress').fill('0000');page.locator('#memoryAddressForm').press('Enter');page.wait_for_timeout(80)
    assert page.locator('[data-address="0000"]').inner_text()=='C3'
    assert page.locator('[data-address="0001"]').inner_text()=='03'
    assert page.locator('[data-address="0002"]').inner_text()=='FA'
    page.locator('#memoryAddress').fill('9400');page.locator('#memoryAddressForm').press('Enter');page.wait_for_timeout(80)
    assert ''.join(page.locator(f'[data-address="940{i}"]').inner_text() for i in range(4))=='C35C97C3'
    assert 'FULL RAM' in page.locator('#inspectorContent').inner_text()

    page.locator('.bottom-nav button[data-view="cpu"]').click();page.wait_for_timeout(80)
    inspector=page.locator('#inspectorContent').inner_text()
    assert 'BASE 252/252 ONLINE' in inspector

    page.locator('.bottom-nav button[data-view="devices"]').click();page.wait_for_timeout(80)
    beeper=page.locator('[data-device="beeper"]')
    assert 'ONE-BIT BEEPER' in beeper.inner_text()
    beeper.click();page.wait_for_timeout(80)
    inspector=page.locator('#inspectorContent').inner_text()
    assert 'I/O 40h' in inspector
    assert 'Count1' in inspector.replace('\n','').replace(' ','')

    disk=page.locator('[data-device="disk-a"]')
    assert 'VIRTUAL DISK A' in disk.inner_text()
    assert 'ONLINE' in disk.inner_text()
    disk.click();page.wait_for_timeout(80)
    inspector=page.locator('#inspectorContent').inner_text()
    assert '77 TRACKS × 26 SECTORS' in inspector
    assert '256,256 BYTES' in inspector
    assert '30h–36h' in inspector
    assert 'S80B v2 · CP/M 2.2' in inspector
    assert 'A:2/16' in inspector
    assert 'MON O' in inspector
    assert 'IDLE' in inspector
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')

    assert not errors
    assert not requests
    print('v0.0.9 Chromium CP/M + cursor + beeper machine regression PASS')
    browser.close()
