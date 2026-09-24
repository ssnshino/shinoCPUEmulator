# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Last updated: 2026-09-24

## Stack

- PR #6 PHASE 1A — LD / Human smartphone PASS
- PR #7 PHASE 1B — INC/DEC + Flags
- PR #8 PHASE 1C — Control Flow / Human smartphone PASS
- PR #9 PHASE 1D — CALL/RET + Stack
- PHASE 2A stacked on PHASE 1D

## Active candidate

- Branch: `feature/shino80-phase2a-minimum-video-ipl-20260924`
- Candidate: **SHINO-80 v0.0.7 — PHASE 2A MINIMUM VIDEO + IPL**
- Artifact: `deploy/one_page_shino80_v0.0.7_phase2a_video_ipl.html`
- CPU executable BASE encodings: **107**
- Human real-device review: PENDING

## New machine hardware

```text
SYSTEM ROM   0000h-1FFFh  8 KiB
TEXT VRAM    C000h-C7CFh  80x25 cells
CG-ROM       4 KiB        256 x 8x16 glyph slots
TEXT VIDEO   640x400 logical raster
```

CG-ROM is not CPU-addressable.

CPU writes to SYSTEM ROM are blocked.

## IPL output

The boot ROM itself executes Z80 instructions which write:

```text
SHINO-80 IPL
VIDEO OK
MON
*
```

into TEXT VRAM.

The browser does not print these strings directly.

## Current boundary

The star prompt is only a visible placeholder.

No keyboard input or interactive monitor commands exist yet.

VIDEO VRAM reads do not yet model contention or bus cycles.
