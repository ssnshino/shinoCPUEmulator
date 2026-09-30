# SHINO-80 PHASE 3 — Multi-Profile FDD PLAN

Issue: #59
Purpose branch: `feature/shino80-multi-profile-fdd-phase3-20260929`
Live main baseline: `c6e0e041370bd20b2a32fa10c218f4212c051fdf`

Status: ACTIVE / CHECKPOINTS A–E IMPLEMENTED + VERIFIED / CHECKPOINT F CLOSEOUT

Normative specification:
`docs/head/SHINO80_PHASE3_MULTI_PROFILE_FDD_SPEC_v1.md`

## Purpose

Implement a real-FDD-oriented multi-profile storage subsystem while preserving
CLASSIC byte-for-byte compatibility.

## Non-negotiable invariants

- CLASSIC media and S80B v2 remain unchanged.
- ports 30h–36h retain CLASSIC behavior.
- A:/B: both support profiles; A: is the only autoboot source.
- B: never autoboots.
- WBOOT from B: returns to B>.
- PHASE 2 host ownership/pending semantics remain.
- host actions never synthesize Bus I/O.
- media replacement remains POWER-OFF-only.

## Frozen native profile / DPB contract

| ID | Profile | Geometry | CP/M SPT | BSH | BLM | EXM | DSM | DRM | AL0/AL1 | CKS | OFF | Block | Reserved | File usable |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 00h | CLASSIC | 77/1/26/128 | 26 | 3 | 7 | 0 | 242 | 63 | C0/00 | 16 | 2 | 1,024 | 6,656 | 246,784 |
| 01h | 2HD-JP | 77/2/8/1024 | 64 | 6 | 63 | 7 | 152 | 255 | 80/00 | 64 | 1 | 8,192 | 8,192 | 1,245,184 |
| 02h | 2DD-720 | 80/2/9/512 | 36 | 5 | 31 | 3 | 176 | 127 | 80/00 | 32 | 2 | 4,096 | 9,216 | 720,896 |
| 03h | 2HD-AT-1200 | 80/2/15/512 | 60 | 6 | 63 | 7 | 148 | 255 | 80/00 | 64 | 1 | 8,192 | 7,680 | 1,212,416 |
| 04h | 2HD-1440 | 80/2/18/512 | 72 | 6 | 63 | 7 | 177 | 255 | 80/00 | 64 | 1 | 8,192 | 9,216 | 1,449,984 |

All formulas and directory/image byte counts are normative in the spec file.
Logical track order is C0/H0, C0/H1, C1/H0, C1/H1 ... for two-head media.

## Frozen controller contract

- 30h STATUS
- 31h COMMAND
- 32h DRIVE
- 33h CYLINDER / legacy TRACK
- 34h SECTOR
- 35h DATA
- 36h ERROR
- 37h HEAD
- 38h MEDIA_PROFILE

Error codes:

- 00 NONE
- 01 NO_MEDIA
- 02 BAD_DRIVE
- 03 BAD_CYLINDER, with legacy BAD_TRACK alias
- 04 BAD_SECTOR
- 05 WRITE_PROTECTED
- 06 PROTOCOL
- 07 BAD_HEAD

Transfer bytes are profile physical-sector bytes: 128 / 512 / 1024.
All register-abort, command-reissue, over-read/over-write and reset semantics are
fixed in the normative spec.

## Frozen S80B v3 contract

Profile 01h only.

- 64-byte header
- exact fixture checksum 95h
- system area 0000h–1FFFh
- loader 0040h–00BFh
- CBIOS image 0100h–09FFh, load F400h, 0900h bytes
- CCP 0A00h–11FFh, load 9400h
- BDOS 1200h–1FFFh, load 9C00h
- filesystem begins 2000h / C0/H1

The exact field offset table and fixture bytes are normative in the spec.
CLASSIC S80B v2 parsing/loading is unchanged.

## Frozen high-RAM map

- E800h–EBFFh scratch
- EC00h–EFFFh loader stack, SP=F000h downward
- F000h–F3FFh reserved guard
- F400h–FA7Fh CBIOS executable
- FA80h–FA9Fh DPH_A/B
- FAA0h–FAEFh five DPB slots
- FAF0h–FB2Fh CSV_A
- FB30h–FB6Fh CSV_B
- FB70h–FB8Fh ALV_A
- FB90h–FBAFh ALV_B
- FBB0h–FBCFh deblock A
- FBD0h–FBEFh deblock B
- FBF0h–FC0Fh RMW state
- FC10h–FCFFh reserved tail
- FD00h–FD7Fh DIRBUF

CBIOS resident image is exactly F400h–FCFFh = 0900h bytes.

## Frozen host UX

Raw size mapping:

- 256256 -> CLASSIC
- 1261568 -> 2HD-JP
- 737280 -> 2DD-720
- 1228800 -> 2HD-AT-1200
- 1474560 -> 2HD-1440

Unknown size:
`IMPORT REJECTED — UNSUPPORTED MEDIA SIZE: <bytes> BYTES`

Future duplicate/ambiguous size:
`IMPORT REJECTED — AMBIGUOUS MEDIA SIZE: <bytes> BYTES`

EXPORT filenames stay `SHINO80_DRIVE_A.s80d` /
`SHINO80_DRIVE_B.s80d` for every profile.

No host NEW BLANK control is added in PHASE 3. Blank media are builder/test API
products. Pending and Inspector fields are fixed in the normative spec.

## Frozen CBIOS / SELDSK contract

Every SELDSK C=0/1 selects 32h, reads profile 38h through Bus, caches profile ID
in per-drive state, selects the fixed per-profile DPB and returns DPH_A/B.
Invalid drive/no media/unknown profile returns HL=0000h.

A/B CSV, ALV and deblock metadata are independent. Physical scratch is shared.
READ always drains the entire physical sector then copies one 128-byte logical
record. WRITE types 0/1/2 all use immediate read-modify-write; no unallocated
write optimization and no dirty cache.

HOME/SETTRK/SETSEC/SECTRAN and WBOOT semantics are fixed in the normative spec.

## Required fixture gate before Checkpoint B/C/D

1. DPB calculator fixture
2. S80B v3 exact 64-byte fixture
3. high-RAM memory-overlap fixture

Implemented in `tests/shino80_phase3_contract.test.cjs` with independent fixed
expectations in `tests/fixtures/shino80_phase3_contract_fixtures.cjs`.

## Checkpoints

### A — MediaProfile + CLASSIC regression — IMPLEMENTED

- `shino80-media-profiles.js` is the five-profile immutable source of truth
- existing CLASSIC block constants derive from profile 00h
- multi-profile controller mounts were intentionally deferred at this checkpoint
- CLASSIC block-device and full regression remain required

### B — controller multi-profile I/O — IMPLEMENTED

- A:/B: slots own independent native profile IDs, media and write protection
- ports 37h HEAD and 38h read-only MEDIA_PROFILE are active
- geometry, CHS offset and transfer size derive from the mounted profile
- all five profiles complete first/last-sector read/write round trips
- abort/reset/command-reissue/overrun and fixed error-priority semantics are covered
- CLASSIC `30h`–`36h` regression remains passing

### C — CBIOS profile support — IMPLEMENTED

- per-SELDSK Bus-visible profile discovery and fixed per-profile DPBs
- logical-record mapping for one/two heads and 128/512/1024-byte physical sectors
- full-sector drain plus 128-byte copy and immediate read-modify-write
- independent A/B CSV, ALV and profile/deblock state

### D — filesystem/system media — IMPLEMENTED

- exact S80B v3 fixture and 2HD-JP system image
- ROM v2/v3 discrimination, strict v3 header validation and MON fallback
- F400h CBIOS v3, 9400h CCP and 9C00h BDOS boot
- profile-aware filesystem builder and CP/M BIOS relocation

### E — host media + browser acceptance — IMPLEMENTED

- exact size-to-profile IMPORT for all five profiles
- byte/profile/write-protect preserving shelf ownership and EXPORT
- profile/geometry/CHS/30h–38h Inspector fields
- real Chromium all-profile round trips and S80B v3 A: boot

### F — closeout

Final docs/snapshot/worklog sync, one logical commit presentation, then create the single PHASE 3 PR for Human Review. PR is not created at Checkpoints A–D.

## Merge blockers

- CLASSIC/S80B v2 compatibility break
- 30h–36h regression
- A:/B: native-profile mount or ownership regression
- B: autoboot
- A/B profile mix-up
- adjacent 128-byte record corruption
- CLASSIC `.s80d` rejection
- WBOOT regression
- synthetic host Bus I/O
- RAM overlap
- ROM overflow

## Standard verification

```bash
pnpm test
pnpm run build
pnpm run build:manual
pnpm run test:manual
pnpm run test:browser
git diff --check
```

## Checkpoint exit / PR rule

Checkpoint A–D use Issue checkpoint gates, not per-checkpoint PRs.

Checkpoint stop gates were superseded by Issue #59 comment `5892194891`, which
authorizes continuous C → D → E → F execution unless a real specification
ambiguity is found.

Checkpoint F creates one PR for the complete PHASE 3 branch. That PR remains unmerged until Human Review and explicit Human GO.

## Git / Human authority

One environment / one writer / one purpose branch. No direct push to main.
No merge or publication without explicit Human GO.
