# SHINO-80 UI Research — 2026-09-24

Created: 2026-09-24T15:13:07+09:00
Status: RESEARCH NOTE
Scope: modern UI architecture for a one-page virtual microcomputer / debugger / device lab

## 1. Research question

SHINO-80は今後、

- computer display
- CPU inspector
- memory monitor
- bus analyzer
- floppy drives
- UART / RS-232C
- printer
- timer
- sound
- network
- future device plug-ins

を同じ一枚HTMLへ載せる可能性がある。

現在のv0.0.1はCPU test benchとして成立しているが、機能をカードとして縦に追加し続けると情報密度と操作性が破綻する。

そのため、2026年時点の主要UI guideline / developer tool UIを調査し、SHINO-80固有のUI原則へ翻訳する。

---

## 2. Source hierarchy

This research distinguishes:

1. **External guidance** — source material from Apple / Android / VS Code.
2. **SHINO interpretation** — project-specific design decision derived from those sources.
3. **Open candidate** — not yet frozen, requires actual browser/device testing.

No external design system is copied wholesale.

---

## 3. Apple — design principles

Source:
- Apple WWDC26 — Principles of great design
- https://developer.apple.com/videos/play/wwdc2026/250/

Apple frames design as intentional creation and discusses principles including Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, and Delight.

### SHINO interpretation

SHINO-80 should not maximize the amount of visible instrumentation merely because it can.

The interface should:

- make the current machine state understandable
- make the next action obvious
- preserve user control
- reveal advanced detail progressively
- keep the machine itself visually distinctive

**Derived rule:** observation detail is valuable only when it remains navigable.

---

## 4. Apple — split views

Source:
- Apple HIG — Split views
- https://developer.apple.com/design/human-interface-guidelines/split-views

Apple describes split views as multiple adjacent content panes and explicitly presents patterns such as sidebar + main canvas + inspector. It also advises compact environments such as portrait iPhone not to force several panes side-by-side, and notes that macOS split panes can be resized or hidden.

### SHINO interpretation

Expanded SHINO-80 should use:

```text
Navigation / Machine List
        +
Primary Machine Display
        +
Supporting Inspector
```

Compact SHINO-80 should NOT shrink all three.

It should show one major pane at a time while preserving selection and machine state.

---

## 5. Apple — toolbar vs navigation

Source:
- Apple HIG — Toolbars
- https://developer.apple.com/design/human-interface-guidelines/toolbars

Apple separates:

- toolbar: actions that operate on the current view/content
- tab/navigation structures: movement between app areas

Apple also recommends deliberately limiting toolbar items to avoid crowding.

### SHINO interpretation

Global machine controls belong to the toolbar:

- RUN / PAUSE
- STEP
- RESET
- speed
- overflow / more

Top-level observation areas belong to navigation:

- DISPLAY
- CPU
- MEMORY
- BUS
- DEVICES

Do not mix `STEP` and `CPU` as equal navigation items.

---

## 6. Apple — materials / Liquid Glass

Source:
- Apple HIG — Materials
- https://developer.apple.com/design/human-interface-guidelines/materials

Current Apple guidance positions Liquid Glass as a functional/navigation layer floating above content, and discourages using it as ordinary content material.

### SHINO interpretation

Do not make the entire SHINO-80 interface glassy.

Use the conceptual separation:

```text
CONTENT LAYER
  retro machine / CRT / LED panel

CONTROL LAYER
  modern toolbar / navigation / sheets / inspector chrome
```

**Project phrase:**

> Modern Shell / Retro Machine

The retro machine is content.
The 2026 observer/control UI is shell.

---

## 7. Apple — color

Source:
- Apple HIG — Color
- https://developer.apple.com/design/human-interface-guidelines/color
- Apple HIG — Branding
- https://developer.apple.com/design/human-interface-guidelines/branding

Apple recommends restrained accent use and warns against overwhelming colorful controls or relying on similar colors over visually rich content.

### SHINO interpretation

Separate two systems:

### A. Machine signal lamps

Signal lamps such as M1 / MREQ / RD / WR should use a consistent lamp language and always have textual labels.

They are **signals**, not error severity indicators.

### B. Shell semantic status

Use semantic color sparingly:

- green: READY / healthy / active state
- amber: WAIT / PAUSED / attention
- red: FAULT / destructive action / reset warning
- blue/cyan: selected / informational emphasis
- neutral: ordinary control state

Never communicate meaning by color alone.

---

## 8. Apple — motion

Source:
- Apple HIG — Motion
- https://developer.apple.com/design/human-interface-guidelines/motion

Apple recommends purposeful motion, avoiding unnecessary animation for frequently performed operations, and not making important information depend on motion alone.

### SHINO interpretation

Do NOT flash the DOM once per real bus event at MHz scale.

Instead:

```text
raw CPU events
↓
activity accumulator
↓
30 / 60 Hz observer frame
↓
lamp brightness / short decay
```

This both preserves meaning and protects performance.

Support `prefers-reduced-motion`.

---

## 9. Apple — type / familiarity / safe areas

Sources:
- Apple — Scaling fonts automatically / Dynamic Type
- https://developer.apple.com/documentation/uikit/scaling-fonts-automatically
- Apple HIG — Labels
- https://developer.apple.com/design/human-interface-guidelines/labels
- Apple — safeAreaLayoutGuide
- https://developer.apple.com/documentation/uikit/uiview/safearealayoutguide

Apple emphasizes legible text, system-familiar typography behavior, and layout within unobscured safe areas.

### SHINO interpretation

Typography has two roles:

```text
SHELL UI       system sans-serif
MACHINE DATA   monospace
TERMINAL       machine-specific font later
```

Avoid 9px UI labels as a default.

Technical telemetry may be dense, but navigation/action labels need comfortable legibility.

Use CSS safe-area insets on mobile.

---

## 10. Android / Material — adaptive layouts

Sources:
- Android Developers — Canonical layouts
- https://developer.android.com/develop/adaptive-apps/guides/canonical-layouts
- Android Developers — Supporting pane layout
- https://developer.android.com/develop/adaptive-apps/guides/build-a-supporting-pane-layout
- Android Developers — Window size classes
- https://developer.android.com/develop/adaptive-apps/guides/use-window-size-classes

Android guidance treats layout as a function of currently available window size, not a fixed device model.

Supporting pane guidance describes:

- primary main content
- secondary supporting content
- side-by-side on larger windows
- one pane at a time / sheet alternatives on small windows
- preserved state while panes appear/disappear

### SHINO interpretation

SHINO-80 should adapt to **available viewport**, not detect “iPhone / iPad / PC”.

Use width families:

- Compact
- Medium
- Expanded

and a compact-height override for phone landscape.

The Display is primary content.
CPU / Memory / Bus / Device details are supporting panes.

---

## 11. VS Code — developer-tool information architecture

Sources:
- VS Code UX Guidelines — Overview
- https://code.visualstudio.com/api/ux-guidelines/overview
- Views
- https://code.visualstudio.com/api/ux-guidelines/views
- Sidebars
- https://code.visualstudio.com/api/ux-guidelines/sidebars
- Panel
- https://code.visualstudio.com/api/ux-guidelines/panel

VS Code distinguishes:

- primary sidebar
- secondary sidebar
- editor/main area
- panel
- status bar

It also recommends keeping view counts and names under control and using panels for supporting information that benefits from horizontal space.

### SHINO interpretation

SHINO-80 is closer to a **workbench** than a dashboard.

Natural mapping:

```text
Primary area      SHINO DISPLAY
Inspector         CPU / Device detail
Bottom panel      BUS TRACE / EVENT LOG
Navigation        DISPLAY / CPU / MEM / BUS / DEVICES
Status strip      RUN state / clock / T-state summary
```

Do not create one permanent card for every future peripheral.

---

## 12. Research synthesis

Multiple systems converge on the same pattern:

1. Identify primary content.
2. Keep global actions separate from navigation.
3. Use supporting panes for contextual detail.
4. Adapt structure to available width.
5. Preserve state when panes collapse.
6. Hide advanced detail until needed.
7. Restrain color and motion.
8. Keep controls large enough to operate.
9. Let content retain the product's identity.

For SHINO-80:

> **DISPLAY FIRST / OBSERVER SECOND**

and:

> **Modern Shell / Retro Machine**

are the two strongest project-specific UI principles.

---

## 13. Candidate implementation consequences

For v0.0.2 UI refactor:

- establish layout shell before adding peripherals
- move CPU test bench into an Inspector-capable workbench
- reserve central primary area for future SHINO Display
- turn FDD/UART/Printer into Device list + selected detail, not permanent full cards
- provide Compact one-pane navigation
- maintain machine/debug state across layout changes
- aggregate LED activity for future high-speed run
- stop using tiny text for navigation/control chrome

---

## 14. Research status

This research is sufficient to define **SHINO_80_UI_DESIGN_STANDARD_v0.1**.

It is not evidence that exact breakpoints, pane sizes, colors, or animation timing are optimal.

Those remain Human/browser QA candidates.
