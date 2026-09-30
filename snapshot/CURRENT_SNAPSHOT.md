# CURRENT SNAPSHOT — SHINO-80

Updated: 2026-09-30 JST

## Live-state rule

Always fetch GitHub first. Recorded SHAs are evidence, not authority.

Latest reviewed storage implementation:

- Issue #59 — PHASE 3 Multi-Profile FDD
- PR #60 — merged
- reviewed merge: `682a9196f3726ad49d745b8373c22ffab5366cc3`
- demo software disk PR #61 — merged
- current main after demo merge: `e48dd446a2c2f6d54f81ce19965598f73f7cb79e`

## Current machine

- Z80 external full-state oracle: `1,604,000 / 1,604,000 PASS`
- BIOS/MON v0.3, pageable 64 KiB RAM, DM-80, Keyboard, beeper
- licensed CP/M 2.2 with writable A:/B: filesystems
- one controller on 30h–38h; selector 32h 0=A / 1=B
- A: BOOT / SYSTEM / TOOLS and only ROM autoboot source
- B: USER / WORK / INTERCHANGE and never autoboot
- independent A/B five-profile removable media and profile-preserving shelves
- A/B raw `.s80d` IMPORT / EXPORT for CLASSIC, 2HD-JP, 2DD-720, 2HD-AT-1200 and 2HD-1440
- byte-exact EXPORT from INSERTED block slot or EJECTED host shelf
- POWER-OFF transactional IMPORT with one workbench-wide pending transaction
- explicit CONFIRM / CANCEL; pending target EJECT / REINSERT blocked in UI and handlers
- commit-time POWER / target / ownership / exact profile-size revalidation
- INSERTED remains INSERTED; EJECTED remains EJECTED
- invalid size, read failure, cancel, ownership change and POWER ON are atomic no-ops
- POWER ON immediately discards pending import
- host actions emit no synthetic Bus I/O
- A import does not preflight bootability; invalid boot reaches ROM MON
- B remains nonbootable

Not implemented on reviewed main:

- browser reload persistence / media library
- factory restore / recent media
- C:/D:
- individual CP/M file bridge
- foreign legacy CP/M geometry autodetection

## PHASE 3 completed

Issue comments #5886687192 / #5886783128 / #5886824325 have been incorporated into Issue #59, the active PLAN and `docs/head/SHINO80_PHASE3_MULTI_PROFILE_FDD_SPEC_v1.md`. The six pre-implementation specification areas are frozen.

Checkpoints A–E are implemented and focused automated/Chromium QA passes. An
immutable five-profile model owns geometry and derived DPBs. The block controller
mounts all five native profiles independently on A:/B:, exposes HEAD 37h and
read-only MEDIA_PROFILE 38h, and transfers exact 128/512/1024-byte physical
sectors while preserving CLASSIC compatibility. The DPB calculator, exact S80B
v3 header and high-RAM overlap fixtures are implemented and passing. The
profile-aware CBIOS, exact S80B v3 2HD-JP boot image, safe RMW, generic CP/M
filesystem builder and all-profile host IMPORT/EXPORT UX are active. Exact
closeout verification and generated artifact hashes are recorded in the active worklog.

## Current entries

- `docs/head/SHINO80_PHASE3_MULTI_PROFILE_FDD_SPEC_v1.md`
- `docs/head/SHINO80_CURRENT_SYSTEM_SPEC.md`
- `docs/head/SHINO80_REMOVABLE_MEDIA_ROADMAP_v0.1.md`
- `docs/head/SHINO80_TECHNICAL_MANUAL_v0.1.md`

Completed PHASE 2 evidence is archived under `plan/history/2026-09-29/` and
`working-logs/history/2026-09-29/`.

## Resume contract

Read README -> AGENTS -> CURRENT -> LAST_RUN -> NEXT_CHAT_PROMPT -> MANIFEST,
then fetch live Git state. Live Git wins.

## Next

No active implementation PLAN. The next roadmap phase is PHASE 4 CP/M compatibility / foreign-media interoperability. Do not start it without Human selection. Do not publish without Human authorization.