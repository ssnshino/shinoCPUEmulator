# BIOS console / Monitor v0.2 worklog

2026-09-26T01:49:00+09:00 — candidate, single Codex writer.

## Scope and source

Human authorized continuation after Memory Inspector iPhone/Edge PASS.
Memory candidate was saved as f0903e0, PR #18, without merging.
This logical change is on feature/shino80-monitor-lines-dump-20260926,
stacked on that branch. Reviewed main remains separate.
Plan: plan/head/SHINO80_MONITOR_CONSOLE_V2_PLAN.md.
Spec: docs/head/SHINO80_MONITOR_CONSOLE_v0.2.md.

Implemented GETLINE, Backspace/DEL, upward scrolling, HEX8/HEX16 and strict
MON D xxxx (64 bytes), with Enter submission for all commands. Public BIOS
entry slots are stable. ROM internal implementations relocated to 0400h+;
IPL remains 0200h and Monitor entry 0220h. Boot count is now 14036 instructions.
Added host textarea keydown handling for Enter/Backspace; beforeinput remains
the virtual-keyboard fallback. CPU/decoder/flags/bus/CG-ROM unchanged.

## Verification

- Every package test stage executed directly with the bundled Node runtime:
  NOP, PHASE 1A/B/C/D/E, PHASE 2A/2A.1, minimum BIOS, keyboard, new console
  test, source syntax, build and artifact: PASS. npm is absent in this shell.
- New test covers editing/DEL, empty input/erase, control filtering, capacity
  and NUL bounds, register/stack preservation, scroll rows and tail guard,
  HEX8/16, lowercase D, invalid syntax, FFFCh wrap, repeated dumps, ROM guard
  and actual CPU Bus reads. This did not rerun external 252,000-case oracle;
  CPU code is unchanged.
- Browser plugin not available; bundled Node Playwright with installed real
  Google Chrome used. Python Playwright dependency absent; existing Python
  smoke script flow updated but not executed. Equivalent interactions tested.
- URL: http://127.0.0.1:8765/deploy/one_page_shino80_v0.0.9_z80_base_complete.html
- Viewports: 390x844 and 1440x1000. Identity/self-test, nonblank render, no error
  overlay, zero console/page errors, zero horizontal overflow: PASS.
- POWER -> MAX -> RUN -> keyboard -> D 0109 -> Backspace -> 0 -> Enter:
  real VRAM contains D 0100 and eight dump rows. H + Enter produces help.
  Blur -> pause -> MEM -> FFFF navigation also PASS.
- Screenshots inspected: /tmp/shino80-mon-v2-mobile.png and
  /tmp/shino80-mon-v2-desktop.png. Mobile software keyboard itself is not
  simulated by desktop Chrome; actual iPhone/Edge review remains pending.

## Handoff / rollback

Single generated HTML is the mobile QA deliverable; copied to workspace as
SHINO80_MONITOR_V2_QA_20260926.html. Test with MAX pace, H Enter, D 0100 Enter,
mistyped address + Backspace, and repeated dumps to scroll. No memory writes
or GO command added. Large paste can still overflow the 64-byte device FIFO.

This commit is one logical rollback unit relative to f0903e0. Rebuild after
reverting source; never hand-edit generated HTML. Review/merge PR #18 first,
then rebase/retarget this candidate as necessary and rerun integration.
No main merge or deployment authorized/performed by this continuation.

## Update History

- 2026-09-26T01:49:00+09:00 — implementation, regression and browser QA recorded.
