# SHINO-80 PHASE 4 — QA / Acceptance v1

Status: NORMATIVE ACCEPTANCE
Issue: #63
Updated: 2026-09-30 JST

## A. Regression baseline
Must pass:
- pnpm test
- pnpm run build
- pnpm run build:manual
- pnpm run test:manual
- pnpm run test:browser
- git diff --check
- CLASSIC boot
- S80B v3 2HD-JP boot
- all five native IMPORT/EXPORT/EJECT/REINSERT
- demo disk BALLS.COM / MONX.COM / BEEP.COM

## B. CP/M compatibility
Original repository-generated COM fixtures verify BDOS 01/02/06/09/0B; OPEN/CLOSE/SEARCH/DELETE; sequential read/write; MAKE/RENAME; random read/write; SET DMA; SELECT/GET/RESET DISK; GET/SET USER; and 0/1/127/128/129-record, allocation-boundary, multi-extent, delete/reuse, USER 0/1/15, A/B same-name, directory-full and disk-full cases.

## C. F000 IBM3740
Prove exact geometry/DPB/XLT, non-identity sector translation, XLT-dependent reconstruction, 8-bit allocations, immutable source and byte-exact native conversion.

## D. F001 SINCLAIR 720
Prove exact 80×2×9×512 / 737,280 bytes, OFF1, 2KB blocks, DRM255, DSM356, 16-bit LE allocation including block >255, rejection of SHINO-native 2DD-720 interpretation, and successful native conversion.

## E. D88
Valid: single/multi-disk, zero offsets, 128/512/1024 sectors, non-sequential IDs.
Malformed: size mismatch, out-of-range/overlapping offsets, truncated header/data, impossible counts.
Irregular: duplicate/missing/variable sectors preserved or surfaced; conversion disabled when unsafe.

## F. FDI
Valid representative 720KB / 1.2MB / 1.44MB geometries.
Reject header <32, HeaderSize > file, total-size mismatch, geometry mismatch, invalid BPS.

## G. DCP/DCU

Verify the fixed v1 contract:

- header size exactly 162 bytes (0xA2)
- media type at 0x00
- 161-byte 0/1 track vector at 0x01..0xA1 inclusive
- last 1 in the vector is a terminal sentinel with no track payload
- payload begins at 0xA2
- no independent all-cylinders flag is parsed
- sparse layout uses pre-sentinel track flags
- full-layout mode is selected only when file length equals header + complete geometry payload
- sparse payload size equals the sum of stored-track payload sizes
- payload track order is ascending logical track order
- absent sparse tracks remain absent in the normalized model

Recognized media values:
- 01h: 77×2×8×1024
- 02h: 80×2×15×512
- 03h: 80×2×18×512
- 04h: 80×2×8×512
- 05h: 80×2×9×512
- 08h: 80×2×9×1024
- 11h: mixed first-track 128-byte / later 256-byte 77×2×26 format
- 19h: 80×2×16×256
- 21h: 80×2×26×256

Reject:
- file shorter than 162 bytes
- track-vector byte other than 0/1
- missing terminal sentinel
- sentinel beyond geometry track count
- unknown media type
- sparse/full payload size mismatch
- truncated stored track data

A recognized media type without an exact F000/F001 filesystem descriptor remains inspection-only.

## H. Detection / explicit profile selection

- structure wins over extension
- invalid .d88 rejects
- no parser => UNSUPPORTED_CONTAINER
- multiple parser => AMBIGUOUS_CONTAINER
- container geometry produces only an advisory compatible-descriptor list
- no profile is committed automatically, even when exactly one candidate exists
- no compatible descriptor => UNKNOWN_CPM_PROFILE
- multiple compatible descriptors are displayed without auto-choice
- directory plausibility never enables conversion
- filename/extension never selects the CP/M profile
- no sidecar manifest is required or accepted as a v1 identity shortcut
- explicit Human F000/F001 selection is required before filesystem interpretation
- explicit selection must still pass full descriptor validation
- wrong explicit selection is rejected and never reaches PROFILE_MATCHED

F000 exact validation:
- 77 required tracks / one head
- sector IDs 1..26 exactly once per required track
- 128 bytes each
- no missing/duplicate required sector
- frozen XLT used

F001 exact validation:
- 80×2 required tracks
- C0/H0,C0/H1... order
- sector IDs 1..9 exactly once per required track
- 512 bytes each
- no missing/duplicate required sector
- identity sector order

## I. Filesystem
Cover E5 deleted entries, USER 0..15, high filename attribute bits, 8/16-bit allocations, block >DSM, malformed RC, duplicate/gapped extents, exact 128-byte logical records.

## J. Native bridge
Exact fit succeeds; +1 record and directory overflow fail; no partial output.
Preserve USER/name/raw bytes; do not preserve foreign allocation IDs/placement.
Exercise all five native destination profiles.

## K. Transaction safety
BUILD leaves A/B unchanged.
SEND TO NATIVE IMPORT uses existing pending transaction. Before CONFIRM unchanged; CANCEL unchanged; POWER ON invalidates; ownership change prevents commit; EJECT/REINSERT protections remain.

## L. Bus isolation
No synthetic guest Bus events from parse, inspection, conversion, download or pending send-to-import.

## M. Browser acceptance
390×844 / 1280×900 / 900×400.
Exercise open, multi-disk selector, summary, warnings, profile status, directory, USER filter, file selection, destination, capacity, BUILD, DOWNLOAD, SEND TO NATIVE IMPORT.
No horizontal overflow; malformed failure is recoverable.

## N. Legal-clean evidence
Only generated/synthetic/original SHINO fixtures. No third-party copyrighted disk/software image.

## O. Merge blockers
Any PHASE 3 regression, direct foreign guest mount, foreign ID at port38h, B autoboot, heuristic wrong conversion, wrong XLT/allocation width, source mutation, partial output, synthetic Bus, third-party binary fixture, or demo disk regression.

## P. Completion
PHASE 4 closes only when A–O pass, docs/snapshot/worklog are synchronized, one final PR exists, and Human Review approves merge.

## Candidate evidence

Automated evidence lives in `tests/shino80_foreign_media_phase4.test.cjs`,
`tests/shino80_cpm_compat_phase4.test.cjs` and
`tests/shino80_foreign_bridge_browser_phase4.test.cjs`. The standard `pnpm test`
and `pnpm run test:browser` include these gates. The active worklog records
commands, artifact hashes, test coverage and Human-only limits. This evidence
does not substitute for Human Review or authorize merge/publication.

## Update History

- 2026-09-30T14:50:37+09:00 — Codex — Added implementation evidence entry points without weakening acceptance gates.
