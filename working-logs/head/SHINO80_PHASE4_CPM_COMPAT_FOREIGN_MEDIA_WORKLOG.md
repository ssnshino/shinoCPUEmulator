# SHINO-80 PHASE 4 — CP/M Compatibility + Foreign Media Bridge WORKLOG

Issue: #63
Purpose branch: `feature/shino80-phase4-cpm-compat-foreign-media-20260930`
Baseline main: `830f6a30c9b2a22dbdef3b0e400ff863c14e6654`

Status: IMPLEMENTED AND VERIFIED CANDIDATE / HUMAN REVIEW PENDING

## 2026-09-30 setup
- Human explicitly selected PHASE 4.
- Google Drive research/basic/detail/QA/final candidate completed before repository implementation setup.
- Issue #63 created.
- purpose branch created from reviewed main.
- normative PLAN/spec/QA imported.
- implementation not yet started at this checkpoint.

## Frozen boundary
- PHASE 3 native runtime unchanged.
- foreign containers are host-side read-only sources.
- F000 IBM3740 and F001 SINCLAIR-PLUS3-CPM22-720 are exact v1 foreign descriptors.
- D88 / FDI / DCP/DCU are v1 container readers.
- output is a fresh SHINO native .s80d.
- no foreign guest mount or foreign boot.

## Workflow
Proceed A -> F continuously unless a real spec ambiguity blocks work.
Routine checkpoint reports must not stop progress.
One final PR at closeout. Human controls merge and publication.


## 2026-09-30 pre-implementation clarification

Codex correctly identified two real specification gaps before coding and stopped under the Issue #63 ambiguity rule.

Resolved by ChatGPT design authority:

1. exact foreign CP/M descriptor identity
   - no automatic filesystem-profile assertion from geometry
   - no filename/directory heuristic
   - no v1 sidecar manifest
   - Human explicitly selects F000 or F001 from structurally compatible candidates
   - full descriptor validator must pass before PROFILE_MATCHED

2. DCP/DCU byte contract
   - reference implementation basis: `o-p-a/fdimageid` commit `80f970af5a7fa8f916d849a722e5ae2e1ea5103c`
   - 162-byte header
   - byte 00h media type
   - bytes 01h..A1h inclusive = 161-byte 0/1 vector
   - last 1 = terminal sentinel, not a stored track
   - payload begins A2h
   - no separately parsed all-cylinders flag
   - full-layout vs sparse-layout is resolved from exact file length
   - supported media mappings and malformed-input rules frozen in SPEC/QA

No implementation source code had been changed before this clarification.
After the clarification sync, A -> F continuous implementation remains authorized.

## 2026-09-30 implementation

Updated: 2026-09-30T14:42:19+09:00

Implemented the clarified contract without changing CPU core/decoder/flags,
CBIOS, controller ports/native profile IDs or S80B v2/v3 boot behavior.

- `src/host/shino80-foreign-media.js`: structural container readers, copied-byte immutable model, frozen descriptors, exact validators, record mapper, directory/extents reader, native capacity/build.
- `src/app/shino80-foreign-bridge-ui.js`: host state and I/O device inspector. Explicit selection even with one candidate; recoverable failures; USER filter; all native destinations; DOWNLOAD; native pending SEND.
- Existing IMPORT CONFIRM/CANCEL logic remains authoritative. SEND stages a defensive byte copy, preserves target ownership/write protection and does not call mount until the existing confirmation handler.
- Native filesystem builder fixes required for conversion: uniqueness is USER + name, and physical directory entries group logical extents according to native EXM. CLASSIC bytes, starter/demo images and runtime contracts remain unchanged. All-profile 1025-record conversion is guest-read tested.
- The inspector caches authored HTML to avoid tearing down unchanged focused controls during observer refresh. No new top-level navigation destination.

### Verification evidence

- `tests/shino80_foreign_media_phase4.test.cjs`: all three formats, concatenated D88, shuffled/irregular sectors, malformed bounds, DCP recognized media/full/sparse/sentinel, F000 XLT, F001 blocks >255, immutable arrays/getters, malformed allocation/extents, USER/name, all native destinations, exact fit/+1 record/directory overflow.
- `tests/shino80_cpm_compat_phase4.test.cjs`: actual Z80 CALL 0005, CCP-loaded original ABI COM, stack/return/WBOOT, BDOS console, FCB, sequential/random, USER 0/1/15, A/B same-name, 0/1/127/128/129 records, delete/reuse, directory/disk full. F001-generated 1025-record file converted to all five profiles; 129 sequential reads and random reads at 511/1023/1024 prove physical entry boundaries.
- `tests/shino80_foreign_bridge_browser_phase4.test.cjs`: real Chromium at 390×844 / 1280×900 / 900×400. Open/recover, multi-disk, explicit profile, USER/files/destination/capacity/build, byte-exact downloads, pending/CANCEL/CONFIRM, ejected target, POWER invalidation and ownership race. Test-only observers prove A/B bytes and Bus sequence unchanged during host operations. No horizontal overflow/page errors.
- Fixtures are generated from independent constants in `tests/fixtures/shino80_phase4_fixtures.cjs`. No downloaded software/image/ROM or copied third-party parser was committed. The DCP implementation follows the frozen Issue clarification; source reference remains in SPEC.

Final standard command receipts, reproducible hashes and PR handoff are appended
after final verification. Physical iPhone QA is not claimed; Human Review remains
required. Public Daihanten content was not changed.

## Final verification and restart

Recorded: 2026-09-30T14:55:09+09:00

- `pnpm test` PASS (full standard chain including PHASE 4; original demo disk byte-exact rebuild and guest execution PASS).
- `pnpm run build` PASS; 305,107-byte standalone machine.
- `pnpm run build:manual` / `pnpm run test:manual` PASS; 2,009,663-byte manual, 1,780 encoding invariants and deterministic rebuild.
- `pnpm run test:browser` PASS (native machine, PHASE 2, PHASE 3 and all three PHASE 4 sizes).
- `git diff --check` PASS.
- Repeated machine/manual builds reproduce the same SHA-256 values below.
- Diff against main confirms CPU core/decoder/flags, CBIOS, block device, native profile module, system ROM and system disk source are unchanged.
- Read-only foreign/native host actions leave the guest Bus sequence unchanged. Generated media and original fixtures only.

| Artifact | SHA-256 |
| --- | --- |
| `deploy/one_page_shino80_v0.0.9_z80_base_complete.html` | `065d9f01e3d10260539705399c76683eaafa550ddea4a45c3e6f31c24948636e` |
| `deploy/shino80_technical_manual_v0.1.html` | `0915b6495c9924ff1ee670e81a2c6551dfacfe1928153d784c1a24846d994314` |

One logical main-based commit includes the design/clarifications and implementation.
The old design commit was preserved locally as a backup before branch alignment.
No checkpoint PRs were created. Final PR handoff follows below; do not merge or
publish without Human GO. PHASE 5 is not started.

Resume from README; fetch live branch/PR/Issue comments, then read CURRENT,
LAST_RUN, NEXT_CHAT_PROMPT, MANIFEST and this worklog. Use the documented bundled
Node/pnpm/Playwright runtime without re-discovering PATH or constructing a manual
test loop. Physical iPhone/Edge QA remains unclaimed.

## Human Review handoff

- PR #64: https://github.com/ssnshino/shinoCPUEmulator/pull/64
- Base: reviewed main `830f6a30c9b2a22dbdef3b0e400ff863c14e6654`.
- Head: purpose branch; verify current SHA from PR (one logical commit).
- State: OPEN / Human Review pending. Not merged; not published.
- Next: Human reviews PR and optionally exercises the generated standalone HTML.
- Stop here. No PHASE 5 or publication work is authorized by this handoff.
