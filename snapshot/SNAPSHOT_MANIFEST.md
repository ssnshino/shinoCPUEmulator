# SNAPSHOT MANIFEST

Updated: 2026-09-28 JST

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

Latest reviewed storage feature:

- Issue #54 / PR #55 — PHASE 1 A:/B: Dual Drive
- implementation review head: `3d492559c4765186e232cabefafa8c43a9ff814d`
- live Git determines merge/release SHA

The current completion roadmap is PHASE 0–5.

Next implementation after PHASE 1 release:

**PHASE 2 — Whole Disk IMPORT + EXPORT**

The old EXPORT-only split is superseded and its PLAN/design documents are
history, not active work.

## Generated artifacts

- `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
- `deploy/shino80_technical_manual_v0.1.html`

## Historical material

Completed/superseded plans, designs and worklogs live under their history trees.
History is evidence, not current work.

## Validation rule

Fetch live branch/HEAD/open Issue/PR before changes. Git live state wins over
recorded snapshot SHAs.
