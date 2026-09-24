# SHINO Z80 CORE v0.0.1 WORKLOG

Created: 2026-09-24T13:42:12+09:00

## Work performed

1. Reviewed current repository rules/snapshot/PHASE 0 plan.
2. Checked Zilog UM0080 for RESET, NOP, M1 fetch, refresh and R behavior used by this milestone.
3. Checked SingleStepTests/z80 as a later bus/state test methodology candidate.
4. Implemented `Shino80Bus` with CPU trace vs debugger peek separation.
5. Implemented `Z80Core` first heartbeat with only NOP.
6. Added Node unit tests.
7. Added Altair-inspired LED front panel UI.
8. Added dependency-free one-page build script.
9. Generated `one_page_shino_z80_core_v0.0.1.html`.
10. Added dependency-free `package.json` scripts and one-page static test.
11. Ran `npm test`: CPU tests + build + static one-page check PASS.

## Important choices

- Did not set SP=FFFF on RESET because that is not supported by the RESET passage used for this milestone.
- Did not claim all general registers reset to zero.
- Did not model refresh A7 without evidence.
- Did not call the current trace cycle-perfect.
- Did not add BIOS/video/FDD before the CPU heartbeat.

## Result

First heartbeat candidate: PASS.

Human visual review is the next gate.
