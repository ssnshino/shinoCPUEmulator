# SHINO-80 PHASE 4 — CP/M Compatibility + Foreign Media Bridge PLAN

Issue: #63
Purpose branch: `feature/shino80-phase4-cpm-compat-foreign-media-20260930`
Baseline main: `830f6a30c9b2a22dbdef3b0e400ff863c14e6654`

Status: IMPLEMENTED AND VERIFIED CANDIDATE / HUMAN REVIEW PENDING

Normative specification:
`docs/head/SHINO80_PHASE4_CPM_COMPAT_FOREIGN_MEDIA_SPEC_v1.md`

Acceptance:
`docs/head/SHINO80_PHASE4_QA_ACCEPTANCE_v1.md`

## Purpose

Implement CP/M 2.2 compatibility regression and a host-side foreign-media bridge without changing the PHASE 3 native runtime contract.

PHASE 4 success means:

1. selected CP/M 2.2 software/filesystem semantics are regression-tested;
2. D88 / FDI / DCP/DCU are parsed read-only into a normalized sector model;
3. exact supported foreign CP/M profiles reconstruct directory/files;
4. selected files convert into a fresh SHINO native `.s80d`;
5. every PHASE 3 regression still passes.

Direct foreign guest mounting is not a completion criterion.

## Frozen PHASE 3 invariants

- native profile IDs 00h–04h unchanged
- ports 30h–38h unchanged
- S80B v2/v3 unchanged
- A: only autoboot
- B: never autoboot
- guest I/O remains CPU -> Bus -> device
- foreign IDs never appear at MEDIA_PROFILE 38h
- foreign media is never directly mounted to A:/B:
- native IMPORT / EXPORT / EJECT / REINSERT semantics unchanged
- host foreign actions do not synthesize guest Bus I/O

## Exact foreign profiles

### F000 IBM3740-CPM22
- 77×1×26×128
- 256,256 bytes
- SPT26 / BSH3 / BLM7 / EXM0 / DSM242 / DRM63
- AL0=C0h / AL1=00h / CKS16 / OFF2
- 8-bit allocation pointers
- XLT: `1,7,13,19,25,5,11,17,23,3,9,15,21,2,8,14,20,26,6,12,18,24,4,10,16,22`

### F001 SINCLAIR-PLUS3-CPM22-720
- 80×2×9×512
- 737,280 bytes
- logical SPT36
- BSH4 / BLM15 / EXM0 / DSM356 / DRM255
- AL0=F0h / AL1=00h / CKS64 / OFF1
- 16-bit little-endian allocation pointers
- logical tracks C0/H0,C0/H1,C1/H0,C1/H1...
- identity sector order

## Supported containers v1

Read-only:
- D88
- FDI
- DCP/DCU

## Architecture

- A. CP/M Compatibility Test Layer
- B. Foreign Container Layer
- C. Foreign CP/M Profile Layer
- D. Foreign Filesystem Reader
- E. Native Bridge Layer
- F. Host UX / browser acceptance

## Checkpoints

### A — contract fixtures + CP/M compatibility
Exact F000/F001 descriptors, XLT, 8/16-bit allocation fixtures, repository-original compatibility COM fixtures, BDOS/FCB/USER/A-B/boundary regression.

### B — foreign container readers
Immutable normalized sector model, D88, FDI, DCP/DCU, strict malformed-input handling. Container parsers do not interpret filesystems.

DCP/DCU v1 is fixed to the 162-byte-header / terminal-sentinel interpretation in the normative spec. Do not implement a separate all-cylinders flag. Full-layout vs sparse-layout is resolved from exact file length.

### C — foreign CP/M filesystem reader
Explicit Human descriptor selection followed by exact descriptor validation, logical-record mapping, XLT, directory parsing, extent grouping, 8/16-bit allocations, raw record reconstruction.

Container geometry creates only an advisory compatible-candidate list. No filesystem descriptor is auto-committed from geometry, filename, extension, directory plausibility or a sidecar manifest.

### D — native bridge
Capacity preflight, USER/name/raw-record preservation, fresh native image creation, no partial output.

### E — host UX
`OPEN FOREIGN IMAGE -> inspect -> compatible profile candidates -> Human selects F000/F001 -> exact validation -> select files -> destination -> capacity -> BUILD SHINO DISK -> DOWNLOAD / SEND TO NATIVE IMPORT`

The foreign profile selector initially has no committed selection. Even a sole compatible candidate requires explicit Human selection before PROFILE_MATCHED.

### F — closeout
Full regression, browser QA, generated artifacts, docs/snapshot/worklog sync, one final PHASE 4 PR, then Human Review.

## Clarification freeze — Issue #63 comment response

Two implementation ambiguities reported before coding are resolved normatively:

1. Foreign filesystem identity: PHASE 4 v1 uses explicit Human F000/F001 selection plus complete descriptor validation. Container geometry never auto-authorizes conversion. There is no v1 sidecar-manifest identity scheme.
2. DCP/DCU: use the 162-byte-header interpretation documented in the normative spec and the verified `o-p-a/fdimageid` parser. Bytes 0x01..0xA1 are a 161-byte 0/1 vector whose last 1 is a terminal sentinel; payload starts at 0xA2; no separate all-cylinders flag is parsed; full-vs-sparse storage is resolved by exact file length.

## Workflow

Checkpoint stop gates are disabled.

Continue A -> B -> C -> D -> E -> F without routine permission stops.

Stop only when a real specification ambiguity or contradiction blocks implementation. In that case ask Issue #63 with:
- exact specification location
- ambiguity/contradiction
- implementation decision needed
- factual alternatives

Codex is the implementation worker. It does not re-review or redesign the specification.

No checkpoint PRs. Create one PHASE 4 PR at F. No merge without Human explicit GO. Publication is separately Human-controlled.

## Non-goals

- foreign disk direct guest mount
- foreign system boot
- D88/FDI/DCP write-back
- copy-protection emulation
- arbitrary heuristic CP/M autodetection
- CP/M 3
- timestamp extension preservation
- third-party executable/disk redistribution

## Standard verification

```bash
pnpm test
pnpm run build
pnpm run build:manual
pnpm run test:manual
pnpm run test:browser
git diff --check
```

## Implementation progress

- A: original CALL 0005 COM stubs and real CCP-loaded ABI fixture; console/FCB/USER/random/boundary/full regression implemented.
- B/C: immutable copied-byte container model; strict D88/FDI/DCP readers; explicit F000/F001 selection, XLT/16-bit allocations and safe reconstruction implemented.
- D: all five native builders, capacity preflight and no partial output implemented. Native packing now respects EXM and USER/name grouping.
- E: I/O host bridge, multi-disk selector, USER filter, file/destination/capacity/build/download/pending SEND implemented.
- F: generated machine/manual, standard regression, three-size Chromium acceptance and restart synchronization. One final logical commit/PR, then Human Review. No merge/publication.

## Update History

- 2026-09-30T16:53:59+09:00 — Codex — Replaced architecture hard breaks with list items; scope and checkpoint contract unchanged.
