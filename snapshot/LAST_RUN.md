# LAST RUN
## ONE-PAGE Z80 COMPUTER / SHINO-80

Updated: 2026-09-24T14:25:00+09:00

## Candidate

SHINO Z80 CORE v0.0.1 — FIRST HEARTBEAT

Branch: `feature/z80-core-v0.0.1-first-heartbeat-20260924`

## Automated validation

CPU/source tests: **PASS**

Validated:

- RESET documented subset
- NOP `00h`
- PC increment
- F unchanged by NOP
- 4 T-state accounting
- R lower-seven increment
- R bit7 preservation
- abstract M1 fetch trace
- abstract refresh trace
- unsupported opcode fault
- one-page build
- unresolved build marker check
- required DOM IDs
- no external runtime script/link dependency
- generated inline JavaScript syntax parse

## Human review feedback

First delivered HTML: **FAIL — did not run**.

Cause found in exact delivered artifact:

```js
const $=s=>document.querySelector(s);
const $=s=>[...document.querySelectorAll(s)];
```

Duplicate lexical declaration caused load-time SyntaxError.

GitHub source already had the intended second helper as `$$`, so the failure was an exported review-artifact mismatch.

Corrected HTML:

- duplicate declaration fixed
- all three inline scripts parse successfully
- Human retry: PENDING

## Browser automation

Headless Chromium runtime validation still cannot be established in the current container because Chromium stalls on platform/DBus startup.

This is an environment limitation, not a runtime PASS.

## Regression prevention

`tests/one_page_v0.0.1_static.test.cjs` now parses all generated inline scripts using Node `vm.Script`.

Future exact review artifacts must also be checked before delivery.

## Accuracy statement

Current bus trace is `M_CYCLE_ABSTRACT`, not cycle-perfect.

Refresh A7 is not modeled rather than guessed.

## Next run

Human retries corrected first-heartbeat HTML.

If it boots, proceed to visual/UI feedback before v0.0.2.
