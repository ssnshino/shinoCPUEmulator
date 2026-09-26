# SHINO-80 System Disk / Loader v0.1 PLAN

Date: 2026-09-26

Branch: `feature/shino80-system-disk-loader-v01-20260926`

Parent: SHINO CBIOS v0.1 `4116919` / PR #32

## Purpose

Complete the visible boot chain with only original project code:

```text
ROM MON O -> Virtual Disk A -> multi-sector RAM load
           -> page-zero warm-boot vector -> ROM page-out
           -> original system payload -> SHINO CBIOS console
```

This proves the loader/media lifecycle needed before any licensed CP/M system
image is considered.

## Disk layout

Track 0 sectors are reserved system sectors in the existing 77×26×128 medium.

| Sector | Content | RAM destination |
|---:|---|---:|
| 1 | `S80B` v1 boot header | loader scratch E300h |
| 2 | original system payload | 8000h |
| 3–7 | SHINO CBIOS v0.1 image, padded | FA00h–FC7Fh |

The payload initializes CBIOS, prints a two-line success banner through CBIOS
CONOUT, writes `DSK!` at E260h and HALTs. No browser code prints the banner.

## ROM loader

Add MON `O` (OS/DISK BOOT), requiring no arguments. It:

1. reads and validates the sector-1 magic/version/layout;
2. reads sector 2 and sectors 3–7 through ports 30h–36h;
3. enables shadow writes and installs `JP FA03h` at page zero;
4. invokes the existing RAM_HANDOFF API with entry 8000h;
5. never returns on success; prints `DISK BOOT ERROR` and returns to MON on
   device/header failure.

## Changes

- Add deterministic original system-disk image builder.
- Add the builder to the standalone one-page runtime and mount that image as A:.
- Extend System ROM Monitor help/parser and add the PIO cold loader.
- Surface inserted-media identity in the Device inspector.
- Add exact image/header, failure, success, Bus and reset-recovery tests.
- Update one-page artifact, manual, specs, worklog and snapshots.

## Non-goals

- No CP/M CCP/BDOS, filesystem, directory, transient program or BASIC.
- No final CP/M cold loader, WBOOT reload loop or BDOS vector at 0005h.
- No host file picker/export/persistence, B: drive, FDC timing or DMA.
- No CPU core/decoder/flags, mapper, block protocol, CG-ROM or DM-80 changes.
- No merge or public deployment.

## Accuracy level

Instruction-level boot-chain accuracy with Bus-visible PIO bytes and exact RAM
destinations. Mechanical/cycle timing remains unimplemented.

## Regression risks

- Extension ROM space overlap or changed legacy label addresses
- partial sector/load failure corrupting page zero
- CBIOS padding overwriting the handoff trampoline before it executes
- loader sector/destination off-by-one
- default disk construction bloating the standalone artifact unnecessarily
- MON help/parser compatibility and mobile Device Dock regression

## QA

- exact `S80B` header, segment bytes, CBIOS bytes and E5 padding
- MON O error with no media/corrupt header and ROM map preserved
- MON O success banner/signature/page-zero/full-RAM state
- exact seven sector reads and 7×128 DATA port reads
- first post-pageout fetch and no later ROM reads
- RESET recovery to ROM MON while system disk remains mounted
- all package stages and deterministic artifact/manual generation
- offline Chrome desktop/mobile: type O through Keyboard, inspect display,
  memory/page zero and A:; console/network/overflow checks

## Success criteria

- The distributed one-page HTML boots its mounted original system disk via MON O.
- All executable boot content reaches RAM through Virtual Disk A CPU I/O.
- Success output is produced by loaded Z80 payload through loaded CBIOS.
- RESET recovers ROM MON without ejecting A:.
- Boundaries plainly state that this is not CP/M.
