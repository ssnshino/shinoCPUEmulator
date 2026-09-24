# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Last updated: 2026-09-24T22:55:00+09:00

## Active candidate

- Branch: `feature/shino80-phase2a1-power-reset-crt-20260924`
- Candidate: **SHINO-80 v0.0.8 — PHASE 2A.1**
- Artifact: `deploy/one_page_shino80_v0.0.8_phase2a1_power_reset.html`
- CPU BASE opcode count: 107
- Human review: PENDING

## Display stack

```text
TEXT VIDEO BOARD
  DIGITAL MONO / 640×400 / TEXT 80×25
       ↓
DM-80
  SHINOMIYA
  GREEN MONO DIGITAL DISPLAY
```

The VIDEO BOARD owns logical raster geometry.

The DISPLAY DEVICE follows the published signal aspect ratio.

No fixed 4:3 viewport and no logical safe-margin scaling remain.

The CRT canvas fills its viewport 100%.

## UI boundary

Monitor bezel:
- DM-80
- SHINOMIYA
- GREEN MONO DIGITAL DISPLAY

Application footer:
- POWER/RUN state
- CPU / clock
- build
- VIDEO signal
- PC / R / T
- LAST instruction

## Boot

POWER ON → A-H DISPLAY TEST → hold → VRAM CLEAR → SHINO-80 IPL / VIDEO OK / MON / *

## DM-80 corner rule

Physical monitor frame/bezel may be rounded. The actual VIDEO raster viewport is rectangular with zero corner radius.
