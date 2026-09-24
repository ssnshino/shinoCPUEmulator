# SHINO-80 UI DESIGN STANDARD v0.1

Created: 2026-09-24T15:13:07+09:00
Status: **CANDIDATE STANDARD**
Applies to: SHINO-80 one-page machine shell and future VIRTUAL MICROCOMPUTER LAB workbench
Basis: `research/ui/SHINO_80_UI_RESEARCH_2026-09-24.md`

---

# 1. Core identity

SHINO-80 is two things at once:

1. a fictional 1980s microcomputer
2. a 2026 observation and debugging instrument

Do not visually merge those layers into one generic dashboard.

## Core phrase

> **Modern Shell / Retro Machine**

### Retro Machine

- CRT / machine display
- front panel
- LEDs
- switches
- device bodies
- machine-specific texture / typography / sound

### Modern Shell

- navigation
- responsive/adaptive layout
- toolbar
- inspector
- sheets
- overflow menus
- accessibility
- focus management
- viewport adaptation

The shell should make the machine easier to understand without erasing its character.

---

# 2. Primary-content hierarchy

The hierarchy is fixed conceptually:

```text
PRIMARY
  SHINO DISPLAY / active machine surface

SUPPORTING
  CPU
  MEMORY
  BUS
  DEVICES

TERTIARY
  TRACE
  EVENT LOG
  advanced statistics
  configuration
```

When space is scarce, tertiary disappears first, supporting content second, primary content last.

---

# 3. DISPLAY FIRST

When a real SHINO display exists, it is the default center of the machine.

The display is not merely another dashboard card.

It is:

> the surface through which a human uses the computer.

CPU / Memory / Bus / Devices are:

> surfaces through which a human observes the computer.

This distinction must remain visible in layout.

---

# 4. OBSERVER SECOND

Debugger / Inspector views are contextual supporting tools.

Default rule:

- show selected detail
- hide unneeded detail
- preserve state while hidden
- never require every subsystem to remain visible simultaneously

A hidden inspector does not mean its state is destroyed.

---

# 5. Navigation model

Top-level observation destinations:

```text
DISPLAY
CPU
MEMORY
BUS
DEVICES
```

Five is the initial maximum.

Future subsystems such as FDD / UART / PRINTER do not automatically become top-level navigation items.

They live under **DEVICES** unless Human testing proves a dedicated top-level destination is justified.

---

# 6. Toolbar model

Global machine actions belong to a global toolbar, not the navigation system.

Initial global action set:

```text
RUN / PAUSE
STEP
RESET
SPEED
MORE
```

Rules:

- keep frequent actions visible
- move rare actions to overflow
- do not duplicate the same action in several permanent toolbars
- destructive / disruptive actions receive clearer affordance
- toolbar may collapse to icons on narrow / short layouts, but accessible labels remain available

---

# 7. Device Dock

Future peripheral presentation uses a Device Dock / Device list.

Example:

```text
DEVICES

FDD A       READY
FDD B       EMPTY
RS-232C     9600
PRINTER     ONLINE
PSG         IDLE
TIMER       100 Hz
```

Selecting a device opens detail in the supporting inspector.

Example FDD detail:

```text
FDD A
MOTOR      ON
TRACK      10
SIDE       0
SECTOR     03
STATUS     BUSY

[EJECT]
```

Do not permanently render the full internal panel of every device.

---

# 8. Adaptive layout families

SHINO layout decisions are based on available viewport, not device detection.

Candidate browser breakpoints:

```text
COMPACT   width < 720 CSS px
MEDIUM    720 <= width < 1200 CSS px
EXPANDED  width >= 1200 CSS px
```

These are SHINO candidates, not copied platform constants.

They must be validated with real devices.

## Compact-height override

When height < 500 CSS px:

- reduce shell chrome
- hide nonessential status text
- keep primary content
- use sheets / navigation rather than stacked permanent panes

This specifically protects phone landscape.

---

# 9. Expanded layout rule

Expanded mode may show simultaneously:

- navigation rail/sidebar
- primary machine display
- supporting inspector
- bottom trace panel

Panels may later become resizable/collapsible.

Do not implement arbitrary drag docking in v0.0.2.

First validate fixed defaults.

---

# 10. Medium layout rule

Medium mode shows:

- primary content
- one supporting inspector

Trace is collapsed, overlaid, or opened as a temporary bottom panel.

Navigation becomes compact.

The main display remains larger than the supporting inspector.

Initial target ratio candidate:

```text
PRIMARY     ~60–70%
SUPPORTING  ~30–40%
```

Actual ratio remains a browser QA decision.

---

# 11. Compact layout rule

Compact mode shows **one major pane at a time**.

Default destination once SHINO Display exists:

`DISPLAY`

Bottom navigation candidate:

```text
DISPLAY | CPU | MEM | BUS | I/O
```

`I/O` may label the DEVICES destination on very narrow screens if needed.

Rules:

- no desktop three-pane squeeze
- no horizontal page overflow for primary UI
- switching pane does not reset CPU state
- switching pane does not clear selection
- current machine continues to run unless user pauses it

---

# 12. Landscape-phone rule

Phone landscape has useful width but very limited height.

Treat it as a special compact-height case, not a desktop.

Prioritize:

1. machine display
2. compact global controls
3. optional slide-over inspector

Do not permanently stack trace + register bank + display.

---

# 13. Touch target rule

Interactive controls should target approximately **44 × 44 CSS px or larger** on touch layouts unless real-device testing clearly supports another value.

The visual glyph may be smaller than its hit area.

Example:

```text
visible icon  20 px
hit target    44 px
```

Dense LEDs and telemetry are allowed to be smaller because they are display elements, not touch controls.

---

# 14. Typography

Three typography roles:

## Shell

Use system UI sans-serif for:

- navigation
- buttons
- headings
- device names
- explanatory copy

## Telemetry

Use monospace for:

- addresses
- register values
- opcodes
- trace
- memory hex
- timing

## Machine display

Future SHINO character ROM / terminal font belongs only to the machine display.

Do not force the entire shell into retro terminal typography.

### Density rule

Avoid 9px as a default shell UI size.

Technical data can be dense, but critical controls and labels remain comfortably readable.

---

# 15. Color systems

## Machine Signal Color

Signal LEDs use a consistent physical-instrument language.

A bus signal being active is not equivalent to an error.

Every lamp has a text label.

## Shell Semantic Color

Candidate semantics:

- green — READY / healthy
- amber — WAIT / PAUSED / attention
- red — FAULT / destructive
- cyan/blue — selection / informational emphasis
- neutral — ordinary chrome

Use accent color sparingly.

Never encode essential state by color only.

---

# 16. Motion / activity

Raw CPU speed can exceed meaningful human visual frequency.

Do not update visible lamps once per CPU event in high-speed modes.

Future activity model:

```text
CPU / device events
      ↓
activity buckets
      ↓
observer frame 30 / 60 Hz
      ↓
brightness / decay
```

Candidate decay:

`120–250 ms`

This value is not frozen.

Support:

`prefers-reduced-motion: reduce`

Reduced-motion mode should preserve state information without rapid pulsing.

---

# 17. Bus / memory visualizations

Bus and memory views are observation surfaces.

They may use high information density but must support:

- clear current selection
- stable scrolling
- readable hex alignment
- activity emphasis
- paused inspection
- debugger peek that does not create fake CPU traffic

Do not animate every memory cell.

Use event-based highlights / heat accumulation.

---

# 18. Trace panel

Bus Trace / Event Log is tertiary supporting information.

Expanded:
- bottom panel candidate

Medium:
- collapsible bottom panel / drawer

Compact:
- dedicated BUS destination or sheet

Trace must not permanently steal most of the machine display.

---

# 19. State preservation

Layout changes must preserve:

- CPU state
- running/paused state
- selected navigation destination
- selected device
- inspector mode
- scroll/selection where practical

Rotating a phone or resizing a browser window must not reset the virtual computer.

---

# 20. Safe area / browser chrome

Mobile shell spacing should account for:

```css
env(safe-area-inset-top)
env(safe-area-inset-right)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
```

Controls must remain usable around notches, home indicators, and browser UI.

---

# 21. Accessibility

Minimum requirements:

- keyboard-focusable controls on desktop
- visible focus indicator
- labels/tooltips for icon-only controls
- status is not color-only
- sufficient contrast
- text can enlarge without destroying navigation
- reduced-motion support
- touch targets remain usable
- selected destination is visible through shape/text/state, not color alone

---

# 22. Progressive disclosure

Do not display all advanced data by default.

Recommended layers:

```text
LEVEL 0   machine display / essential controls
LEVEL 1   selected inspector
LEVEL 2   detailed registers / device registers
LEVEL 3   raw trace / advanced timing / experimental internals
```

A beginner can run the machine.

An expert can open the machine.

---

# 23. Performance rules

UI observation must not dominate CPU emulation.

Principles:

- CPU state can update at virtual-machine rate
- visible DOM updates are throttled
- trace rendering is bounded / virtualized later
- memory highlights are event-based
- avoid rebuilding large DOM trees every instruction
- hidden panes should not perform expensive paint work

The observer must not become the bottleneck.

---

# 24. Anti-patterns

Do NOT:

- make every subsystem a permanent card
- shrink desktop layout onto phones
- make all surfaces translucent/glassy
- use retro monospace for every UI label
- use red for every active signal and also for faults without distinction
- animate every MHz-scale event
- put rare actions in the primary toolbar
- reset machine state when layout changes
- require horizontal scrolling for primary compact UI
- add a new top-level tab for every peripheral
- create arbitrary docking before fixed layouts are validated

---

# 25. v0.0.2 implementation contract

The first UI refactor should implement only the shell foundation:

1. semantic page shell
2. global toolbar
3. navigation destinations
4. primary machine/display placeholder
5. CPU inspector
6. Bus/Memory destinations
7. Device Dock placeholder
8. three layout families
9. safe-area support
10. larger touch controls
11. queryable CSS design tokens
12. reduced-motion path

Do NOT add real FDD/UART/Printer behavior merely to fill the new UI.

---

# 26. Acceptance gates

Before calling the UI foundation stable:

## Desktop
- primary content remains dominant
- inspector is useful but not overwhelming
- no accidental horizontal page scroll
- trace panel can hide

## Tablet
- two-pane layout remains readable
- selected inspector persists
- no cramped three-column layout

## Smartphone portrait
- one-pane navigation works
- touch controls are comfortable
- no tiny desktop controls
- state survives destination switching

## Smartphone landscape
- compact-height layout protects machine display
- controls remain reachable
- sheets/panels do not cover the entire useful viewport unnecessarily

## Human gate

Human visual preference remains final for:

- spacing
- lamp size
- retro/modern balance
- panel ratios
- toolbar density
- visual delight

---

# 27. Core phrases

> DISPLAY FIRST.

> OBSERVER SECOND.

> ADAPT, DON'T SHRINK.

> BIG TOUCH, SMALL DATA.

> MOTION = INFORMATION.

> Modern Shell / Retro Machine.

> The computer is the content. The debugger is the lens.
