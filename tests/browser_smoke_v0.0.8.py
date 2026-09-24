from pathlib import Path
import os
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
html=(root/'deploy'/'one_page_shino80_v0.0.8_phase2a1_power_reset.html').read_text()
chromium=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='load');page.wait_for_timeout(180)

    assert page.locator('#selfTest').inner_text()=='PHASE 2A.1 SELF TEST PASS'
    assert page.locator('#machineState').inner_text()=='POWER OFF'
    assert page.locator('#runPauseBtn').is_disabled()
    assert page.locator('#stepBtn').is_disabled()

    # DISPLAY geometry follows the VIDEO BOARD signal with no logical safe margin.
    box_c=page.locator('#crtCanvas').bounding_box()
    box_r=page.locator('#crtViewport').bounding_box()
    assert abs(box_c['width']-box_r['width'])<1.5
    assert abs(box_c['height']-box_r['height'])<1.5
    assert abs((box_r['width']/box_r['height'])-1.6)<0.02
    assert page.locator('.monitor-model').inner_text()=='DM-80'
    assert page.locator('.monitor-maker').inner_text()=='SHINOMIYA'

    # Power on, then select MAX pace through the compact More sheet.
    page.locator('#powerBtn').click();page.wait_for_timeout(100)
    assert page.locator('#machineState').inner_text()=='READY'
    assert page.locator('#statusPc').inner_text()=='0000'

    page.locator('#moreBtn').click();page.locator('[data-more-action="pace"]').click()
    page.locator('[data-more-action="pace"]').click()
    assert page.locator('#morePaceValue').inner_text()=='MAX'
    page.locator('#moreCloseBtn').click();page.wait_for_timeout(220)

    page.locator('#runPauseBtn').click();page.wait_for_timeout(700)
    page.locator('#runPauseBtn').click();page.wait_for_timeout(100)
    assert page.locator('#statusPc').inner_text()=='009C'

    canvas=page.locator('#crtCanvas')
    lit_before=canvas.evaluate("""c=>{
      const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let n=0;for(let i=0;i<d.length;i+=4)if(d[i+1]>100)n++;return n;
    }""")
    assert lit_before>100

    # RESET is warm: PC returns to 0000 but the already-rendered text remains.
    page.locator('#moreBtn').click();page.locator('[data-more-action="reset"]').click();page.wait_for_timeout(250)
    assert page.locator('#statusPc').inner_text()=='0000'
    lit_after_reset=canvas.evaluate("""c=>{
      const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let n=0;for(let i=0;i<d.length;i+=4)if(d[i+1]>100)n++;return n;
    }""")
    assert lit_after_reset==lit_before

    # POWER OFF blanks the CRT and disables execution controls.
    page.locator('#powerBtn').click();page.wait_for_timeout(100)
    assert page.locator('#machineState').inner_text()=='POWER OFF'
    assert page.locator('#runPauseBtn').is_disabled()
    lit_off=canvas.evaluate("""c=>{
      const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let n=0;for(let i=0;i<d.length;i+=4)if(d[i+1]>100)n++;return n;
    }""")
    assert lit_off==0

    assert not errors
    print('PHASE 2A.1 Chromium DISPLAY DEVICE / POWER / warm RESET PASS')
    browser.close()
