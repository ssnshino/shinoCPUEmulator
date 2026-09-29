# SHINO-80 Current Integrated System Specification

Status: CURRENT INTEGRATION BASELINE
Updated: 2026-09-29 JST
Latest reviewed storage implementation: Issue #54 / PR #55 / main `ff04df719e19d517faeea26e09cfbc912bb2cd18`
Active candidate: Issue #56 / PHASE 2 Whole Disk IMPORT + EXPORT

Live Git state wins over recorded SHAs. This document describes the reviewed
PHASE 1 reviewed machine plus the Issue #56 candidate behavior on its purpose branch.

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

SHINO-80 PHASE 1 uses **one block controller with two removable-media slots**.

Shared low I/O:

- 30h STATUS
- 31h COMMAND
- 32h DRIVE selector: 0=A:, 1=B:
- 33h TRACK
- 34h SECTOR
- 35h DATA
- 36h ERROR

Both media currently use CLASSIC geometry:

- 77 tracks
- 26 sectors/track
- 128 bytes/sector
- 256,256 bytes total

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

## Whole-disk host interchange — PHASE 2 candidate

While POWER is OFF, each A/B canonical medium can be exported as a raw
256,256-byte `.s80d` file from either INSERTED or EJECTED state. Export uses a
defensive copy and changes neither ownership nor guest/controller/Bus state.

IMPORT reads the entire file and accepts it only when its byte length is
exactly 256,256. A valid file becomes a single global pending transaction;
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

## Next storage phase

Issue #56 implements PHASE 2 as the current Human-review candidate. After
merge, the next bounded design phase is PHASE 3 practical WORK media / multi-profile.

## Change rule

Generated deploy HTML is never the authoring source. One environment / one
writer / one purpose branch. Human review controls merge and publication.
