# LAST RUN
## ONE-PAGE Z80 COMPUTER / SHINO-80

Updated: 2026-09-24T17:18:00+09:00

## Task

Implement the first real Z80 instruction architecture after NOP.

## Implemented

- new `src/cpu/z80/z80-decoder.js`
- descriptor-based BASE decoder
- operand byte / little-endian word fetch
- 8-bit register helpers
- BC / DE / HL / SP pair helpers
- memory read/write execution paths
- 81 executable LD encodings
- NOP regression
- dynamic current mnemonic in UI
- teaching program in deploy artifact

## Automated result

PASS:

- 7 LD r,n forms
- 49 register-register LD forms
- 4 LD dd,nn forms
- HL indirect loads/stores
- BC/DE indirect accumulator forms
- absolute nn forms
- F unchanged
- R opcode-fetch behavior
- PC / T-state totals
- exact GitHub blob semantic execution
- deploy inline JS parse
- no external runtime dependency
- local Chromium teaching smoke / zero page errors

## Exact teaching-program result

```text
A      41
B      22
C      41
HL     0080
DE     0090
[0080] 41
[0090] 41
F      A5 unchanged
PC     0011
R      09
T      72
```

## Next

Human review of v0.0.3 teaching artifact.

Then choose the next CPU learning step, likely INC/DEC + Flags.


## Mobile More menu regression (2026-09-24T17:58:00+09:00)

Human smartphone testing confirmed the new LD/register behavior, then found the compact `…` menu did not visibly respond.

Root cause:
- machine More actions used browser `prompt()`
- unreliable/poor UX for Edge external-file mobile execution

Candidate fix:
- replaced browser prompt with in-page responsive More sheet
- RESET, BURST ×256, CLEAR TRACE, PACE available as real buttons
- artifact QA explicitly rejects `prompt()`
- static generated artifact validation PASS

Human real-device retry: **PASS**.


PHASE 1A is ready to serve as the base for stacked PHASE 1B development.
