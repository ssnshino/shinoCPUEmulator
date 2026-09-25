# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Last updated: 2026-09-24T23:55:00+09:00

## Main baseline

PR #6 through PR #11 are merged into main.

Machine baseline includes:
- Z80 core foundation
- flags
- control flow
- CALL/RET stack
- SYSTEM ROM / IPL
- TEXT VIDEO / CG-ROM
- POWER / warm RESET
- DM-80 exchangeable display-device model

## Active candidate

- Branch: `feature/z80-phase1e-complete-base-opcodes-20260924`
- Candidate: **SHINO Z80 CORE v0.0.9 — PHASE 1E BASE COMPLETE**
- Artifact: `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
- Human review: PENDING

## Instruction coverage

```text
BASE decode slots       256 / 256
BASE non-prefix execute 252 / 252
PREFIX entry points     CB DD ED FD
```

BASE functional execution now includes:
- full 8-bit ALU
- 16-bit INC/DEC + ADD HL
- DAA / rotates / CPL / SCF / CCF
- exchange family
- all JP/CALL/RET conditions
- PUSH/POP
- RST
- immediate IN/OUT
- HALT
- DI/EI functional state

## QA

- 252 non-prefix opcodes fresh-execution smoke: PASS
- targeted family regression: PASS
- representative SingleStepTests oracle: **23,000 / 23,000 PASS**
- DAA randomized oracle: **1000 / 1000 PASS**
- artifact inline syntax: PASS

Comparison policy currently excludes undocumented X/Y and internal WZ/P/Q.

## Next

**PHASE 1F — CB COMPLETE**

Implement all 256 CB second-byte encodings.
