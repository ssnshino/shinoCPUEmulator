# SHINO-80 v0.0.7 — PHASE 2A MINIMUM VIDEO + IPL SPEC

## New modules

```text
src/firmware/shino80/
  shino80-system-rom.js
  shino80-cgrom.js

src/machine/shino80/
  shino80-video.js
```

## SYSTEM ROM

- size: 8192 bytes
- mapped: 0000h-1FFFh
- CPU write protected
- RESET entry: 0000h
- current monitor placeholder loop label exported by ROM builder

## TEXT VIDEO

- 80 columns
- 25 rows
- 8x16 cells
- logical raster 640x400
- text VRAM: C000h-C7CFh
- code 00h is blank in current CG-ROM

## CG-ROM

- 4096 bytes
- 256 glyph slots
- 16 bytes per glyph
- not CPU-addressable
- original SHINO-80 bring-up font

## Boot output

```text
SHINO-80 IPL
VIDEO OK
MON
*
```

## CPU coverage

No new CPU opcode is added.

Executable BASE count remains **107**.

## Artifact

`deploy/one_page_shino80_v0.0.7_phase2a_video_ipl.html`
