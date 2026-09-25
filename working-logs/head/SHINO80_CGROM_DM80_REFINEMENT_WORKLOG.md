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
