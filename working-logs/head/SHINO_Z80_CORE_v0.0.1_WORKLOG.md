# SHINO Z80 CORE v0.0.1 WORKLOG

Created: 2026-09-24T13:42:12+09:00
Updated: 2026-09-24T14:25:00+09:00

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

## Human review failure and fix

The first HTML delivered for Human review did not run.

Direct inspection of that exact delivered artifact found a JavaScript syntax error:

```js
const $=s=>document.querySelector(s);
const $=s=>[...document.querySelectorAll(s)];
```

The second helper must be `$$`.

Important distinction:

- GitHub branch source `src/app/shino-z80-core-v0.0.1.js` already contained the correct `$$` helper.
- The user-visible exported artifact was inconsistent with that source.
- The corrected review artifact was patched and every inline script was parsed successfully with `node --check`.
- Chromium headless runtime validation remains unavailable in the current execution environment because Chromium stalls on DBus/platform startup.

Regression prevention:

- `tests/one_page_v0.0.1_static.test.cjs` now parses every inline `<script>` using Node `vm.Script`.
- A generated one-page artifact with the duplicate declaration will now fail `npm test`.
- Future user-delivered review HTML must be validated as the exact artifact, not inferred from source-only test results.

## Important choices

- Did not set SP=FFFF on RESET because that is not supported by the RESET passage used for this milestone.
- Did not claim all general registers reset to zero.
- Did not model refresh A7 without evidence.
- Did not call the current trace cycle-perfect.
- Did not add BIOS/video/FDD before the CPU heartbeat.

## Result

CPU/source candidate: PASS.

First delivered review artifact: FAIL (JavaScript syntax error).

Corrected review artifact: inline JavaScript parse PASS; Human visual/runtime retry pending.
