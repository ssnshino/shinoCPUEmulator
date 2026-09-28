# CURRENT SNAPSHOT — SHINO-80

Updated: 2026-09-28 JST

## Live-state rule

Always fetch GitHub first. Recorded SHAs are evidence, not authority.

Latest reviewed storage implementation:

- Issue #54
- PR #55
- reviewed implementation commit: `3d492559c4765186e232cabefafa8c43a9ff814d`
- Human merge status: determine from live Git

## Current completed/reviewed machine

- Z80 instruction-level milestone complete
- external full-state oracle: `1,604,000 / 1,604,000 PASS`
- BIOS/MON v0.3
- pageable 64 KiB RAM
- DM-80 80×25 / 640×400
- Keyboard + one-bit beeper
- licensed CP/M 2.2
- one block controller on 30h–36h
- A: BOOT / SYSTEM / TOOLS
- B: USER / WORK / INTERCHANGE
- A/B CLASSIC 256,256-byte removable media
- A-only S80B v2 autoboot
- independent A/B page-local EJECT / REINSERT shelves
- B writable filesystem and A/B isolation
- WBOOT from B returns to B
- UI RESET returns through ROM autoboot to A while B media survives

## Current removable-media state

Implemented/reviewed:

- A/B drive select through port 32h
- A/B independent media and write-protect state
- POWER-OFF EJECT / REINSERT SAME MEDIA on both drives
- POWER-ON replacement guard
- A no-media MON fallback
- B is not a boot source
- B file survival across WBOOT, UI RESET and media cycle

Not implemented:

- whole-disk IMPORT / EXPORT
- larger media profiles
- browser reload persistence
- factory restore
- guest eject
- C:/D: additional drives

## Current design entry

- `docs/head/SHINO80_CURRENT_SYSTEM_SPEC.md`
- `docs/head/SHINO80_REMOVABLE_MEDIA_ROADMAP_v0.1.md`
- `docs/head/SHINO80_FDD_DISK_DESIGN_NOTES_v0.1.md`
- `docs/head/SHINO80_TECHNICAL_MANUAL_v0.1.md`

## Resume contract

Read README -> AGENTS -> CURRENT -> LAST_RUN -> NEXT_CHAT_PROMPT -> MANIFEST,
then fetch live Git state. Live Git wins.

## Next

After PHASE 1 is merged/released, design PHASE 2 only:

**Whole Disk IMPORT + EXPORT**

Do not split EXPORT and IMPORT into separate implementation phases again.
