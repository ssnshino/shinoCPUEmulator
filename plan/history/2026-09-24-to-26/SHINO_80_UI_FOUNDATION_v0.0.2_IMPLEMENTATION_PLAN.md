# SHINO-80 UI FOUNDATION v0.0.2 IMPLEMENTATION PLAN

Created: 2026-09-24T15:36:00+09:00
Status: IMPLEMENTED CANDIDATE

## Purpose

Turn the working Z80 first-heartbeat test bench into the first scalable SHINO-80 workbench shell defined by `SHINO_80_UI_DESIGN_STANDARD_v0.1`.

## Baseline

- UI Design Standard v0.1: merged to `main` via PR #3
- CPU behavior source: PR #2 first-heartbeat implementation
- CPU scope remains NOP only

## Implement

- global machine toolbar
- DISPLAY / CPU / MEMORY / BUS / DEVICES destinations
- Expanded / Medium / Compact layout families
- compact-height phone landscape override
- future display placeholder as primary content
- current LED front panel moved into CPU Debug Lab
- Memory Inspector
- Bus Analyzer
- Device Dock placeholders
- contextual desktop inspector
- collapsible trace panel
- safe-area support
- approx. 44px touch controls
- system sans shell + monospace telemetry
- `prefers-reduced-motion`
- machine state preservation across navigation and resize
- bounded trace history
- observer refresh separated from CPU execution loop

## Non-goals

- no new Z80 opcodes
- no BIOS
- no real VIDEO device
- no FDD/UART/Printer implementation
- no drag-anywhere docking
- no workspace persistence
- no WebRTC

## Success

The same running NOP machine must remain understandable and usable at:

- 1440×900 desktop
- 900×800 tablet-like viewport
- 390×844 phone portrait
- 844×390 phone landscape

Switching panes or resizing must not reset PC/T-state.
