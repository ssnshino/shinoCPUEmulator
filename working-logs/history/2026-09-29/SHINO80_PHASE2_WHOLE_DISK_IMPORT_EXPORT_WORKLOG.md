# SHINO-80 PHASE 2 Whole Disk IMPORT + EXPORT Worklog

Date: 2026-09-29 JST

Issue: `#56 PHASE 2: Whole Disk IMPORT + EXPORT for A:/B:`

Purpose branch: `feature/shino80-whole-disk-import-export-phase2-20260929`

Reviewed `main` baseline: `ff04df719e19d517faeea26e09cfbc912bb2cd18`

Status: COMPLETED / REVIEWED / MERGED

PR #57 review follow-up: target-drive EJECT / REINSERT is now disabled in the
rendered UI and rejected by both handlers while confirmation is pending. The
ownership-race regression now changes ownership during asynchronous file read,
before pending state is established, and proves commit-time rejection remains
an atomic no-op.

## Result

Implemented one bounded host whole-medium interchange feature for both SHINO-80
CLASSIC drives without changing the CPU, Bus, ROM, CBIOS, CP/M, block-device API
or 256,256-byte geometry.

- raw `.s80d`, 256,256 bytes, `application/octet-stream`
- suggested downloads `SHINO80_DRIVE_A.s80d` / `SHINO80_DRIVE_B.s80d`
- byte-exact EXPORT from INSERTED block slot or EJECTED drive shelf
- defensive export copy through Blob + object URL + temporary download anchor
- one hidden file input shared by desktop and compact Disk Inspector
- target drive and expected ownership fixed before file selection
- full asynchronous file read and exact-size validation
- workbench-wide single pending transaction
- pending target drive EJECT / REINSERT disabled in both UI and handlers
- explicit pending details, `CONFIRM IMPORT` and `CANCEL`
- commit-time POWER/target/ownership/size revalidation
- INSERTED replacement remains INSERTED
- EJECTED replacement remains EJECTED
- genuine EMPTY import mounts as INSERTED without adding EMPTY as a normal mode
- POWER ON immediately discards pending/read state
- A: pending warning explains that host import does not validate bootability

Invalid-size, read-failed, canceled, ownership-changed and POWER-on paths leave
the canonical medium unchanged. A/B host actions do not fabricate Bus events.

## Browser acceptance

`tests/shino80_whole_disk_import_export_phase2.test.cjs` uses real Chromium and
the generated standalone page. It verifies:

- A/B exact download filename, byte length and content
- INSERTED/EJECTED source ownership
- medium remains unchanged before confirmation
- global single-pending rule across A/B
- other-drive EXPORT while pending
- explicit cancel
- invalid-size atomic no-op
- simulated file-read failure atomic no-op
- pending target EJECT / REINSERT UI and handler rejection
- async-read ownership-change rejection before pending establishment
- pending cancellation and handler/UI guards on POWER ON
- EJECTED shelf replacement without accidental insertion
- B: normal CP/M `SAVE 1 WORK.COM` -> EXPORT -> replacement -> IMPORT -> `DIR`
  restoration through the guest-visible filesystem
- A: correctly sized nonbootable import -> ROM MON fallback
- exact A: system-image import -> autoboot and `A>` restoration
- final A system bytes unchanged across B operations
- no page errors, network requests, synthetic Bus trace growth or horizontal
  overflow at 390x844, 1280x900 and 900x400

The existing `browser_smoke_v0.0.9.cjs` continues to cover PHASE 1 A/B boot,
WBOOT, UI RESET, media cycle, CP/M filesystem, display, keyboard and debugger
regressions, and now also checks the POWER-OFF/POWER-ON state of the new actions.

## Verification evidence

All commands used the root README's documented Codex Node/pnpm runtime.

- `node --check src/app/shino80-workbench-v0.0.2.js` — PASS
- `node --check tests/shino80_whole_disk_import_export_phase2.test.cjs` — PASS
- `pnpm run build` — PASS
- `pnpm run build:manual` — PASS
- `pnpm run test:manual` — PASS; 1,780 encodings / 2,007,921 bytes
- `pnpm test` — PASS, including CPU, firmware, block, CBIOS, CP/M, source,
  artifact and deterministic manual regression
- `pnpm run test:browser` — PASS
  - existing dual-drive/CP/M Chromium smoke PASS
  - PHASE 2 whole-disk IMPORT + EXPORT Chromium regression PASS
- `git diff --check` — PASS

Generated artifacts:

- `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
  - 247,978 bytes
  - SHA-256 `805ab5d60a70b8d87cea4a94adde86f4101c0f47c07cdaaef2221716a3676753`
- `deploy/shino80_technical_manual_v0.1.html`
  - 2,007,921 bytes
  - SHA-256 `def9b4754d7a6bb40760cc562e574f9d8fc6f141cecf309d1cd126ca761cc41f`

## Boundaries

Not included:

- POWER-ON hot swap / live snapshot
- IndexedDB, browser reload persistence, cabinet or recent media
- factory restore
- larger/multi-profile media
- C:/D:
- individual CP/M file bridge
- foreign CP/M geometry detection or boot compatibility
- CPU / Bus / ROM / CBIOS / CP/M semantic changes
- public/unlisted preview publication

PR #57 was merged by explicit Human GO as reviewed `main` commit `8c3e1896db4c68cfc1746ed2ebca38d624ef4dc1`. Issue #56 closed completed. Publication remains a separate repository and separate Human GO.
