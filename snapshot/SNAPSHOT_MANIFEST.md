# SNAPSHOT MANIFEST

Updated: 2026-09-29 JST

## Required restart set

1. `README.md`
2. `AGENTS.md`
3. `snapshot/CURRENT_SNAPSHOT.md`
4. `snapshot/LAST_RUN.md`
5. `snapshot/NEXT_CHAT_PROMPT.txt`
6. `plan/head/SHINO80_PHASE2_WHOLE_DISK_IMPORT_EXPORT_PLAN.md`
7. `docs/head/SHINO80_CURRENT_SYSTEM_SPEC.md`
8. `docs/head/SHINO80_CPM_COMMAND_REFERENCE_v0.1.md`
9. `docs/head/SHINO80_TECHNICAL_MANUAL_v0.1.md`
10. `docs/head/SHINO80_FDD_DISK_DESIGN_NOTES_v0.1.md`
11. `docs/head/SHINO80_REMOVABLE_MEDIA_ROADMAP_v0.1.md`
12. `working-logs/head/SHINO80_PHASE2_WHOLE_DISK_IMPORT_EXPORT_WORKLOG.md`

## Current candidate

- Issue #56 — PHASE 2 Whole Disk IMPORT + EXPORT
- branch `feature/shino80-whole-disk-import-export-phase2-20260929`
- baseline/main `ff04df719e19d517faeea26e09cfbc912bb2cd18`
- status: implementation complete, Human Review pending

## Generated artifacts

- `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
- `deploy/shino80_technical_manual_v0.1.html`

## Non-targets

PHASE 3 larger media, browser persistence, factory restore, C:/D:, individual
file bridge, foreign geometry import, CPU/ROM/CBIOS changes and public
publication remain outside Issue #56.

## Validation rule

Fetch live branch/HEAD/Issue/PR before changes. Git live state wins over recorded
snapshot SHAs. Human controls merge and publication.
