# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Last updated: 2026-09-24T20:18:00+09:00

## Stack

- main reviewed through PR #5
- PR #6 PHASE 1A: Human smartphone PASS
- PR #7 PHASE 1B: stacked on #6
- PHASE 1C branch: stacked on PHASE 1B

## Active candidate

- Branch: `feature/z80-phase1c-control-flow-20260924`
- Candidate: **SHINO Z80 CORE v0.0.5 — PHASE 1C CONTROL FLOW**
- Artifact: `deploy/one_page_shino80_v0.0.5_z80_phase1c.html`
- Exact semantic QA: PASS
- Artifact integrity: PASS
- Human real-device review: PENDING

## Executable BASE encodings

- NOP: 1
- LD: 81
- INC/DEC: 16
- PHASE 1C control flow: 7
- total: **105**

## New instructions

- JP nn
- JR e
- JR NZ,e
- JR Z,e
- JR NC,e
- JR C,e
- DJNZ e

## Visible teaching effect

The PC now revisits addresses:

```text
0004 -> 0005 -> 0004 -> 0005 -> 0004 ...
```

Conditional branches expose:
- TAKEN -> target
- NOT TAKEN -> fall-through

## Timing

- JP nn 10T
- JR e 12T
- JR cc 12T taken / 7T not
- DJNZ 13T taken / 8T not

## Next gate

Human smartphone review of v0.0.5.

After acceptance, CALL/RET + stack is the most visually interesting next control-flow step.
