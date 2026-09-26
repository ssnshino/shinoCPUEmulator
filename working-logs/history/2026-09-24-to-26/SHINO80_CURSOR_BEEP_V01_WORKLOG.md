# SHINO-80 Cursor / BEEP v0.1 Worklog

Date: 2026-09-26
Branch: `feature/shino80-cursor-beep-v01-20260926`
Parent: `4084d0e45261f8d585da8c291ee1405ee5ebc528`
PR: #36

## Implementation

- added a Bus-attached one-bit beeper on low I/O port 40h
- routed ROM BIOS PUTCHAR and RAM CBIOS CONOUT BEL 07h to the device
- added an 880 Hz / 80 ms Web Audio presentation with non-fatal fallback
- added Device Dock state and a touch-friendly More -> BEEP TEST control
- added More -> REFERENCE navigation to the separately published manual
- added Ctrl+G guest BEL input for physical keyboards
- added a non-destructive 8x2 underline cursor overlay to DM-80
- selected the ROM BIOS or loaded CBIOS cursor pointer according to memory mode
- derived blink phase from CPU T-states and preserved paused-machine semantics
- expanded CBIOS to 645 bytes and shifted the S80B v2 CP/M payload start from
  sector 8 to sector 9 while remaining inside the two reserved system tracks
- regenerated the standalone machine and Technical Manual

CPU core, decoder, flags, CCP and BDOS semantics were not changed.

## Automated QA

- cursor/beeper focused suite: PASS
- ROM BIOS BEL path and register preservation: PASS
- CBIOS BEL path: PASS
- cursor move/hide/old-cell restore/no-VRAM-mutation: PASS
- cold CP/M boot, system disk, CBIOS and WBOOT regressions: PASS
- full package suite: PASS
- standalone artifact build/test: PASS, 223,417 bytes
- Technical Manual deterministic test: PASS, 1,780 encodings / 1,998,243 bytes
- Technical Manual standalone favicon: inline empty data URL; no favicon request or external runtime asset

## Installed Chrome QA

The dedicated Browser plugin was not available, so the installed Google Chrome
was driven with Playwright against the generated offline HTML.

- 390x844 mobile viewport: PASS
- 1440x1000 desktop viewport: PASS
- MON O -> CP/M A> then stable two-state cursor blink: PASS
- More -> BEEP TEST -> I/O 40h count 1: PASS
- self-test: PASS
- console errors/warnings: 0
- external network requests: 0
- document horizontal overflow: 0

Screenshots were retained outside the repository at
`/tmp/shino80-cursor-beep-mobile.png` and
`/tmp/shino80-cursor-beep-desktop.png`.

Headless QA proves the Web Audio path can be constructed without runtime error
and that device state advances. Final audible-speaker confirmation remains a
Human device check because CI cannot hear physical output.

No merge, deployment or public release is part of this worklog.
