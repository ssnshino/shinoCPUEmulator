# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Last updated: 2026-09-24T15:13:07+09:00

## Reviewed baseline

- Repository: `ssnshino/shinoCPUEmulator`
- Default branch: `main`
- Repository bootstrap PR #1: MERGED
- Bootstrap merge commit: `f374840d1c5f56431d48ecb90188ed7868b515fd`
- Machine: SHINO-80
- Reviewed main baseline remains research/document foundation.

## Parallel active candidates

### CPU first heartbeat

- PR: #2
- Branch: `feature/z80-core-v0.0.1-first-heartbeat-20260924`
- Candidate: SHINO Z80 CORE v0.0.1
- Human result: one-page HTML executes on smartphone
- Merge: PENDING HUMAN REVIEW

### UI foundation research

- Branch: `research/ui-design-standard-v0.1-20260924`
- Scope: modern UI research + SHINO-specific UI standard + three layout blueprints
- Runtime code change: NONE
- Merge: PENDING HUMAN REVIEW

## Current UI design documents

- `research/ui/SHINO_80_UI_RESEARCH_2026-09-24.md`
- `docs/head/SHINO_80_UI_DESIGN_STANDARD_v0.1.md`
- `docs/head/SHINO_80_UI_LAYOUT_BLUEPRINTS_v0.1.md`
- `plan/head/SHINO_80_UI_FOUNDATION_v0.1_PLAN.md`
- `working-logs/head/SHINO_80_UI_RESEARCH_WORKLOG_v0.1.md`
- `code/head/SHINO_80_UI_RESEARCH_QA_v0.1.json`

## UI core decisions proposed

- Modern Shell / Retro Machine
- DISPLAY FIRST
- OBSERVER SECOND
- top-level destinations: DISPLAY / CPU / MEMORY / BUS / DEVICES
- Expanded: navigation + primary + inspector + optional trace
- Medium: primary + one supporting inspector
- Compact: one major pane at a time
- phone landscape uses compact-height rule
- future peripherals live under Device Dock
- current LED front panel becomes Debug Lab / CPU Inspector, not the entire machine UI

## Candidate layout thresholds

```text
COMPACT   width < 720 CSS px
MEDIUM    720 <= width < 1200 CSS px
EXPANDED  width >= 1200 CSS px

COMPACT HEIGHT override: height < 500 CSS px
```

These are candidates pending real-device QA.

## Next gate

1. Human reviews UI Design Standard / Blueprints.
2. Decide whether to merge UI research PR.
3. CPU PR #2 remains independently reviewable.
4. After design approval, create a dedicated v0.0.2 UI implementation branch using the latest accepted CPU baseline.
5. v0.0.2 must refactor shell only; do not add FDD/UART/Printer behavior just to fill placeholders.

## Update History

- 2026-09-24T13:20:14+09:00 — ChatGPT — Initial repository snapshot created.
- 2026-09-24T15:13:07+09:00 — ChatGPT — Repository bootstrap merge、CPU PR #2、UI foundation researchをparallel candidateとして整理。
