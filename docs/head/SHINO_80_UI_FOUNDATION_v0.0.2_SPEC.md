# SHINO-80 UI FOUNDATION v0.0.2 SPEC

Created: 2026-09-24T15:36:00+09:00
Status: CANDIDATE SPEC

## Artifact

`one_page_shino80_v0.0.2_ui_foundation.html`

Standalone one-page HTML with embedded CSS, bus, CPU core and workbench app.

## Information architecture

Top-level destinations:

- DISPLAY
- CPU
- MEMORY
- BUS
- DEVICES

## Layout

### Expanded >= 1200 CSS px

- navigation rail
- primary content
- contextual inspector
- trace panel
- status strip

### Medium 720–1199 CSS px

- compact rail
- primary content
- one inspector
- trace collapsed by default

### Compact < 720 CSS px

- one major pane at a time
- bottom navigation
- no permanent inspector / trace

### Compact-height

At height < 500 CSS px and width < 1200 CSS px, force one-pane compact behavior for phone landscape.

## Machine/display separation

DISPLAY is primary machine content.
CPU/MEMORY/BUS/DEVICES are observer surfaces.

Current DISPLAY is explicitly a placeholder and does not claim a video device exists.

## CPU Debug Lab

Preserves the v0.0.1 front-panel concept:

- Address/Data LEDs
- M1/MREQ/IORQ/RD/WR/RFSH/HALT/WAIT/INT/NMI lamps
- full register bank
- flag/state telemetry
- burst and trace controls

## Device Dock

Slots shown as RESERVED only:

- FDD A
- FDD B
- RS-232C
- Printer
- Timer
- PSG

No peripheral behavior is implemented.

## Execution

Observation pace modes:

- VISUAL
- FAST
- MAX

These are browser observation/execution pacing controls, not a claim of hardware-accurate realtime 4 MHz throughput.

## State preservation

Pane switching and viewport resizing do not reset:

- CPU state
- PC/R/T-state
- running state
- selected device
- selected destination

## Accessibility / adaptive support

- safe-area insets
- visible focus outline
- semantic labels
- selected state not color-only
- reduced-motion CSS
- touch-size toolbar controls

## Accuracy

CPU/bus accuracy remains the v0.0.1 first-heartbeat boundary:

- NOP only
- M-cycle abstract trace
- not cycle-perfect
