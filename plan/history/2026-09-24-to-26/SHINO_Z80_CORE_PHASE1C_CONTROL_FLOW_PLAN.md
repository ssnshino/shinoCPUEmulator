# SHINO Z80 CORE PHASE 1C — CONTROL FLOW PLAN

Created: 2026-09-24T20:12:00+09:00
Status: IMPLEMENTED CANDIDATE
Candidate version: v0.0.5

## Purpose

Make SHINO-80 execute non-linear programs and expose the causal chain:

```text
register / flags
    ↓
branch condition
    ↓
PC change
    ↓
ADDRESS bus jump
```

## Scope

Implement:

- JP nn
- JR e
- JR NZ/Z/NC/C,e
- DJNZ e

## Execution metadata

Branching instructions return:

- branchTaken
- branchTarget
- fallThrough
- condition
- actual T-states

The CPU Inspector renders the result as:

```text
TAKEN -> 0004h
NOT TAKEN -> 000Ch
```

## Timing

Conditional branches require dynamic instruction timing.

The fixed-descriptor timing model from earlier phases is extended so one decoded instruction may report different actual T-states according to execution outcome.

## QA

- JP absolute target / little-endian operand
- JR positive and negative displacement
- 16-bit PC wrap
- NZ/Z/NC/C taken and not-taken
- 12T versus 7T conditional timing
- DJNZ 13T versus 8T
- DJNZ flags unchanged
- teaching-program non-linear PC sequence
- prior PHASE regressions
- complete one-page artifact checks
- Chromium interactive smoke

## Non-goals

No CALL / RET / stack work in this phase.

No JP cc family yet.

No ALU expansion.
