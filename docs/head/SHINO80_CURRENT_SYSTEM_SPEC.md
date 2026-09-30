# SHINO-80 Current Integrated System Specification

Status: CURRENT INTEGRATION BASELINE
Updated: 2026-09-30 JST
Latest reviewed storage implementation: Issue #59 / PR #60 / merge `682a9196f3726ad49d745b8373c22ffab5366cc3`
Current main after demo software disk PR #61: `e48dd446a2c2f6d54f81ce19965598f73f7cb79e`
Normative PHASE 3 spec: `docs/head/SHINO80_PHASE3_MULTI_PROFILE_FDD_SPEC_v1.md`

Live Git state wins over recorded SHAs. This document describes the reviewed PHASE 3 machine and records PHASE 4 as the active compatibility/foreign-media candidate. PHASE 4 must not change the reviewed native runtime contract.

## Purpose

This is the concise current-system specification for ordinary restart and future
planning. Completed incremental phase specifications and superseded plans are
preserved under history trees; they describe how the machine arrived here.

## Distribution

- authoring source: `src/`
- build scripts: `scripts/build-one-page.cjs`, `scripts/build-technical-manual.cjs`
- standalone machine: `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
- standalone manual: `deploy/shino80_technical_manual_v0.1.html`
- runtime dependency: none before the user explicitly follows an external link

The machine filename is retained for compatibility and does not limit the
current feature set to the historical BASE-complete milestone.

## CPU

- Z80 instruction families: BASE, CB, ED, DD, FD, DDCB, FDCB
- documented and implemented undocumented flag behavior
- internal accuracy state: WZ, P, Q
- NMI and INT IM 0/1/2 at instruction boundaries
- EI delay and HALT return behavior implemented
- pinned external full-state baseline: `1,604,000 / 1,604,000 PASS`
- instruction-level accuracy; not electrical or pin-cycle-perfect

## Memory and firmware

- physical RAM: 64 KiB
- RESET-visible firmware overlay: Boot/Recovery ROM 0000h–1FFFh plus Extension ROM 2000h–3FFFh
- memory-control port: low I/O 00h
- VRAM: C000h–C7CFh, 2,000 text cells
- ROM Monitor: help, clear, dump, registers, disassembly, RAM boot proof and system-disk boot
- RAM handoff trampoline: F800h–F802h
- CP/M shared directory scratch buffer: FD00h–FD7Fh

## Display and input

- DM-80 text display: 80 columns × 25 rows
- logical raster: 640 × 400
- native CG-ROM: 256 glyphs × 16 bytes = 4 KiB
- keyboard controller: byte FIFO exposed through Bus-visible I/O
- CBIOS console: CR, LF, Backspace, Delete, BEL and 80×25 scroll
- mobile keyboard mode keeps the DM-80 visible above the OS keyboard

## Mass storage controller

SHINO-80 uses **one block controller with two removable-media slots**.

Shared low I/O:

- 30h STATUS
- 31h COMMAND
- 32h DRIVE selector: 0=A:, 1=B:
- 33h TRACK
- 34h SECTOR
- 35h DATA
- 36h ERROR
- 37h HEAD
- 38h MEDIA_PROFILE (read-only)

Each slot independently accepts CLASSIC, 2HD-JP, 2DD-720, 2HD-AT-1200 or
2HD-1440 raw media. Geometry and physical transfer size come from the mounted
profile; transfers are exactly 128, 512 or 1,024 bytes.

Controller selection/transfer state is shared; media bytes and write-protect
state are independent per drive. Controller reset returns selection to A: but
does not discard either medium.

## CP/M drive roles

### A: — BOOT / SYSTEM / TOOLS

- deterministic S80B v2 system medium
- SHINO loader, CBIOS, licensed CP/M 2.2 CCP/BDOS
- bundled WELCOME.TXT, HELLO.COM, S80INFO.COM
- the **only** ROM autoboot / `MON O` source

### B: — USER / WORK / INTERCHANGE

- blank writable CLASSIC work medium at page construction
- E5h-initialized CP/M data medium
- no S80B header, loader, CBIOS or operating-system payload
- never probed as a boot source in PHASE 1

CP/M can switch normally with `A>B:` and `B>A:`. A and B have independent
filesystems.

## CBIOS / WBOOT

- RAM-resident original SHINO CBIOS with the standard CP/M 2.2 17-entry order
- CBIOS size: 657 bytes inside the unchanged six-sector / 768-byte S80B v2 reservation
- DPH_A and DPH_B are distinct 16-byte DPHs
- A/B share one DPB because their media geometry is identical
- A/B share DIRBUF FD00h–FD7Fh
- A/B CSV and ALV storage are independent
- SELDSK: C=0 -> A, C=1 -> B, C>=2 -> unsupported
- READ/WRITE continue through CPU -> Bus -> block controller

CP/M WBOOT always reloads the system from A: but preserves Page Zero 0004h so a
warm boot initiated while B: is current returns to `B>`.

ROM cold/autoboot paths explicitly initialize Page Zero 0004h to A:. Therefore:

- POWER / UI RESET / `MON O` -> `A>`
- CP/M WBOOT from B: -> `B>`

## Removable-media lifecycle

Both A and B have independent page-local host shelves.

While POWER is OFF:

- EJECT the target drive
- retain the exact ejected bytes
- INSERT EJECTED DISK back into the same drive

While POWER is ON, replacement controls are disabled and handler-guarded.

Media survives POWER, RESET and WBOOT inside the page. Browser reload
persistence and factory-media restore are not implemented.

## Whole-disk host interchange — PHASE 3 candidate

While POWER is OFF, each A/B canonical medium can be exported as a raw `.s80d`
file from either INSERTED or EJECTED state. Export uses a
defensive copy and changes neither ownership nor guest/controller/Bus state.

IMPORT reads the entire file and maps the five exact native byte lengths to one
unambiguous profile. A valid file becomes a single global pending transaction;
existing media is not changed until explicit `CONFIRM IMPORT`. Confirmation
rechecks POWER OFF, target drive, byte length and the expected INSERTED / EJECTED
/ EMPTY ownership state. Invalid size, read failure, CANCEL, ownership change
and POWER ON are atomic no-ops. POWER ON immediately discards pending state.
While pending, the target drive's EJECT / REINSERT actions are disabled in the
UI and rejected by their handlers; the other drive remains independently usable.

INSERTED replacement stays INSERTED. EJECTED shelf replacement stays EJECTED.
Only a genuinely empty drive mounts an imported image directly. A: import does
not inspect or repair bootability; an unbootable image reaches ROM MON on the
next boot. B: remains unable to autoboot.

If A: is absent or invalid, ROM falls back to MON before page-out even when B:
contains valid-looking data. B: is not a boot source.

## PHASE 3 frozen contract and Checkpoints A/B

Issue #59 has a repository-complete implementation contract in
`docs/head/SHINO80_PHASE3_MULTI_PROFILE_FDD_SPEC_v1.md`.

Frozen native profiles:

- 00h CLASSIC — 77/1/26/128
- 01h 2HD-JP — 77/2/8/1024
- 02h 2DD-720 — 80/2/9/512
- 03h 2HD-AT-1200 — 80/2/15/512
- 04h 2HD-1440 — 80/2/18/512

The frozen contract defines all five DPBs, 30h–38h controller semantics and
error codes, the exact S80B v3 64-byte header, the exact E800h–FD7Fh high-RAM
map, host raw `.s80d` profile UX, and profile-aware SELDSK / blocking / RMW /
WBOOT behavior.

CLASSIC S80B v2 and CLASSIC 30h–36h behavior remain unchanged. A: stays the
only autoboot source; B: never autoboots. The Checkpoint A profile model and
contract fixtures are implemented and passing. Checkpoint B activates native
profiles independently on A:/B:, HEAD 37h, read-only MEDIA_PROFILE 38h,
profile-derived CHS offsets, and exact 128/512/1024-byte physical transfers.
Checkpoint C implements profile-aware SELDSK, five DPBs, logical-to-physical
mapping and safe immediate RMW. Checkpoint D implements the exact S80B v3
2HD-JP image and ROM v2/v3 boot paths while retaining S80B v2. Checkpoint E
implements profile-preserving host shelves, all-profile IMPORT/EXPORT and the
geometry/CHS Inspector.

## CP/M environment

- CCP 9400h
- BDOS 9C00h, public entry 9C06h
- TPA 0100h–93FFh
- resident CCP commands: DIR, TYPE, ERA, REN, SAVE, USER
- writable CP/M directory/extents on both drives
- A starter files are original SHINO-80 repository work

The CP/M CCP/BDOS redistribution permission, upstream origin, patches and hashes
remain under `third_party/cpm22/`.

## Devices and observers

- one-bit beeper: low I/O 40h
- Debugger/Inspector uses observer APIs and must not become an execution path
- Bus trace uses bounded storage
- host media controls do not fabricate guest Bus events
- mechanical FDC timing, UART, printer and physical display ports remain future work

## Verification

Issue #54 / PR #55 reviewed evidence includes:

- one controller / two independent media slots
- A/B CBIOS SELDSK and Bus-visible READ/WRITE
- B filesystem create/read and A/B isolation
- B WBOOT -> B>
- actual UI RESET -> ROM autoboot -> A>
- B file survival across UI RESET and EJECT/REINSERT
- A absent + B inserted -> MON fallback
- compact 390×844, desktop 1280×900, compact-height 900×400
- `pnpm test`, `pnpm run test:browser`, `git diff --check` PASS

## PHASE 4 active candidate

Issue #63 implements a host-side Foreign Media Bridge and an explicit CP/M 2.2 compatibility gate on the purpose branch. This is an unmerged review candidate, not a new reviewed main baseline.

D88 / FDI / DCP/DCU are parsed read-only into a normalized sector model. Exact foreign CP/M descriptors F000 IBM3740-CPM22 and F001 SINCLAIR-PLUS3-CPM22-720 may reconstruct files. Selected files are repacked into a fresh existing SHINO native medium and then may enter the existing native IMPORT transaction.

Normative contract:
`docs/head/SHINO80_PHASE4_CPM_COMPAT_FOREIGN_MEDIA_SPEC_v1.md`

Acceptance:
`docs/head/SHINO80_PHASE4_QA_ACCEPTANCE_v1.md`

No foreign profile is added to port 38h; no foreign system boot or direct foreign A:/B: mount is part of PHASE 4.

The I/O device list contains FOREIGN MEDIA BRIDGE. Structural detection is independent of extension. A compatible-descriptor list is advisory: even a sole F000/F001 candidate requires explicit selection and complete sector validation. Files are grouped by USER/name, raw record bytes retain trailing 1Ah, and malformed/crosslinked/gapped structures reject conversion. DCP/DCU uses the frozen 162-byte header and terminal-sentinel/full-versus-sparse contract.

Capacity preflight reports records, logical extents, physical directory entries and allocation blocks. Native packing honors EXM grouping and USER/name uniqueness. BUILD produces a fresh nonbootable data disk; DOWNLOAD and pending SEND do not mutate guest drives or emit Bus events. SEND requires POWER OFF and no active native import, and reuses the existing CONFIRM/CANCEL ownership guard.

## Next storage phase

PHASE 4 is active. After Human-reviewed completion, PHASE 5 remains the disk-subsystem completion phase.

## Change rule

Generated deploy HTML is never the authoring source. One environment / one
writer / one purpose branch. Human review controls merge and publication.

## Update History

- 2026-09-30T14:42:19+09:00 — Codex — PHASE 4 candidate implementation and host-only boundaries documented; reviewed main remains unchanged.
