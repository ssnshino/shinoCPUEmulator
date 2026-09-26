# SHINO-80 CBIOS v0.1 PLAN

Date: 2026-09-26

Branch: `feature/shino80-cbios-v01-20260926`

Parent: Virtual Disk A v0.1 `128f031` / PR #31

## Purpose

Build an original, RAM-resident Z80 CBIOS candidate which exposes the standard
17-entry CP/M 2.2 BIOS jump vector and adapts console plus 128-byte disk calls
to SHINO-80 hardware. Prove its READ/WRITE path and a one-sector boot payload
without importing CP/M, a filesystem or third-party binaries.

## Source

The Digital Research CP/M 2.2 Alteration Guide defines a 17-JP entry table:
BOOT, WBOOT, CONST, CONIN, CONOUT, LIST, PUNCH, READER, HOME, SELDSK,
SETTRK, SETSEC, SETDMA, READ, WRITE, LISTST and SECTRAN. It also defines the
return conventions, 128-byte sector transfer and DPH/DPB structures used here.

Reference:
<https://www.bitsavers.org/pdf/digitalResearch/cpm/CPM_Operating_System_Manual_Jul82.pdf>

## Layout and behavior

- CBIOS origin: `FA00h`, leaving the RAM handoff trampoline at `F800h` clear.
- All code, DPH/DPB, directory buffer and allocation/check vectors fit below
  `10000h`.
- Disk A: uses Virtual Disk A ports `30h`–`36h` and exact 128-byte INIR/OTIR.
- DPH has no sector translation table; DPB is the declared 26-sector,
  1 KiB-block, 243-block, 64-directory-entry, two-reserved-track format.
- Keyboard input uses ports `20h`/`21h`.
- Console output is original RAM-only VRAM code; it never calls ROM BIOS.
- Unsupported LIST/PUNCH are harmless returns; READER returns Ctrl-Z.
- BOOT/WBOOT initialize CBIOS state and return in v0.1. They do not yet load
  CCP/BDOS or claim a bootable CP/M system.

## Changes

- Add a standalone CBIOS image builder under `src/firmware/shino80/`.
- Add exact jump-table, console, disk, DPH/DPB and original boot-sector tests.
- Include the source and facts in the Technical Manual and project documents.
- Keep the workbench runtime unchanged until a complete loader/media lifecycle
  is designed; this phase validates firmware against the real device module.

## Non-goals

- No CP/M CCP/BDOS source or binary, filesystem, formatter or system tracks.
- No production WBOOT loader, page-zero BDOS vector or CCP transfer.
- No MON command/UI media import/export, persistence or B: drive.
- No CPU, System ROM, memory mapper, CG-ROM, DM-80 or device protocol changes.
- No merge, deploy or third-party code import.

## Accuracy level

Instruction-level functional CBIOS/device integration. The jump-vector order,
register conventions, sector size and disk tables are exact for the declared
format. Device mechanics and pin/cycle timing remain outside scope.

## Regression risks

- wrong jump-vector slot or register convention
- CBIOS image/data crossing FFFFh
- incorrect DPH/DPB pointers or field endianness
- DMA off-by-one or wrong sector numbering
- ROM dependency after all-RAM handoff
- console code writing beyond Text VRAM

## QA

- assert all 17 JP slots and exported addresses
- inspect DPH/DPB exact bytes and pointers
- exercise CONST/CONIN/CONOUT with real Keyboard and VRAM
- read and write first/last disk sectors through CBIOS entry calls
- prove error return for invalid drive and write-protected media
- load an original sector-1 program to DMA and execute it in full RAM
- assert Bus I/O trace and no Boot/Extension ROM access after handoff
- rerun full package, deterministic builds, `git diff --check`

## Success criteria

- A Z80 caller uses the standard BIOS vector to read/write an exact sector.
- DPH/DPB describes the same medium implemented by Virtual Disk A.
- Console input/output works with no ROM call.
- An original sector payload loads and executes entirely through CBIOS.
- BOOT/WBOOT incompleteness is explicit; no CP/M boot claim is made.
