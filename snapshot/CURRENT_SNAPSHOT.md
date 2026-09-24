# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Last updated: 2026-09-24T18:22:00+09:00

## Reviewed / stacked baseline

- main reviewed through PR #5
- PHASE 1A branch / PR #6: Human smartphone PASS
- PHASE 1B branch is stacked on PHASE 1A
- UI baseline remains SHINO-80 v0.0.2

## Active stacked candidate

- Branch: `feature/z80-phase1b-inc-dec-flags-20260924`
- Base branch: `feature/z80-phase1a-instruction-architecture-20260924`
- Candidate: **SHINO Z80 CORE v0.0.4 — PHASE 1B**
- Scope: INC / DEC + first real FLAGS ENGINE
- Artifact: `deploy/one_page_shino80_v0.0.4_z80_phase1b.html`
- Exact blob semantic QA: PASS
- Deploy inline syntax: PASS
- Human real-device review: PENDING

## New source boundary

```text
src/cpu/z80/
├ z80-core.js
├ z80-decoder.js
└ z80-flags.js
```

This split is implementation-driven, not speculative.

## Current executable BASE encodings

- NOP: 1
- LD: 81
- INC/DEC 8-bit + (HL): 16
- total: **98**

## PHASE 1B flags semantics

INC:
- S/Z/H/PV updated
- N reset
- C preserved

DEC:
- S/Z/H/PV updated
- N set
- C preserved

Undocumented Y/X:
- preserved in PHASE 1B
- not claimed hardware-accurate yet

## Key teaching transitions

```text
7F -> 80  INC : S H PV
FF -> 00  INC : Z H
80 -> 7F  DEC : H PV N
00 -> FF  DEC : S H N
```

## Memory form

INC/DEC (HL):
- 11 T-states
- current trace: FETCH / REFRESH / READ / WRITE
- read at +4, write at +8

## Next gate

Human steps through v0.0.4 and confirms the FLAGS lamps behave visibly and intuitively.

Do not expand into general ALU before this human gate.
