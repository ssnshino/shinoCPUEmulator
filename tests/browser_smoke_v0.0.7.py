from pathlib import Path
import os
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
html=(root/'deploy'/'one_page_shino80_v0.0.7_phase2a_video_ipl.html').read_text()
chromium=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='load');page.wait_for_timeout(180)

    assert page.locator('#selfTest').inner_text()=='PHASE 2A SELF TEST PASS'
    canvas=page.locator('#crtCanvas')
    assert canvas.count()==1

    # Boot quickly through the real Z80 IPL.
    page.locator('#moreBtn').click();page.wait_for_timeout(60)
    page.locator('[data-more-action="pace"]').click();page.wait_for_timeout(30)
    assert page.locator('#morePaceValue').inner_text()=='FAST'
    page.locator('#moreCloseBtn').click();page.wait_for_timeout(220)
    page.locator('#runPauseBtn').click();page.wait_for_timeout(650)
    page.locator('#runPauseBtn').click();page.wait_for_timeout(100)

    assert page.locator('#displayPc').inner_text()=='007B'
    lit=canvas.evaluate("""c=>{
      const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let n=0;
      for(let i=0;i<d.length;i+=4)if(d[i+1]>100)n++;
      return n;
    }""")
    assert lit>100
    assert not errors
    print('PHASE 2A Chromium IPL -> VRAM -> CG-ROM -> CRT PASS',lit)
    browser.close()
