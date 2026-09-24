from pathlib import Path
import os
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
html=(root/'deploy'/'one_page_shino80_v0.0.2_ui_foundation.html').read_text()
shots=root/'tmp-ui-smoke-shots'
shots.mkdir(exist_ok=True)
chromium=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')

with sync_playwright() as p:
    browser=p.chromium.launch(
        headless=True,
        executable_path=chromium,
        args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']
    )
    page=browser.new_page(viewport={'width':1440,'height':900})
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))

    page.set_content(html,wait_until='load')
    page.wait_for_timeout(250)

    assert page.locator('#selfTest').inner_text()=='NOP SELF TEST PASS'

    page.locator('#stepBtn').click()
    page.wait_for_timeout(100)
    assert page.locator('#statusPc').inner_text()=='0001'
    assert page.locator('#statusT').inner_text()=='4'

    page.locator('.navbtn[data-view="cpu"]').click()
    page.locator('.navbtn[data-view="memory"]').click()

    page.locator('#runPauseBtn').click()
    page.wait_for_timeout(420)
    page.locator('.navbtn[data-view="devices"]').click()
    page.wait_for_timeout(150)
    page.locator('#runPauseBtn').click()
    page.wait_for_timeout(80)

    pc=page.locator('#statusPc').inner_text()

    page.set_viewport_size({'width':900,'height':800})
    page.wait_for_timeout(150)
    assert page.locator('#statusPc').inner_text()==pc

    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_timeout(150)
    assert page.locator('.bottom-nav').evaluate("e=>getComputedStyle(e).display")=='grid'
    page.locator('.bottom-nav button[data-view="cpu"]').click()
    assert page.locator('#statusPc').inner_text()==pc

    page.set_viewport_size({'width':844,'height':390})
    page.wait_for_timeout(150)
    assert page.locator('.bottom-nav').evaluate("e=>getComputedStyle(e).display")=='grid'

    assert not errors
    print('v0.0.2 deploy Chromium adaptive smoke PASS; PC preserved at',pc)
    browser.close()
