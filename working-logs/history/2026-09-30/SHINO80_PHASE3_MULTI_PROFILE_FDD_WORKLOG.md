# SHINO-80 PHASE 3 — Multi-Profile FDD WORKLOG

Issue: #59
Purpose branch: `feature/shino80-multi-profile-fdd-phase3-20260929`
Baseline main: `c6e0e041370bd20b2a32fa10c218f4212c051fdf`

Status: COMPLETED / REVIEWED / MERGED

## 2026-09-29 setup

- Human selected PHASE 3.
- live main verified at `c6e0e041370bd20b2a32fa10c218f4212c051fdf`.
- Issue #59 and the purpose branch were created.
- restart entries and active PLAN were synchronized.

## 2026-09-29 pre-implementation review

Read Issue comments:

- #5886687192 — full pre-implementation review
- #5886783128 — explicit reminder to read comments, not only Issue body
- #5886824325 — response establishing the B/C/D specification gate

The review allowed Checkpoint A in principle but required six contracts to be
fully frozen before B/C/D:

1. DPBs for profiles 02h–04h
2. controller register/transfer/error semantics
3. byte-exact S80B v3 header
4. exact high-RAM map
5. host profile UX / raw `.s80d`
6. profile-aware CBIOS / SELDSK

## Specification freeze completed

Normative file:
`docs/head/SHINO80_PHASE3_MULTI_PROFILE_FDD_SPEC_v1.md`

Frozen facts include:

- final DPBs for all five native profiles, with mechanical formulas
- 37h HEAD / 38h MEDIA_PROFILE and exact error codes 00h–07h
- exact transfer-abort/reset/overrun semantics
- S80B v3 fixed 64-byte layout and exact header fixture checksum 95h
- fixed system packing within C0/H0 8 KiB
- exact E800h–FD7Fh high-RAM ownership map
- exact raw-size -> profile table and rejection messages
- unchanged export filenames
- no PHASE 3 host NEW BLANK action
- exact SELDSK/profile-discovery and RMW rules
- DPB/header/memory fixtures required before B/C/D

## DPB mechanical results

- CLASSIC file usable: 246,784 bytes
- 2HD-JP file usable: 1,245,184 bytes
- 2DD-720 file usable: 720,896 bytes
- 2HD-AT-1200 file usable: 1,212,416 bytes
- 2HD-1440 file usable: 1,449,984 bytes

The 2HD-JP candidate was recalculated and promoted to final contract:
SPT64 / BSH6 / BLM63 / EXM7 / DSM152 / DRM255 / AL0 80h / AL1 00h /
CKS64 / OFF1.

## 2026-09-29 Checkpoint A + fixture gate

Checkpoint A was implemented after the frozen specification and returned for Codex review. The 2026-09-29 review found no implementation blocker in Checkpoint A; only repository state wording was synchronized before authorizing Checkpoint B.

Implemented:

- `src/devices/shino80/shino80-media-profiles.js`
  - immutable five-profile table
  - mechanically derived geometry, image length and DPB fields
  - exact length lookup and profile-aware blank builder API
- existing block-device CLASSIC constants now derive from profile 00h
- existing block-device still rejects non-CLASSIC mounts at Checkpoint A
- one-page build loads MediaProfile before Block Device
- Technical Manual source integrity includes MediaProfile
- `tests/fixtures/shino80_phase3_contract_fixtures.cjs`
  - independent five-row expected DPB table
  - exact 64-byte S80B v3 header
  - exact high-RAM interval table
- `tests/shino80_phase3_contract.test.cjs`
  - recomputed profile/DPB agreement
  - unique native image lengths and blank-image sizes
  - CLASSIC constant compatibility and larger-media rejection
  - S80B field/checksum fixture assertions
  - RAM size, pairwise overlap and protected-range assertions

Checkpoint B/C/D implementation remains untouched. Ports 37h/38h, larger
physical transfers, CBIOS blocking/deblocking and S80B v3 boot are not active.

## Verification

All commands used the root README Codex Node/pnpm runtime.

- `pnpm run test:phase3-contract` — PASS
- `pnpm run test:block` — PASS
- `pnpm run test:source` — PASS
- `pnpm test` — PASS, including the new PHASE 3 contract suite
- `pnpm run build` — PASS
- `pnpm run build:manual` — PASS
- `pnpm run test:manual` — PASS; 1,780 encodings
- `pnpm run test:browser` — PASS
  - existing A/B CP/M Chromium machine regression PASS
  - existing PHASE 2 whole-disk Chromium regression PASS
- `git diff --check` — PASS

Generated artifacts:

- `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
  - 253,680 bytes
  - SHA-256 `542ea7b01dc18d211f3111d1dcfd73941e1522629ca5ce23986fa18499d029ac`
- `deploy/shino80_technical_manual_v0.1.html`
  - 2,008,042 bytes
  - SHA-256 `bb91b558664c43c07020180d349bc99b11057c76262d0dcbb3ff9b3ab1436fa6`

## Next boundary

Resume at Checkpoint B controller multi-profile I/O. Do not begin CBIOS,
filesystem/S80B v3 boot or host multi-profile UX work before Checkpoint B has
its own focused regression evidence. Human still controls PR merge/publication.


## 2026-09-29 Codex review — Checkpoint A

Reviewed branch head `21f03fae098d50cb565076bfff95e3cb9116ec63` against baseline `c6e0e041370bd20b2a32fa10c218f4212c051fdf`.

Findings:

- MediaProfile source of truth matches the frozen five-profile contract.
- CLASSIC block constants remain API-compatible and derive from profile 00h.
- larger-profile mounts remain intentionally disabled in Checkpoint A.
- DPB fixture values and S80B v3 checksum fixture agree with the normative spec.
- high-RAM fixture ranges are internally non-overlapping and outside Page Zero/TPA/CCP/BDOS.
- build integration order loads MediaProfile before Block Device.
- no Checkpoint B/C/D runtime implementation was found.
- generated artifacts are build outputs, not hand-edited source.

Documentation cleanup before approval:

- normative spec status updated from "CODE IMPLEMENTATION NOT STARTED" to the actual Checkpoint A-complete state.
- stale worklog wording implying an earlier completed Codex re-review was corrected.

Result: Checkpoint A APPROVED. Checkpoint B controller multi-profile I/O may proceed. C/D remain blocked behind B and focused regression.

## 2026-09-29 Checkpoint B implementation

Implemented exactly the frozen controller contract without entering Checkpoint C/D:

- `shino80-block-device.js`
  - all five native raw profiles mount by unique exact image length
  - explicit profile selection validates the exact native image length
  - A:/B: slots independently own medium, profile ID and write protection
  - `37h HEAD` and read-only `38h MEDIA_PROFILE` are active
  - CHS validation and offset calculation are profile-derived
  - physical READ/WRITE transfers close after exactly 128, 512 or 1,024 bytes
  - fixed validation priority includes BAD_CYLINDER and BAD_HEAD
  - D/C/H/S writes abort active transfer; command reset and command reissue follow the frozen state rules
  - DATA over-read/over-write reports PROTOCOL
  - legacy BAD_TRACK, CLASSIC constants and `30h`–`36h` behavior remain compatible
- `tests/shino80_block_device_phase3.test.cjs`
  - first/last CHS read/write for every native profile
  - mixed-profile A:/B: ownership and MEDIA_PROFILE observation
  - fixed validation priority and all new state transitions
  - transfer abort/reset/reissue/overrun behavior
  - exact eject/reinsert and Bus low-byte decode for `37h`/`38h`

No CBIOS profile selection/blocking, S80B v3 boot/filesystem builder, or host
multi-profile UI was implemented. Checkpoints C/D remain untouched.

Checkpoint B verification (repository-documented Codex Node/pnpm runtime):

- `node --check` for changed source and focused test — PASS
- `pnpm run test:phase3-contract` — PASS
- `pnpm run test:phase3-block` — PASS
- `pnpm run test:block` — PASS (legacy CLASSIC suite)
- `pnpm test` — PASS, including all CPU/firmware/device/CP/M/build/manual suites
- `pnpm run test:browser` — PASS
  - A:/B: dual-drive + CP/M/filesystem/cursor/beeper Chromium regression
  - PHASE 2 whole-disk IMPORT/EXPORT Chromium regression
- `pnpm run build` / `pnpm run build:manual` — PASS
- `pnpm run test:artifact` / `pnpm run test:manual` — PASS
- `git diff --check` — PASS

Generated artifacts:

- `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
  - 255,568 bytes
  - SHA-256 `fd0b6a82e3dcbeca80b9309170e4ee2b8d9995960920df9f7caff79eb53a0ffc`
- `deploy/shino80_technical_manual_v0.1.html`
  - 2,008,042 bytes
  - SHA-256 `2901ab22a2a0b39221ae276abd213f834697726a2171851b613265289e1405bf`

Stop boundary: report Checkpoint B complete on Issue #59 and wait. No
Checkpoint C/D implementation, PR merge or publication is authorized by this task.

## 2026-09-29 Checkpoints C–E continuous implementation

Issue #59 comment `5892194891` superseded the earlier checkpoint stop boundary:
continue C → D → E → F unless a real specification ambiguity appears, then
create the single PHASE 3 PR and complete the existing unlisted preview flow.

Implemented:

- profile-aware CBIOS v3 at F400h with fixed DPH/DPB/CSV/ALV/state map
- per-SELDSK Bus-visible MEDIA_PROFILE discovery for independent A:/B:
- logical record to C/H/physical-sector mapping for all five native profiles
- full-sector reads and safe immediate read-modify-write preserving adjacent records
- generic profile-aware CP/M filesystem builder/readback with CLASSIC wrappers
- exact S80B v3 2HD-JP header, 8 KiB system packing and 2,304-byte CBIOS image
- strict ROM profile/header validation, v2/v3 load paths and MON fallback
- CP/M 2.2 BIOS relocation from FA00h to F400h for the v3 image
- host exact-size profile mapping, profile/write-protect shelf ownership and byte-exact export
- Inspector profile ID/name, geometry, physical sector/image bytes, C/H/S and ports 30h–38h

Focused evidence:

- `pnpm run test:phase3-cbios` — PASS
- `pnpm run test:phase3-system-disk` — PASS, S80B v3 boots CP/M to A>
- mixed A: 2HD-JP / B: 2DD-720 WBOOT reloads from A: and returns to B>
- `pnpm run test:cpm22` — PASS, CLASSIC relocation baseline unchanged
- `pnpm run test:browser` — PASS
  - legacy CLASSIC A:/B: and PHASE 2 IMPORT/EXPORT regressions
  - all five profile IMPORT/EXPORT/EJECT/REINSERT round trips
  - S80B v3 2HD-JP A: browser boot to CP/M A>

Checkpoint F full-suite/artifact/hash/PR/public-preview evidence follows below.

## 2026-09-30 Checkpoint F local closeout

Final local verification using the README-documented Codex Node/pnpm runtime:

- source and focused-test `node --check` — PASS
- `pnpm test` — PASS, including legacy and PHASE 3 C/D suites
- `pnpm run build` / artifact deterministic check — PASS
- `pnpm run build:manual` / `pnpm run test:manual` — PASS, 1,780 encodings
- `pnpm run test:browser` — PASS, all three Chromium suites
- `git diff --check` — PASS

Generated artifacts:

- `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
  - 280,519 bytes
  - SHA-256 `a656a626c4c9ef92b1f7fa074238342feede9a8a463d0854fd75cfffba202970`
- `deploy/shino80_technical_manual_v0.1.html`
  - 2,008,321 bytes
  - SHA-256 `5fa8c4e00b19e81a45efde4f961ffe420b194aeb4e5eeb3fc7212a769c48aec5`

PR and unlisted preview deployment evidence will be added after the corresponding
GitHub/content operations complete. The SHINO PR remains unmerged for Human Review.


## 2026-09-30 Human merge closeout

- PR #60 merged after Human Review.
- reviewed merge: `682a9196f3726ad49d745b8373c22ffab5366cc3`.
- PR #61 demo software disk was rebased onto merged PHASE 3 main and merged.
- current main after PR #61: `e48dd446a2c2f6d54f81ce19965598f73f7cb79e`.
- active PLAN/worklog moved to history.
