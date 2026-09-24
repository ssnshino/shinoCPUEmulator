# SHINO-80 PHASE 2A.1 — POWER / RESET / DISPLAY DEVICE PLAN

Updated: 2026-09-24T22:55:00+09:00
Candidate version: v0.0.8

## Goal

Keep the VIDEO BOARD, DISPLAY DEVICE, and observer UI as separate layers.

## Display architecture

```text
CPU / MOTHERBOARD
      ↓
TEXT VIDEO BOARD
  signal: DIGITAL MONO
  raster: 640×400
      ↓
DM-80 DISPLAY DEVICE
  SHINOMIYA
  GREEN MONO DIGITAL DISPLAY
      ↓
human-visible CRT
```

The DISPLAY DEVICE must not alter logical raster geometry.

No safe-margin pixels are inserted into VIDEO memory or canvas space.

The CRT viewport follows the signal aspect ratio published by the active VIDEO BOARD.

## Current DM-80

- model: DM-80
- maker: SHINOMIYA
- input: DIGITAL MONO
- current raster: 640×400
- bezel labels:
  - upper left: DM-80
  - lower center: SHINOMIYA
  - lower right: GREEN MONO DIGITAL DISPLAY

Future monitor controls are reserved:
BRIGHTNESS / CONTRAST / H-POS / V-POS / H-SIZE / V-SIZE.

## Observer UI

Machine information does not belong on the monitor bezel.

MODEL / BUILD / VIDEO / PC / R / T / LAST are shown in the application footer.

## Existing machine behavior retained

- POWER ON/OFF
- warm RESET
- A-H full VRAM display test
- diagnostic hold
- IPL VRAM clear
- boot banner
- 8×16 CG-ROM spacing
