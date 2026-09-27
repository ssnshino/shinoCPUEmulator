# CURRENT SNAPSHOT — SHINO-80

Updated: 2026-09-27 JST

## Current completed state

- repository: `ssnshino/shinoCPUEmulator`
- reviewed branch: `main`
- current released main: `47f2d6e1870c21c7ac55ec47620594b4adb02217` / PR #47
- completed implementation: Issue #41 / PR #42 Disk Autoboot; Issue #46 / PR #47 DRIVE A media lifecycle
- active implementation PLAN: none
- CPU instruction-level milestone: complete
- external full-state oracle: `1,604,000 / 1,604,000 PASS`, Failure 0
- integrated machine: BIOS/MON v0.3, pageable 64 KiB RAM, DM-80, Keyboard,
  Virtual Disk A, SHINO CBIOS/WBOOT, licensed CP/M 2.2, writable starter filesystem
- POWER → RUN / RESET autoboot with ROM MON pre-page-out fallback
- POWER-OFF DRIVE A EJECT / INSERT EJECTED DISK with exact-medium retention
- compact/mobile and desktop Human-visible media controls
- Human interactive PR #47 lifecycle QA: PASS

## Current removable-media state

Released: page-local medium survival across RESET / POWER / WBOOT, POWER-OFF
EJECT, exact-medium temporary shelf, POWER-OFF reinsertion, POWER-ON media-change
guard, no-media MON fallback and CP/M recovery after reinsertion.

Not implemented: whole-disk EXPORT, whole-disk IMPORT, factory-media restore,
browser reload persistence, B: drive and guest media eject.

Current design entry:
- `docs/head/SHINO80_REMOVABLE_MEDIA_ROADMAP_v0.1.md`
- `docs/head/SHINO80_FDD_DISK_DESIGN_NOTES_v0.1.md`

## Software Division contract

Google Drive `40_SHINO80_SOFTWARE_LAB/02_specs` contains draft synchronization,
Programmer’s Reference and S80B v2 Canonical Boot Profile documents. GitHub
remains runtime implementation source of truth.

## Resume contract

Read README → AGENTS → CURRENT → LAST_RUN → NEXT_CHAT_PROMPT → MANIFEST, then
fetch live Git state. Live Git wins.

## Next

No implementation PLAN is active. R2 whole-disk EXPORT is the next roadmap
candidate, not an active contract until Human selection and a PM/SE-authored PLAN.
