# SHINO-80 execution pace worklog

2026-09-26 JST. Human reported MON v0.2 functional PASS, then requested faster
scrolling. Branch feature/shino80-realtime-pace-20260926, parent 6707ace / PR #19.
PR #18 and #19 remain unmerged. One logical commit / single writer.

Plan: SHINO80_REALTIME_PACE_PLAN.md. Spec: SHINO80_EXECUTION_PACE_v0.1.md.
Implemented host T-state pacing, default REALTIME, bounded TURBO, preserved
VISUAL, actual MHz, visibility suspension/rebase and full-buffer lamp sampling
fix. CPU/decoder/flags/Bus/ROM/CG-ROM source unchanged. Existing build inlines
the new host controller with the app; no external runtime dependency added.

## QA

- Bundled Node executed all package test stages directly (npm absent): NOP,
  PHASE 1A–1E, 2A/2A.1, BIOS, keyboard/MON, pacing, syntax, build/artifact PASS.
- Deterministic pacing tests: 30/60/120 Hz frame budgets, instruction overshoot,
  host time slice, instruction cap, suspension, reset and CPU/RAM/retained Bus
  trace equivalence PASS. External oracle not rerun; core is unchanged.
- Browser plugin not available: bundled Playwright + installed Chrome used.
  Existing Python browser test updated for new mode order but Python Playwright
  is absent; equivalent and additional Node browser flows ran instead.
- URL http://127.0.0.1:8765/deploy/one_page_shino80_v0.0.9_z80_base_complete.html
- 390x844 and 1440x1000: page identity, self-test, nonblank screen/no overlay,
  zero console/page errors, screenshot inspection, no horizontal overflow PASS.
- POWER → RUN → bottom-row Enter → D 0109, Backspace, 0, Enter → full dump:
  PASS for REALTIME and TURBO. Pause freezes CPU, STEP adds one instruction,
  cycling three modes while paused preserves state, simulated visibilitychange
  suspends/resumes, MEM FFFF navigation PASS.
- Script: /tmp/shino80-pace-browser.cjs. Screenshots:
  /tmp/shino80-pace-mobile.png, /tmp/shino80-pace-desktop.png.
- Extra breakpoint checks found 3 px overflow at width 720; medium PACE prefix
  hidden and brand minimum width reduced to accommodate REALTIME. Local-file
  self-test and no-overflow recheck at 720/1199/1200/1280 PASS.
- Performance: old MAX-equivalent newline 1028.8 ms; REALTIME 154.8/158.7 ms,
  TURBO 158.8 ms (~6.5x). Actual idle ~0.71–0.75 MHz: 4 MHz NOT achieved on
  this instrumented test. All event generation and BIOS execution retained.

## Handoff

Standalone HTML: SHINO80_REALTIME_QA_20260926.html, offered for mobile download.
Default REALTIME; More → PACE changes modes and shows measured MHz.
iPhone/Edge hardware keyboard, energy use and speed remain Human QA pending.
Source/build/docs/tests form one rollback unit relative to 6707ace. No merges.
Review predecessor PRs in order, then retarget/rebase and rerun integration.

## Update History

- 2026-09-26 — candidate implementation, verification and limitations recorded.
