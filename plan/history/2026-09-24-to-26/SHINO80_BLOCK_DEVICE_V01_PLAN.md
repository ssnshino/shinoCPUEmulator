# SHINO-80 Virtual Block Device v0.1 PLAN

Date: 2026-09-26

Branch: `feature/shino80-block-device-v01-20260926`

Parent: RAM handoff v0.5 `a2a6430eddb7828e0a84dc2a301c7f59e6ed2038` / PR #30

## Purpose

Add one observable, deterministic A: block device which can transfer one
CP/M-sized 128-byte sector through the SHINO-80 I/O bus. This is the hardware
contract on which a later SHINO CBIOS can implement `SELDSK`, `SETTRK`,
`SETSEC`, `SETDMA`, `READ` and `WRITE`.

## Sources and rationale

- Digital Research, *CP/M 2.2 Alteration Guide* describes the BIOS disk
  boundary as selected drive, track, sector and DMA address followed by a
  128-byte `READ` or `WRITE` operation.
- Its standard single-density definition uses 26 sectors per track, sector
  numbers 1 through 26, 1 KiB allocation blocks, 243 blocks, 64 directory
  entries and two reserved tracks.
- CP/M media format is machine-specific; this device therefore declares its
  geometry explicitly instead of pretending to auto-detect a universal CP/M
  format.

Reference copies consulted:

- <https://www.bitsavers.org/pdf/digitalResearch/cpm/CPM_Operating_System_Manual_Jul82.pdf>
- <https://www.seasip.info/Cpm/bios.html>
- <https://www.seasip.info/Cpm/formats.html>

## Device contract

Drive A: has 77 tracks, 26 sectors per track and 128 bytes per sector. Image
size is exactly 256,256 bytes. Track is zero-based; sector is one-based.

Low-byte-decoded I/O ports:

| Port | Read | Write |
|---|---|---|
| `30h` | status | ignored |
| `31h` | last command | command |
| `32h` | drive | drive |
| `33h` | track | track |
| `34h` | sector | sector |
| `35h` | transfer data | transfer data |
| `36h` | error code | clear error when zero |

Commands are `01h READ`, `02h WRITE`, and `7Fh RESET/CANCEL`. A valid command
raises DRQ and exactly 128 CPU `IN` or `OUT` operations complete the transfer.
The first implementation completes command setup at the issuing instruction
boundary and models no rotation, seek, WAIT or DMA timing.

Status bits are READY bit 0, BUSY bit 1, DRQ bit 2, WRITE PROTECT bit 6 and
ERROR bit 7. BUSY remains clear in v0.1 because commands are synchronous.

Error codes are NONE 0, NO MEDIA 1, BAD DRIVE 2, BAD TRACK 3, BAD SECTOR 4,
WRITE PROTECTED 5 and PROTOCOL 6.

## Changes

- Add an independent block-device module under `src/devices/shino80/`.
- Connect a blank, writable A: image to the existing first-class I/O bus.
- Replace the reserved A: row with an online virtual disk and expose geometry,
  ports and transfer state in the existing Device inspector.
- Include the module in the standalone one-page build.
- Add unit, bus-integration, artifact and manual coverage.
- Update current spec, maps, manual, worklog and restart snapshots.

## Non-goals

- No CBIOS, BDOS, CCP, CP/M binary or BBC BASIC import.
- No host file picker, download/save workflow or durable browser persistence.
- No B: drive, FDC command compatibility, DMA, interrupt, seek or rotational
  timing.
- No changes to CPU core/decoder/flags, System ROM, CG-ROM or DM-80 rendering.
- No merge, release or public deployment.

## Accuracy level

Functional sector-device accuracy at the instruction-boundary I/O level.
Geometry and byte transfer are exact. Mechanical and cycle-level timing are
explicitly unimplemented.

## Regression risks

- I/O port overlap or high-byte decode mistakes.
- Debug inspection accidentally consuming DATA bytes.
- RESET or POWER unintentionally erasing mounted media.
- Partial writes becoming visible before all 128 bytes arrive.
- One-page build omitting or misordering the new module.
- Device Dock layout regressions on compact screens.

## QA

- Exact geometry and image-size validation.
- Read and write round trips at first and last legal sector.
- Every invalid-selection and write-protect error.
- Partial-write rollback, reset/media preservation and new-command cancel.
- Non-consuming debug peek and low-byte port aliases.
- Bus trace attribution for all device I/O.
- Existing package regression, deterministic one-page/manual builds and
  `git diff --check`.
- Offline desktop and mobile Chromium checks for Device Dock/Inspector,
  console errors, network requests and horizontal overflow.

## Success criteria

- A CPU can transfer exactly one 128-byte sector via ports `30h`-`36h`.
- The image remains unchanged until a complete WRITE transfer.
- Observer reads have no effect on transfer position or Bus trace.
- Reset clears controller state but preserves mounted media.
- A: geometry and live device state are visible in the workbench/manual.
- All regressions pass and the branch remains a single logical change.
