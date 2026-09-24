# LAST RUN
## ONE-PAGE Z80 COMPUTER / SHINO-80

Updated: 2026-09-24T15:36:00+09:00

## Candidate

SHINO-80 v0.0.2 UI FOUNDATION

## Node QA

`npm test`: PASS

- CPU first-heartbeat regression
- source syntax
- one-page build
- artifact inline syntax
- safe-area
- reduced-motion
- external dependency check

## Chromium adaptive smoke

Exact generated artifact: PASS / zero page errors.

Viewports:

- 1440×900
- 900×800
- 390×844
- 844×390

Interaction:

- STEP
- RUN / PAUSE
- destination switching
- viewport resizing
- CPU state preserved

## Finding fixed

Phone landscape originally remained a squeezed Medium layout.

Added compact-height override so short windows use one-pane bottom navigation.

## Next

Human real-device UI review.
