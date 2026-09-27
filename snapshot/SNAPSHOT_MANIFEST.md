# SNAPSHOT MANIFEST

Updated: 2026-09-27 JST

## Required restart set

Read only this set for an ordinary restart:

1. `README.md`
2. `AGENTS.md`
3. `snapshot/CURRENT_SNAPSHOT.md`
4. `snapshot/LAST_RUN.md`
5. `snapshot/NEXT_CHAT_PROMPT.txt`
6. `docs/head/SHINO80_CURRENT_SYSTEM_SPEC.md`
7. `docs/head/SHINO80_CPM_COMMAND_REFERENCE_v0.1.md`
8. `docs/head/SHINO80_TECHNICAL_MANUAL_v0.1.md`
9. `docs/head/SHINO80_FDD_DISK_DESIGN_NOTES_v0.1.md`

## Current design direction

Issue #41 / PR #42 disk autoboot is part of the released baseline. There is no
active implementation PLAN.

The next Human-selected design focus is FDD/DISK usability for removable
software media and a future self-hosted development workflow. The current
design note is:

- `docs/head/SHINO80_FDD_DISK_DESIGN_NOTES_v0.1.md`

The next implementation has not been selected. Persistence, INSERT/EJECT,
import/export and B: remain candidate later work and must not be treated as an
active contract until the Human selects a bounded phase and a new PLAN exists.

## Generated artifacts

- `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
- `deploy/shino80_technical_manual_v0.1.html`

## Historical material

- completed plans: `plan/history/`
- superseded phase specifications: `docs/history/`
- completed worklogs: `working-logs/history/`
- dated superseded snapshots: `snapshot/history/`

History is evidence, not current state. Read it only for regression analysis,
old design comparison or provenance.

## Validation rule

Every listed path must exist. Snapshot SHAs are evidence from the recorded
time; fetch GitHub and inspect current branch/HEAD/open PRs before changes.
