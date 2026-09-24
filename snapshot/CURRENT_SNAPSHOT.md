# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Last updated: 2026-09-24T16:50:00+09:00

## Reviewed baseline

- Repository: `ssnshino/shinoCPUEmulator`
- Default branch: `main`
- UI Design Standard v0.1 / PR #3: MERGED
- SHINO-80 v0.0.2 UI FOUNDATION / PR #4: MERGED
- PR #4 merge commit: `13960f2216e9cede4c0212adbffc0e77ba0258ff`
- Human smartphone UI QA: PASS

## Active candidate

- Branch: `refactor/src-deploy-build-layout-20260924`
- Purpose: make modular `src/` the development source and `deploy/` the generated one-page distribution boundary
- Runtime behavior change: NONE
- Human merge: PENDING

## New repository boundary

```text
src/        development source of truth
scripts/    build tooling
tests/      source + deploy artifact QA
deploy/     generated standalone HTML
```

Current deploy artifact:

`deploy/one_page_shino80_v0.0.2_ui_foundation.html`

The old repository-root artifact path is removed in this candidate.

## Planned source growth

As implementation grows, source may naturally expand into:

- `src/cpu/z80/` — decoder / ALU / flags / prefixes / timing / interrupt
- `src/machine/shino80/` — bus / memory map / interrupt controller
- `src/devices/` — video / floppy / UART / printer / timer / sound
- `src/firmware/` — BIOS / monitor
- `src/debug/` — disassembler / trace / breakpoints / inspectors
- `src/ui/`
- `src/app/`

Do not create empty abstraction simply to satisfy this map.

## CPU direction after layout refactor

The next technical phase remains Instruction Architecture / Basic Opcode Set.

No CPU behavior is changed by this repository layout PR.
