# SHINO-80 v0.0.8 — PHASE 2A.1 SPEC

Updated: 2026-09-24T22:55:00+09:00

## VIDEO BOARD signal contract

The current TEXT VIDEO BOARD publishes:

```text
interface     DIGITAL_MONO
width         640
height        400
pixelAspect   1
textColumns   80
textRows      25
```

The UI derives CRT aspect ratio from width / height.

There is no fixed 4:3 assumption in the DISPLAY shell.

## DISPLAY DEVICE

Current device:

```text
MODEL   DM-80
MAKER   SHINOMIYA
TYPE    GREEN MONO DIGITAL DISPLAY
INPUT   DIGITAL MONO
```

The canvas occupies 100% of the CRT viewport.

The monitor bezel contains only device identity.
Machine/debug telemetry is outside the monitor and lives in the footer/inspectors.

## Swap-oriented design

The DISPLAY shell must be able to follow another VIDEO signal such as:

- 640×480
- 800×600
- 1024×768

without changing CPU memory semantics.

Compatibility between VIDEO BOARD output and DISPLAY input will be modeled in a later phase.

## IPL display diagnostic

C000h-C7FFh is filled page-by-page A through H, held briefly, then cleared by IPL.

MONITOR_LOOP remains 009Ch.

## CPU

No new opcode added.
Executable BASE count remains 107.
