# SHINO-80 SOURCE / DEPLOY LAYOUT STANDARD v0.1

Created: 2026-09-24T16:50:00+09:00
Status: **CANDIDATE STANDARD**

## Principle

> **One-page is the distribution format, not the development source format.**

SHINO-80 may ultimately contain CPU, memory, bus, video, storage, serial, printer, sound, firmware, debugger and UI code.

Maintaining that entire system as one hand-edited HTML would reduce readability, testability and review quality.

Therefore:

```text
src/        development source of truth
scripts/    build / tooling
tests/      automated verification
deploy/     generated distribution artifacts
```

## Current layout

```text
src/
├ app/
│  ├ shino80-workbench-v0.0.2.template.html
│  └ shino80-workbench-v0.0.2.js
├ cpu/
│  └ z80/
│     └ z80-core.js
├ machine/
│  └ shino80/
│     └ shino80-bus.js
└ ui/
   └ shino80-workbench-v0.0.2.css

scripts/
└ build-one-page.cjs

tests/
└ ...

deploy/
└ one_page_shino80_v0.0.2_ui_foundation.html
```

## Planned source domains

Create these when implementation reaches them; do not fill them with speculative code just to satisfy the tree.

```text
src/
├ cpu/
│  └ z80/
│     ├ core
│     ├ decoder
│     ├ alu
│     ├ flags
│     ├ prefixes
│     └ timing
├ machine/
│  └ shino80/
│     ├ bus
│     ├ memory-map
│     └ interrupt-controller
├ devices/
│  ├ video
│  ├ floppy
│  ├ uart
│  ├ printer
│  ├ timer
│  └ sound
├ firmware/
│  ├ bios
│  └ monitor
├ debug/
│  ├ disassembler
│  ├ trace
│  ├ memory-inspector
│  └ breakpoints
├ ui/
└ app/
```

This is a domain map, not a requirement to create one file per box immediately.

## Dependency direction

Preferred direction:

```text
UI / Debug
   ↓ observes
Machine
   ↓ owns
CPU + Bus + Devices
```

Firmware is data/code executed by the virtual CPU, not JavaScript UI behavior.

CPU code must not import DOM/UI code.

Devices must not directly manipulate UI.

Debug views observe state/trace through explicit boundaries.

## Build rule

`npm run build`:

1. reads source under `src/`
2. embeds CSS/JS into the one-page template
3. creates `deploy/` if missing
4. writes the standalone HTML to `deploy/`
5. does not overwrite source files

## Test rule

Tests target both levels:

### Source tests

- CPU semantics
- bus semantics
- device behavior
- JavaScript syntax

### Deploy artifact tests

- no unresolved build markers
- no accidental external runtime dependency
- inline script syntax
- required UI structure
- browser smoke
- real-device Human QA

## Editing rule

Never fix a bug only inside `deploy/*.html`.

Correct flow:

```text
src bug
↓
edit src
↓
test
↓
build
↓
deploy artifact
↓
artifact QA
```

If an emergency artifact patch is made for diagnosis, back-port the actual fix into `src/` before merge.

## Versioning

During active development, source files should be split by responsibility rather than copied wholesale for every small version.

Versioned filenames are appropriate where they improve review of major milestones or deploy artifacts.

Avoid accumulating `foo-v0.0.2.js`, `foo-v0.0.3.js`, `foo-v0.0.4.js` indefinitely in the active source tree.

As the project grows, stable role-based names should become the norm and Git history should carry revisions.

## One-page guarantee

The modular source structure must not weaken the original project promise:

> A user can receive one HTML file and run SHINO-80 locally in a browser.

The build boundary exists specifically to preserve that promise while allowing serious engineering internally.
