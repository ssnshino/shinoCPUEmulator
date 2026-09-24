# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Last updated: 2026-09-24T13:20:14+09:00

## Reviewed baseline

- Repository: `ssnshino/shinoCPUEmulator`
- Default branch: `main`
- Initial main commit: `fef0ed9019806986851c350986a1df8e1101d840`
- Emulator implementation: NOT STARTED
- Machine: SHINO-80
- Current phase: PHASE 0 — Research / Architecture

## Active candidate

- Branch: `chore/repository-bootstrap-20260924`
- Purpose: Repository structure + existing project materials + initial research plan
- Merge: PENDING HUMAN REVIEW

## Current project documents

- `docs/head/ONE_PAGE_Z80_COMPUTER_PROJECT_CONCEPT_v0.1.md`
- `docs/head/SHINO_80_ARCHITECTURE_DRAFT_v0.1.md`
- `docs/head/VIRTUAL_MICROCOMPUTER_LAB_VISION_v0.1.md`
- `plan/head/SHINO_80_PHASE0_RESEARCH_PLAN_v0.1.md`

## Current state

No CPU implementation exists yet.

Repository bootstrap intentionally stops before creating a speculative emulator framework.

Next work is primary-source Z80 research and Architecture Draft verification.

## Next gate

PHASE 0 Research must establish:

- authoritative Z80 references
- instruction/prefix coverage map
- register/flag model
- interrupt semantics
- T-state / M-cycle model
- bus signal model
- test suite strategy
- SHINO-80 initial memory map
- SHINO-80 initial I/O map
- MVP success criteria

Only after that should PHASE 1 Z80 Core implementation begin.

## Update History

- 2026-09-24T13:20:14+09:00 — ChatGPT — Initial repository snapshot created.
