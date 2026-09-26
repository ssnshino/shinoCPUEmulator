# SHINO-80 pageable firmware v0.4 worklog

## Scope

Branch `feature/shino80-pageable-firmware-v04-20260926`, parent `d3f223e`.
Replace the exhausted flat 8 KiB firmware model with a tested 16 KiB pageable
overlay. No CPU semantic, CG-ROM or display-rendering change.

## Research and decisions

Reviewed primary material for Small Computer Monitor/RC2014, CP/M, MSX and
RomWBW. Adopted a deliberately smaller SHINO-80 design: fixed 8 KiB recovery
ROM, banked 8 KiB extension window and 64 KiB RAM underlay. See
`research/z80/SHINO80_FIRMWARE_STORAGE_RESEARCH_20260926.md`.

## Implementation

- added `Shino80Memory` with ROM overlay, RAM underlay, bank/reset/control-port
  behavior and separate visible/physical debug views
- integrated the optional mapper with `Shino80Bus` while preserving its flat
  path for isolated CPU/reference tests
- expanded firmware to 16 KiB and moved compact disassembler tables to 2000h
- wired mapper into the workbench, one-page build, Memory/Device inspectors,
  reset/power behavior and built-in self-test
- adapted actual-machine tests to use visible ROM plus RAM starting at 4000h
- added exact v0.4 mapping, trace, bank, shadow and boot tests
- updated firmware and Technical Manual source documentation

## Verification

All package stages pass: PHASE1A–1J, PHASE2A/2A.1, BIOS/MON, keyboard, pageable
firmware, execution pace, trace, source syntax, one-page build/artifact and
Technical Manual deterministic build. One-page artifact: 179,119 bytes;
Technical Manual: 1,992,442 bytes / 1,780 encodings.

Because the Browser plugin was unavailable, installed Google Chrome was driven
with the bundled Playwright without adding dependencies. Desktop 1440×1000 and
mobile 390×844 both passed: correct page identity/self-test, power-on, U0100 and
R input, Memory Inspector BOOT ROM at 0000h and EXT ROM BANK 0 at 2000h,
64 KiB/mapping/control inspector text, no console errors or warnings, no network
requests and no horizontal document overflow. The Technical Manual map passed
the same two viewports and contained the v0.4 control/mapping contract.

Visual screenshots were inspected: desktop and mobile Memory views are legible;
the manual uses its intentional horizontally scrollable table wrapper on mobile.
`git diff --check` passes and the CPU core/decoder/flags, CG-ROM and display CSS
have no diff.

## Boundaries

Page-out is immediate and no loader is supplied. Only Extension bank 0 is
installed. Debugger underlay writes are intentionally different from CPU-visible
reads. No merge, public deployment, BASIC, CP/M or FDD work is part of v0.4.
