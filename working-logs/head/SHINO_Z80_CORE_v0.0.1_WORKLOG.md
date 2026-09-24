# SHINO Z80 CORE v0.0.1 WORKLOG

Created: 2026-09-24T13:42:12+09:00
Updated: 2026-09-24T14:32:00+09:00

## Work performed

1. Reviewed current repository rules/snapshot/PHASE 0 plan.
2. Checked Zilog UM0080 for RESET, NOP, M1 fetch, refresh and R behavior used by this milestone.
3. Checked SingleStepTests/z80 as a later bus/state test methodology candidate.
4. Implemented `Shino80Bus` with CPU trace vs debugger peek separation.
5. Implemented `Z80Core` first heartbeat with only NOP.
6. Added Node unit tests.
7. Added Altair-inspired LED front panel UI.
8. Added dependency-free one-page build script.
9. Generated `one_page_shino_z80_core_v0.0.1.html`.
10. Added dependency-free `package.json` scripts and one-page static test.
11. Ran `npm test`: CPU tests + build + static one-page check PASS.

## Human review failure #1

The first HTML delivered for Human review did not run.

Exact delivered artifact contained:

```js
const $=s=>document.querySelector(s);
const $=s=>[...document.querySelectorAll(s)];
```

This caused a load-time SyntaxError.

The GitHub source had intended `$$`, so the exported artifact was inconsistent with source.

## Human review failure #2

A RETRY artifact was created with the duplicate declaration fixed, and all inline scripts passed syntax parsing.

However it still did not operate.

Exact RETRY artifact inspection found the export path had collapsed intended multi-element helpers from `$$(...)` to `$(...)` throughout the app, e.g.:

```js
for(const row of $('#regGrid .regRow')) { ... }
for(const e of $('.flag')) { ... }
```

`querySelector()` returns one Element, so initialization failed with:

`$ is not a function or its return value is not iterable`

## Robust fix

The shorthand DOM helpers were removed entirely.

New helpers:

```js
const queryOne=s=>document.querySelector(s);
const queryAll=s=>[...document.querySelectorAll(s)];
```

All call sites now use explicit `queryOne()` / `queryAll()`.

This avoids reliance on `$` / `$$` tokens in the user-visible artifact pipeline.

## Exact artifact runtime validation

The exact replacement HTML was loaded into Chromium through Playwright `page.set_content()`.

Validated with zero page errors:

- initial load
- self-test PASS
- STEP
- BURST ×256
- RESET
- RUN VISUAL
- PAUSE
- register LEDs
- PC/R/T-state updates
- bus trace rendering
- memory monitor rendering

A screenshot was captured from the same exact artifact.

## Regression prevention

- generated inline scripts are parsed with Node `vm.Script`
- static test now requires `queryOne` / `queryAll`
- static test rejects `const $`, `const $$`, and `$$(` helper syntax
- future review HTML must be validated as the exact delivered artifact

## Important choices

- Did not set SP=FFFF on RESET because that is not supported by the RESET passage used for this milestone.
- Did not claim all general registers reset to zero.
- Did not model refresh A7 without evidence.
- Did not call the current trace cycle-perfect.
- Did not add BIOS/video/FDD before the CPU heartbeat.

## Result

CPU/source candidate: PASS.

First delivered artifact: FAIL.

RETRY artifact: FAIL.

Runtime-fixed exact artifact: **Chromium interaction smoke PASS / Human retry pending**.
