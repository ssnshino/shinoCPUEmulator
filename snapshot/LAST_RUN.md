# LAST RUN — 2026-09-29 PHASE 2 WHOLE DISK IMPORT + EXPORT

## Contract

- Issue #56
- branch `feature/shino80-whole-disk-import-export-phase2-20260929`
- baseline `ff04df719e19d517faeea26e09cfbc912bb2cd18`
- one bounded A/B IMPORT + EXPORT feature; no EXPORT-only split

## Implementation

Disk Inspector now owns host whole-medium interchange while preserving the
existing guest path CPU -> Bus -> controller -> media.

- one hidden file input fixes the target drive before file selection
- `.s80d` is raw 256,256-byte payload, MIME `application/octet-stream`
- EXPORT uses Blob/object URL/download anchor and a defensive source copy
- IMPORT performs full async read, exact-size validation, pending preview and
  explicit confirmation
- one pending transaction exists across the workbench
- target EJECT / REINSERT is UI-disabled and handler-rejected while pending
- confirmation rechecks POWER, target ownership and byte length
- mounted and shelved media retain their ownership state after replacement
- POWER ON invalidates pending/read state immediately

CPU, Bus, block-device API, ROM, CBIOS, CP/M and disk geometry are unchanged.

## Automated acceptance

The real-Chromium PHASE 2 regression covers:

- A/B suggested filenames and exact 256,256-byte downloads
- INSERTED/EJECTED export and import
- pre-confirm medium immutability
- cancel, invalid-size, read-failure, ownership-change and POWER cancellation
- single-pending across A/B while other-drive EXPORT remains available
- no synthetic Bus trace events
- B: `WORK.COM` guest creation -> EXPORT -> replacement -> IMPORT -> DIR restore
- nonbootable A: -> ROM MON and exact system-image restore -> A>
- 390x844, 1280x900 and 900x400 overflow/action visibility

Full command evidence and artifact hashes are recorded in
`working-logs/head/SHINO80_PHASE2_WHOLE_DISK_IMPORT_EXPORT_WORKLOG.md`.

## State

Implementation, regression and documentation are synchronized on the purpose
branch. PR is for Human Review only. No merge and no public preview publication.
