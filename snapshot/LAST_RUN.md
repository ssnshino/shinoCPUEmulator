# LAST RUN — 2026-09-30 PHASE 4 CANDIDATE / PR #64 / HUMAN REVIEW PENDING

Updated: 2026-09-30T16:53:59+09:00

- Reviewed main: `830f6a30c9b2a22dbdef3b0e400ff863c14e6654` (PR #62 PHASE 3 closeout).
- Active PLAN: `plan/head/SHINO80_PHASE4_CPM_COMPAT_FOREIGN_MEDIA_PLAN.md`.
- State: PHASE 4 candidate / Human Review pending. PR #64 remains OPEN and unmerged; physical iPhone/Edge QA remains unverified.
- Latest change: documentation-only current-state clarification and Markdown whitespace cleanup.

## Historical record — 2026-09-29 PHASE 2 MERGE CLOSEOUT

The following PHASE 2/3 entries preserve their state at the recorded checkpoint; they do not describe the current active PLAN.

## Completed

- Issue #56 — PHASE 2 Whole Disk IMPORT + EXPORT
- PR #57 — merged by explicit Human GO
- reviewed main merge: `8c3e1896db4c68cfc1746ed2ebca38d624ef4dc1`
- source branch: `feature/shino80-whole-disk-import-export-phase2-20260929`
- baseline: `ff04df719e19d517faeea26e09cfbc912bb2cd18`

## Delivered behavior

- A/B raw 256,256-byte `.s80d` EXPORT
- INSERTED/EJECTED byte-exact source handling
- POWER-OFF transactional IMPORT
- one global pending import, explicit CONFIRM/CANCEL
- target EJECT/REINSERT blocked while pending
- async-read ownership revalidation
- invalid/read-failed/canceled/ownership-changed/POWER paths are atomic no-ops
- B: `WORK.COM` guest-visible EXPORT/IMPORT round-trip
- nonbootable A: reaches ROM MON; exact system image restores A> autoboot
- no synthetic Bus events
- responsive browser coverage at 390x844, 1280x900, 900x400

## Verification evidence

PR/worklog recorded PASS for:

- `pnpm test`
- `pnpm run build`
- `pnpm run build:manual`
- `pnpm run test:browser`
- `git diff --check`

GitHub Actions status was not attached to PR #57; these are the reviewed local
execution records in the PR/worklog.

## Closeout

PHASE 2 PLAN/worklog moved to history. At that checkpoint there was no active implementation PLAN.
Public/unlisted preview publication remains a separate Human-authorized step.


## PHASE 3 pre-implementation specification freeze — 2026-09-29

- Human selected PHASE 3 Issue #59.
- branch: `feature/shino80-multi-profile-fdd-phase3-20260929`
- baseline: `c6e0e041370bd20b2a32fa10c218f4212c051fdf`
- comments #5886687192 / #5886783128 / #5886824325 read in full.
- all five DPBs, controller semantics/error codes, S80B v3 bytes, exact RAM map,
  host UX and profile-aware CBIOS/SELDSK contract frozen in repository.
- normative spec: `docs/head/SHINO80_PHASE3_MULTI_PROFILE_FDD_SPEC_v1.md`.
- no implementation source code changed.
- stop for Codex re-review.

## PHASE 3 Checkpoint A + fixture gate — 2026-09-29

- Human authorized continuation after Codex contract re-review.
- added immutable five-profile MediaProfile/DPB model
- retained CLASSIC-only controller mount and existing 30h–36h behavior
- derived legacy CLASSIC constants from profile 00h
- added independent five-profile DPB fixture
- added exact 64-byte S80B v3/checksum fixture
- added exact high-RAM size/non-overlap fixture
- wired the profile source into one-page and Technical Manual builds
- full `pnpm test` and real Chromium browser regression PASS
- `git diff --check` PASS
- Checkpoint B/C/D runtime code remains untouched

## PHASE 3 Checkpoint B — 2026-09-29

- implemented native controller mounts for all five frozen media profiles
- added HEAD `37h` and read-only MEDIA_PROFILE `38h`
- made CHS validation, offsets and 128/512/1024-byte transfers profile-derived
- preserved independent A:/B: slot ownership and CLASSIC `30h`–`36h` behavior
- implemented fixed validation priority, command reset, transfer abort/reissue and DATA overrun semantics
- added `tests/shino80_block_device_phase3.test.cjs`
- `pnpm test`, real Chromium `pnpm run test:browser` and `git diff --check` PASS
- Checkpoints C/D remain untouched; stopped for Human review

## PHASE 3 Checkpoints C–E — 2026-09-29

- latest Issue #59 direction removed intermediate stop gates and authorized continuous C → D → E → F
- implemented profile-aware CBIOS v3 at F400h with five DPBs and safe immediate RMW
- implemented exact S80B v3 2HD-JP header/system packing and strict ROM v2/v3 boot/fallback
- retained CLASSIC S80B v2 and legacy CP/M behavior
- added relocatable SHINO CP/M BIOS binding for the F400h CBIOS v3
- generalized CP/M filesystem construction/readback by profile
- implemented five-profile host IMPORT/EXPORT, shelf profile/write-protect retention and geometry Inspector
- focused unit tests and real Chromium all-profile/S80B v3 boot regressions PASS
- Checkpoint F full regression, one logical commit, PR and unlisted preview closeout in progress


## PHASE 3 merge closeout — 2026-09-30

- Issue #59 — PHASE 3 Multi-Profile FDD completed.
- PR #60 merged by explicit Human GO.
- reviewed PHASE 3 merge: `682a9196f3726ad49d745b8373c22ffab5366cc3`.
- PR #61 demo software disk rebased onto the merged PHASE 3 main and merged.
- historical main at PR #61 merge: `e48dd446a2c2f6d54f81ce19965598f73f7cb79e`.
- PHASE 3 PLAN/worklog moved to history.
- active implementation PLAN at that historical checkpoint: none.
- unlisted PHASE 3 preview had already been deployed and Human exercised the application before merge.


## PHASE 4 implementation setup — 2026-09-30

- Human selected PHASE 4.
- Issue #63 created: CP/M Compatibility + Foreign Media Bridge.
- purpose branch: `feature/shino80-phase4-cpm-compat-foreign-media-20260930`.
- baseline reviewed main: `830f6a30c9b2a22dbdef3b0e400ff863c14e6654`.
- Google Drive design/research/basic/detail/QA/final-candidate work completed before repository setup.
- PLAN/spec/QA imported as the implementation contract.
- checkpoint stop gates are disabled; A -> F should proceed continuously unless a real spec ambiguity is found.
- Codex is implementation worker; specification ownership remains with ChatGPT/Human.

## PHASE 4 implementation candidate — 2026-09-30

- Latest normative clarification: Issue #63 comment #5904064282, branch design head `a227fdf76d22ff06d431a52187f4c4ee1731ce4b`.
- Human GO authorized continuous implementation; Checkpoints A–E implemented.
- Host D88/FDI/DCP readers, immutable source, explicit F000/F001 validator and CP/M reader, all native conversion/capacity and I/O bridge UI added.
- Original COM fixtures execute on real Z80/BDOS/CBIOS; all-profile conversion readback crosses 128-record and 1024-record boundaries.
- Native builder respects USER/name uniqueness and EXM. CPU, ports, controller, CBIOS, profiles and S80B remain unchanged.
- Final regression/build/browser/artifact receipts are in the active PHASE 4 worklog.
- Reviewed main remains unchanged. No merge or publication. Human Review and physical-device QA remain next.
- Final standard test/build/manual/browser/diff checks PASS; byte-exact hashes are recorded in the worklog. The final PR contains one main-based logical commit.
- Final PR #64: https://github.com/ssnshino/shinoCPUEmulator/pull/64 — OPEN / Human Review pending. Not merged or published. Live PR head is authoritative.


## Documentation review follow-up — 2026-09-30T16:53:59+09:00

- Human authorized the minimal documentation fixes and a normal push to the existing PR #64 branch.
- CURRENT / integrated SPEC / LAST_RUN now distinguish reviewed main from historical PR #61 merge and identify the PHASE 4 candidate.
- SPEC logical-track formulas and PLAN architecture layers use Markdown lists instead of trailing-space hard breaks.
- Implementation, generated artifacts and PHASE 5 remain unchanged. Merge/publication remain Human-controlled.

- Follow-up validation: `pnpm test`, `pnpm run build`, `pnpm run build:manual`, `pnpm run test:manual`, `pnpm run test:browser`, and base-to-candidate `git diff --check` PASS on the isolated Mac mini checkout.
- Machine/manual hashes remain byte-identical to the original PHASE 4 candidate. Browser coverage is Chromium at 390×844 / 1280×900 / 900×400; physical iPhone/Edge remain unverified.
- Evidence is local execution, not GitHub CI; this repository has no tracked GitHub Actions workflow. The original implementation commit is preserved, followed by this Human-authorized documentation commit using a normal push.
