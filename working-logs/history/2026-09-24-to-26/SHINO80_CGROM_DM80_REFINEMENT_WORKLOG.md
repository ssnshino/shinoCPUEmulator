# SHINO-80 CG-ROM / DM-80 DISPLAY REFINEMENT WORKLOG

Date: 2026-09-25
Branch: `feature/shino80-cgrom-native8x16-dm80-20260925`
Base main: `d46de4e460a148c2d52a3024cc0767e48e5a1d64`

## Scope

Display-only refinement. CPU core files are intentionally untouched.

## Native CG-ROM

- 4096 bytes total
- 256 glyphs x 16 bytes
- 8x16 cell
- bit7 = leftmost pixel
- runtime browser-font dependency: none
- ROM SHA-256: `78ad2a69fce15801f07766b05f1f9cd9179eb7e974fb22d7f83e22e2d34dd194`
- ROM CRC32: `659A7798`
- selected 4/7 design: v0.5 A / conservative family-fit
- 1 remains unchanged from the accepted candidate family
- 4 and 7 active vertical bounds are both y=2..13

## DM-80 scaling

Previous behavior forced pixelated/crisp-edges CSS scaling at every display size.

New behavior:
- native/integer enlargement: pixel-perfect scaling
- reduction or non-integer scaling: gentle browser antialiasing
- CRT scanline / phosphor-glass treatment remains in the DM-80 presentation layer

The logical VIDEO BOARD raster remains 640x400.

## Regression additions

- exact 1 / 4 / 7 CG-ROM byte patterns locked
- 4 and 7 vertical bounds locked to y=2..13
- 390x844 browser smoke expects DM-80 AA mode
- one-page artifact rebuilt from branch sources

## CPU isolation

No changes were made to:
- src/cpu/z80/z80-core.js
- src/cpu/z80/z80-decoder.js
- src/cpu/z80/z80-flags.js


## Final QA and Human Approval — 2026-09-25T23:46:00+09:00

Final QA exposed two branch-local defects before completion:

- one literal `\\n` sequence had been written into the CRT CSS source
- one literal `\\n` sequence had been written into `tests/browser_smoke_v0.0.9.py`

Both were corrected before final validation.

Real GitHub Actions / Chrome QA:

- workflow run: `36148649953`
- QA head: `560e62e3be982d2c5eed6bc7d4bb32ba5d229474`
- `npm test`: **PASS**
- source syntax: **PASS**
- PHASE 2A regression: **PASS**
- PHASE 2A.1 regression: **PASS**
- build: **PASS**
- artifact test: **PASS**
- real Chromium browser smoke: **PASS**
- actual DM-80 mobile render capture: **PASS**
- actual DM-80 desktop render capture: **PASS**
- actual CG-ROM glyph QA render using branch CG-ROM + branch video driver: **PASS**
- `git diff --check`: **PASS**
- generated artifact reproducibility: **PASS**
- tracked working tree clean after rebuild: **PASS**

Human visual QA was performed against the actual Chrome-rendered DM-80 output, including a diagnostic line containing:

- `0123456789`
- `40414243444546474849`
- `44 47 74 77 4477 7474`

Human result:

> **OK — 表示がきれいになった！**

Therefore the native 8x16 CG-ROM and adaptive DM-80 rendering are human-approved for integration.

### Final display-side decisions

- native CG-ROM: **8x16 / 4096 bytes**
- selected 4 / 7: **v0.5 A / conservative family-fit**
- digit 1: accepted family form retained
- logical video raster: **640x400**
- native / integer enlargement: **pixel-perfect**
- reduced / non-integer presentation: **gentle AA**
- CRT scanline / phosphor treatment: **DM-80 presentation layer**

### Protected area confirmation

The display branch intentionally does not modify:

- `src/firmware/shino80/shino80-system-rom.js`
- BIOS / Monitor documents or tests
- `src/cpu/z80/z80-core.js`
- `src/cpu/z80/z80-decoder.js`
- `src/cpu/z80/z80-flags.js`

The temporary branch-only QA workflow is removed during final branch cleanup after recording the successful run above.
