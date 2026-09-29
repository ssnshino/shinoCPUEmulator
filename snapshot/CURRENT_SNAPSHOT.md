# CURRENT SNAPSHOT — SHINO-80

Updated: 2026-09-29 JST

## Live-state rule

Always fetch GitHub first. Recorded SHAs are evidence, not authority.

Reviewed baseline:

- Issue #54 / PR #55
- reviewed `main`: `ff04df719e19d517faeea26e09cfbc912bb2cd18`

Active candidate:

- Issue #56 — PHASE 2 Whole Disk IMPORT + EXPORT
- purpose branch: `feature/shino80-whole-disk-import-export-phase2-20260929`
- Human Review pending; do not merge without explicit Human GO

## Current machine

- Z80 external full-state oracle: `1,604,000 / 1,604,000 PASS`
- BIOS/MON v0.3, pageable 64 KiB RAM, DM-80, Keyboard, beeper
- licensed CP/M 2.2 with writable A:/B: filesystems
- one controller on 30h–36h; selector 32h 0=A / 1=B
- A: BOOT / SYSTEM / TOOLS and only ROM autoboot source
- B: USER / WORK / INTERCHANGE and never autoboot
- independent A/B CLASSIC 256,256-byte removable media and shelves

## PHASE 2 candidate behavior

- A/B raw 256,256-byte `.s80d` EXPORT
- byte-exact export from INSERTED block slot or EJECTED host shelf
- A/B IMPORT with full-read + exact-size validation
- one global pending transaction and explicit CONFIRM / CANCEL
- pending target EJECT / REINSERT disabled in UI and handler paths
- confirmation rechecks POWER OFF, target, ownership and size
- INSERTED remains INSERTED; EJECTED remains EJECTED
- invalid size, read failure, cancel, ownership change and POWER ON are atomic no-ops
- POWER ON immediately discards pending import
- host actions emit no synthetic Bus I/O
- A import does not preflight bootability; invalid boot reaches ROM MON
- B remains nonbootable

Not implemented:

- browser reload persistence / media library
- factory restore / recent media
- larger/multi-profile media
- C:/D:
- individual CP/M file bridge
- foreign legacy CP/M geometry autodetection

## Current entries

- `plan/head/SHINO80_PHASE2_WHOLE_DISK_IMPORT_EXPORT_PLAN.md`
- `working-logs/head/SHINO80_PHASE2_WHOLE_DISK_IMPORT_EXPORT_WORKLOG.md`
- `docs/head/SHINO80_CURRENT_SYSTEM_SPEC.md`
- `docs/head/SHINO80_REMOVABLE_MEDIA_ROADMAP_v0.1.md`
- `docs/head/SHINO80_TECHNICAL_MANUAL_v0.1.md`

## Resume contract

Read README -> AGENTS -> CURRENT -> LAST_RUN -> NEXT_CHAT_PROMPT -> MANIFEST,
then fetch live Git state. Live Git wins.

## Next

Review Issue #56 candidate and its PR. Do not begin PHASE 3, merge, or publish
without Human authorization.
