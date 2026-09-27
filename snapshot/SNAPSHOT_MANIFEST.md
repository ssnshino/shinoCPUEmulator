# SNAPSHOT MANIFEST

Updated: 2026-09-27 JST

## Required restart set

1. `README.md`
2. `AGENTS.md`
3. `snapshot/CURRENT_SNAPSHOT.md`
4. `snapshot/LAST_RUN.md`
5. `snapshot/NEXT_CHAT_PROMPT.txt`
6. `docs/head/SHINO80_CURRENT_SYSTEM_SPEC.md`
7. `docs/head/SHINO80_CPM_COMMAND_REFERENCE_v0.1.md`
8. `docs/head/SHINO80_TECHNICAL_MANUAL_v0.1.md`
9. `docs/head/SHINO80_FDD_DISK_DESIGN_NOTES_v0.1.md`
10. `docs/head/SHINO80_REMOVABLE_MEDIA_ROADMAP_v0.1.md`

## Current design direction

PR #42 Disk Autoboot and PR #47 DRIVE A media lifecycle are released baseline.
There is no active implementation PLAN.

Roadmap: R1 released; R2 EXPORT / R3 IMPORT / R4 factory media / R5 persistence
remain candidates; R6 development-media expansion is future.

Software Division contract drafts live in Google Drive and are not required for
ordinary runtime restart.

## Generated artifacts

- `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
- `deploy/shino80_technical_manual_v0.1.html`

## Historical material

Completed plans, basic/detailed designs and worklogs live under their respective
`history/` trees. History is evidence, not current work.

## Validation rule

Fetch live branch/HEAD/open Issue/PR before changes. Git live state wins over
recorded snapshot SHAs.
