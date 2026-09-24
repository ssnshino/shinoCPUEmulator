# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Last updated: 2026-09-24T13:42:12+09:00

## Reviewed baseline

- Repository: `ssnshino/shinoCPUEmulator`
- Default branch: `main`
- Repository bootstrap PR #1: MERGED
- Bootstrap merge commit: `f374840d1c5f56431d48ecb90188ed7868b515fd`
- Machine: SHINO-80

## Active candidate

- Branch: `feature/z80-core-v0.0.1-first-heartbeat-20260924`
- Candidate: **SHINO Z80 CORE v0.0.1 — FIRST HEARTBEAT**
- Artifact: `one_page_shino_z80_core_v0.0.1.html`
- Scope: RESET + opcode fetch + `00h NOP` + PC/R/T-state + abstract M1/refresh trace + LED Front Panel
- Automated QA: PASS
- Human visual review: PENDING
- Merge: PENDING HUMAN REVIEW

## Accuracy boundary

Current trace precision:

`M_CYCLE_ABSTRACT`

This version is not cycle-perfect and does not claim pin-accurate T-state waveforms.

Implemented from the researched subset:

- documented RESET fields used by this milestone
- NOP functional behavior
- NOP 4 T-states
- M1 opcode fetch observation
- refresh observation
- R lower-seven increment with bit7 preservation

Not yet implemented:

- other opcodes
- HALT execution
- WAIT
- INT / NMI behavior
- prefix groups
- final SHINO-80 memory map
- BIOS / Video / FDD / UART / Printer

## Current documents

- `plan/head/SHINO_Z80_CORE_v0.0.1_FIRST_HEARTBEAT_PLAN.md`
- `docs/head/SHINO_Z80_CORE_v0.0.1_SPEC.md`
- `research/z80/Z80_FIRST_HEARTBEAT_RESEARCH_NOTE_v0.1.md`
- `working-logs/head/SHINO_Z80_CORE_v0.0.1_WORKLOG.md`
- `code/head/SHINO_Z80_CORE_v0.0.1_QA.json`
- `plan/head/SHINO_80_PHASE0_RESEARCH_PLAN_v0.1.md`

## Current test entrypoint

```bash
npm test
```

Expected:

- CPU unit tests PASS
- one-page build PASS
- static standalone HTML check PASS

## Next gate

Human opens the one-page artifact and checks:

- front panel readability
- LED size / density / color
- register grouping
- signal lamp feel
- STEP visual feedback
- RUN VISUAL pacing
- smartphone/desktop layout

Then v0.0.2 direction is chosen from actual use.

PHASE 0 research remains active in parallel; v0.0.1 does not mean the full Z80 research gate is complete.

## Update History

- 2026-09-24T13:20:14+09:00 — ChatGPT — Initial repository snapshot created.
- 2026-09-24T13:42:12+09:00 — ChatGPT — First heartbeat implementation candidate and Human visual gate recorded.
