# LAST RUN
## ONE-PAGE Z80 COMPUTER / SHINO-80

Updated: 2026-09-24T14:32:00+09:00

## Candidate

SHINO Z80 CORE v0.0.1 — FIRST HEARTBEAT

Branch: `feature/z80-core-v0.0.1-first-heartbeat-20260924`

## Human review history

### Artifact 1

FAIL — load-time JavaScript SyntaxError caused by duplicate `const $` declaration in the exact delivered artifact.

### Artifact 2 / RETRY

FAIL — syntax parsed, but the delivered artifact had intended `$$()` multi-element calls collapsed to `$()`.

Initialization then failed because a single Element from `querySelector()` was treated as iterable.

## Robust fix

Repository app source now uses only:

- `queryOne()`
- `queryAll()`

The `$` / `$$` shorthand is removed entirely.

## Exact artifact browser smoke

The runtime-fixed exact HTML was loaded in Chromium using Playwright `page.set_content()`.

PASS with zero page errors:

- initial render
- NOP SELF TEST
- STEP
- BURST ×256
- RESET
- RUN VISUAL
- PAUSE
- register LED rendering
- bus trace
- memory monitor

Observed example:

- after STEP: T-STATES = 4, R = 01
- after STEP + BURST ×256: T-STATES = 1028, R wrapped to 01 as expected
- after RESET: T-STATES = 0
- RUN/PAUSE advanced instructions without runtime exception

Screenshot from exact runtime-fixed artifact: PASS.

## Regression prevention

Static one-page test now:

- parses every inline script with Node `vm.Script`
- requires explicit `queryOne/queryAll`
- rejects `$` / `$$` DOM helper declarations/calls

## Accuracy statement

Current bus trace remains `M_CYCLE_ABSTRACT`, not cycle-perfect.

Refresh A7 is not modeled rather than guessed.

## Next run

Human retries the runtime-fixed artifact.

If it boots, visual/UI feedback becomes the next gate before v0.0.2.
