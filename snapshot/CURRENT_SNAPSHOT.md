# CURRENT SNAPSHOT — SHINO-80

Updated: 2026-09-29 JST

## Live-state rule

Always fetch GitHub first. Recorded SHAs are evidence, not authority.

Latest reviewed storage implementation:

- Issue #56 — PHASE 2 Whole Disk IMPORT + EXPORT
- PR #57 — merged
- reviewed `main`: `8c3e1896db4c68cfc1746ed2ebca38d624ef4dc1`

## Current machine

- Z80 external full-state oracle: `1,604,000 / 1,604,000 PASS`
- BIOS/MON v0.3, pageable 64 KiB RAM, DM-80, Keyboard, beeper
- licensed CP/M 2.2 with writable A:/B: filesystems
- one controller on 30h–36h; selector 32h 0=A / 1=B
- A: BOOT / SYSTEM / TOOLS and only ROM autoboot source
- B: USER / WORK / INTERCHANGE and never autoboot
- independent A/B CLASSIC 256,256-byte removable media and shelves
- A/B raw 256,256-byte `.s80d` IMPORT / EXPORT
- byte-exact EXPORT from INSERTED block slot or EJECTED host shelf
- POWER-OFF transactional IMPORT with one workbench-wide pending transaction
- explicit CONFIRM / CANCEL; pending target EJECT / REINSERT blocked in UI and handlers
- commit-time POWER / target / ownership / size revalidation
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

- `docs/head/SHINO80_CURRENT_SYSTEM_SPEC.md`
- `docs/head/SHINO80_REMOVABLE_MEDIA_ROADMAP_v0.1.md`
- `docs/head/SHINO80_TECHNICAL_MANUAL_v0.1.md`

Completed PHASE 2 evidence is archived under `plan/history/2026-09-29/` and
`working-logs/history/2026-09-29/`.

## Resume contract

Read README -> AGENTS -> CURRENT -> LAST_RUN -> NEXT_CHAT_PROMPT -> MANIFEST,
then fetch live Git state. Live Git wins.

## Next

No active implementation PLAN. PHASE 3 is the next roadmap candidate, but do not
start implementation until lounge/research/basic/detail/QA design is completed
and Human selects it for implementation. Do not publish without Human authorization.
