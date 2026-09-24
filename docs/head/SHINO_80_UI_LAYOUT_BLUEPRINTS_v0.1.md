# SHINO-80 UI LAYOUT BLUEPRINTS v0.1

Created: 2026-09-24T15:13:07+09:00
Status: **DESIGN BLUEPRINT / NOT IMPLEMENTED**
Depends on: `SHINO_80_UI_DESIGN_STANDARD_v0.1.md`

This document defines the first three layout families for the SHINO-80 one-page workbench.

Exact pixels are candidates. Spatial relationships matter more than the initial numbers.

---

# 1. Shared information architecture

All layout families represent the same conceptual model:

```text
GLOBAL MACHINE CONTROL
│
├ DISPLAY
├ CPU
├ MEMORY
├ BUS
└ DEVICES
     ├ FDD A
     ├ FDD B
     ├ UART
     ├ PRINTER
     ├ TIMER
     └ future...
```

The virtual machine continues to exist independently from which pane is visible.

---

# 2. EXPANDED — desktop / wide window

Candidate trigger:

`width >= 1200 CSS px`

## Layout

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ SHINO-80 / MACHINE NAME          RUN  PAUSE  STEP   SPEED   RESET      ⋯ │
├─────────────┬───────────────────────────────────────┬──────────────────────┤
│ NAVIGATION  │                                       │ INSPECTOR            │
│             │                                       │                      │
│ DISPLAY  ●  │                                       │ CPU                  │
│ CPU         │           SHINO DISPLAY               │ ───────────────────  │
│ MEMORY      │                                       │ PC 013A              │
│ BUS         │                                       │ AF 12F0              │
│ DEVICES     │                                       │ BC 0020              │
│             │                                       │ ...                  │
│             │                                       │                      │
├─────────────┴───────────────────────────────────────┴──────────────────────┤
│ BUS TRACE / EVENTS                                              [hide ▲] │
├────────────────────────────────────────────────────────────────────────────┤
│ RUN · 4.000 MHz model · T=001928371 · FDD A READY · UART IDLE             │
└────────────────────────────────────────────────────────────────────────────┘
```

## Candidate sizing

```text
toolbar        48–56 px
navigation     160–220 px
inspector      320–420 px
trace          160–240 px height
center         remainder
status         22–28 px
```

## Behavior

- Display remains visually dominant.
- Inspector can collapse.
- Trace can collapse.
- Navigation may later collapse to icon rail.
- Panel resizing is future enhancement, not v0.0.2 requirement.

---

# 3. MEDIUM — tablet / narrow desktop

Candidate trigger:

`720 <= width < 1200 CSS px`

## Layout

```text
┌───────────────────────────────────────────────────────────────┐
│ SHINO-80             RUN PAUSE STEP     SPEED RESET        ⋯ │
├───────┬──────────────────────────────┬────────────────────────┤
│  D    │                              │ INSPECTOR              │
│  C    │                              │                        │
│  M    │        SHINO DISPLAY         │ CPU / selected detail  │
│  B    │                              │                        │
│  I/O  │                              │                        │
├───────┴──────────────────────────────┴────────────────────────┤
│               BUS TRACE / EVENT DRAWER  [open]               │
└───────────────────────────────────────────────────────────────┘
```

Legend:

- D = Display
- C = CPU
- M = Memory
- B = Bus
- I/O = Devices

## Candidate ratio

```text
primary      60–70%
supporting   30–40%
```

## Behavior

- Use compact icon/navigation rail.
- Only one supporting inspector is visible.
- Trace defaults closed.
- Device detail replaces inspector content instead of adding another column.
- If width becomes tight, transition to Compact rather than squeezing both panes indefinitely.

---

# 4. COMPACT — smartphone portrait / narrow webview

Candidate trigger:

`width < 720 CSS px`

## Default DISPLAY destination

```text
┌──────────────────────────────┐
│ SHINO-80      ▶︎  ⏸  STEP ⋯ │
├──────────────────────────────┤
│                              │
│                              │
│        SHINO DISPLAY         │
│                              │
│                              │
├──────────────────────────────┤
│ DISPLAY  CPU  MEM  BUS  I/O │
└──────────────────────────────┘
```

One major pane at a time.

---

# 5. COMPACT — CPU destination

```text
┌──────────────────────────────┐
│ SHINO-80      ▶︎  ⏸  STEP ⋯ │
├──────────────────────────────┤
│ CPU                          │
│                              │
│ PC    013A                   │
│ ●○○○ ○○●● ○○●○ ○○○○       │
│                              │
│ AF    12F0                   │
│ BC    0020                   │
│ DE    C000                   │
│ HL    8042                   │
│                              │
│ FLAGS                        │
│ S Z H P/V N C                │
│ ○ ● ○  ○  ○ ●               │
│                              │
│ [more registers ▾]           │
├──────────────────────────────┤
│ DISPLAY  CPU  MEM  BUS  I/O │
└──────────────────────────────┘
```

Primary register information first.

Alternate registers / internal detail use progressive disclosure.

---

# 6. COMPACT — DEVICES destination

```text
┌──────────────────────────────┐
│ SHINO-80      ▶︎  ⏸  STEP ⋯ │
├──────────────────────────────┤
│ DEVICES                      │
│                              │
│ 💾 FDD A       READY         │
│ 💾 FDD B       EMPTY         │
│ ⇄  RS-232C     9600          │
│ ▤  PRINTER     ONLINE        │
│ ◷  TIMER       100 Hz        │
│ ♫  PSG         IDLE          │
│                              │
├──────────────────────────────┤
│ DISPLAY  CPU  MEM  BUS  I/O │
└──────────────────────────────┘
```

Tap a row → selected device detail.

---

# 7. COMPACT — selected device detail

```text
┌──────────────────────────────┐
│ ‹ DEVICES          FDD A     │
├──────────────────────────────┤
│                              │
│ DRIVE A                      │
│                              │
│ MOTOR      ON                │
│ TRACK      10                │
│ SIDE       0                 │
│ SECTOR     03                │
│ COMMAND    READ              │
│ STATUS     BUSY              │
│                              │
│             [ EJECT ]        │
│                              │
├──────────────────────────────┤
│ DISPLAY  CPU  MEM  BUS  I/O │
└──────────────────────────────┘
```

The machine keeps running while this view is open unless paused.

---

# 8. PHONE LANDSCAPE / COMPACT HEIGHT

Candidate override:

`height < 500 CSS px`

## Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ SHINO-80    ▶︎ ⏸ STEP  ⋯                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                     SHINO DISPLAY                            │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ DISPLAY   CPU   MEM   BUS   I/O                              │
└──────────────────────────────────────────────────────────────┘
```

Inspector opens as temporary overlay/sheet.

Do not place permanent bottom trace and right inspector simultaneously.

---

# 9. Toolbar compression

Expanded:

```text
RUN | PAUSE | STEP | SPEED x1 | RESET | IRQ | NMI | MORE
```

Medium:

```text
RUN/PAUSE | STEP | SPEED | RESET | MORE
```

Compact:

```text
▶︎/⏸ | STEP | ⋯
```

RESET / IRQ / NMI may move to More if space requires.

Destructive/disruptive commands remain clearly labeled inside the menu.

---

# 10. Display Focus Mode

All layouts may provide future Focus Display mode.

```text
┌──────────────────────────────┐
│                              │
│                              │
│        SHINO DISPLAY         │
│                              │
│                              │
│                         [×]  │
└──────────────────────────────┘
```

Focus mode hides observation chrome without changing machine state.

Controls reappear predictably.

---

# 11. Debug Focus Mode

Future candidate for CPU research:

```text
┌──────────────────────────────────────────────┐
│ CPU REGISTERS             BUS / TRACE        │
│                                              │
│ ADDRESS LED               MEMORY             │
│ DATA LED                                     │
└──────────────────────────────────────────────┘
```

This mode may resemble the current v0.0.1 test bench.

Important:

The current Altair-style CPU panel is not discarded.

It becomes a **Debug Lab view**, rather than the entire future computer UI.

---

# 12. State model across layouts

Example transition:

```text
Expanded
CPU inspector selected
FDD A selected
Trace open
        ↓ window narrows
Compact
CPU destination active
FDD A selection preserved
Trace hidden
        ↓ window widens
Expanded
CPU inspector restored
FDD A still selected
Trace may restore according to preference
```

Machine execution never resets because of layout.

---

# 13. First v0.0.2 visual hierarchy

The first implementation should contain placeholders for future architecture even before those devices exist:

```text
DISPLAY   placeholder / no video device yet
CPU       current working v0.0.1 front panel
MEMORY    current memory view
BUS       current trace/signal view
DEVICES   empty device dock / “No devices attached”
```

This lets the shell be tested before peripheral implementation.

---

# 14. v0.0.2 Human QA matrix

## Desktop

- 1440-ish wide viewport
- resize down toward Medium
- inspector collapse
- trace collapse
- keyboard focus

## Tablet

- portrait
- landscape
- two-pane ratio
- rotation state preservation

## Smartphone

- portrait
- landscape
- bottom navigation
- 44px-class controls
- safe-area padding
- no accidental horizontal scroll
- pane switching while CPU is running

## Visual questions

Human should specifically judge:

- does the machine display feel like the star?
- does the shell feel modern without sterilizing the retro machine?
- are LEDs still fun?
- is telemetry dense but readable?
- does Compact feel designed rather than merely compressed?
