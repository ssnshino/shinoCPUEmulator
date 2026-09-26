# SHINO-80 pageable firmware v0.4 plan

2026-09-26T10:49:16+09:00  
Branch `feature/shino80-pageable-firmware-v04-20260926`  
Parent `d3f223e` / BIOS-MON v0.3 PR #28.

## Goal

Replace the exhausted flat 8 KiB ROM model with a bounded, observable firmware
overlay that preserves the current machine after RESET and provides a credible
path to BASIC, disk loaders and full-64-KiB operating systems.

## Research basis

See `research/z80/SHINO80_FIRMWARE_STORAGE_RESEARCH_20260926.md`. Adopt useful
patterns from Small Computer Monitor/RC2014, CP/M, MSX and RomWBW without
copying their code or making SHINO-80 compatible with their proprietary ROMs.

## Target architecture

- physical RAM: 64 KiB
- fixed Boot/Recovery ROM: 8 KiB at 0000h–1FFFh when ROM is visible
- extension ROM window: 8 KiB at 2000h–3FFFh, bank 0 in this phase
- firmware image: 16 KiB, split into fixed and extension halves
- reset mode: fixed ROM + extension bank 0 visible
- full-RAM mode: 0000h–FFFFh RAM visible
- memory-control I/O: low port 00h
  - bit0 `LOW_RAM`: 0 ROM overlay, 1 lower 16 KiB RAM
  - bit1 `SHADOW_WRITE`: permit CPU writes to underlying lower RAM while ROM is visible
  - bits4–7 `EXT_BANK`: select extension ROM bank, reads as written
  - bits2–3 reserved and read zero
- RESET restores control 00h

## Implementation scope

- add SHINO-80-specific memory/ROM controller with boot ROM, extension banks,
  RAM underlay, reset and low-byte I/O decode
- let Shino80Bus delegate memory access to an optional memory device while
  retaining the legacy flat-memory path for isolated CPU tests
- make Bus events identify ROM, extension ROM, ordinary RAM and shadow writes
- expand SYSTEM ROM builder to 16 KiB; move disassembler tables into 2000h+
- update workbench machine construction, self-test, build order and Memory view
- update Technical Manual system diagram/map/sources and standalone artifacts
- add exact mapper, reset, bank, shadow-write, page-out and integration tests
- update project spec/worklog/restart documentation

## Non-goals

- no CP/M, BASIC, disk/FDD, ROM filesystem or application loader
- no high-RAM HBIOS proxy and no executable extension-bank switching UI
- no new Monitor commands, memory/register editing, GO or BREAK/NMI behavior
- no CPU core/decoder/flags semantics, CG-ROM or display rendering changes
- no third-party ROM image or source-code import
- no main merge or public deployment

## Accuracy and risks

This is machine memory-map accuracy, not pin-cycle electrical emulation. Main
risks are executing through a page-out boundary, debugger confusion between
visible ROM and underlying RAM, reset failing to restore boot mapping, old tests
assuming shared ROM/RAM storage, and generated one-page script order.

The control port uses low-byte decode like other SHINO-80 devices. Page-out is
immediate: software must execute the OUT instruction from RAM outside the lower
16 KiB and continue in RAM. This phase documents but does not provide that OS
loader. Shadow writes are blocked unless bit1 is explicitly enabled.

## Verification

- device unit tests for reset, mapping, extension banks, low-byte port aliases,
  blocked writes, shadow writes, debug views and full-RAM mode
- Bus trace assertions for source and write operation metadata
- existing IPL, BIOS/MON v0.3, CPU, keyboard, pacing and trace regressions
- deterministic emulator and Technical Manual builds plus artifact tests
- installed Chrome desktop/mobile smoke for boot, U and R commands; inspect the
  Memory view at 0000h and 2000h and ensure no errors/network/overflow
- `git diff --check`, explicit CPU/CG-ROM/UI-rendering non-target diff review

## Success

After reset, current SHINO-80 boots and MON behaves identically. The visible
lower map is fixed ROM plus extension bank 0; ROM writes are blocked by default.
Tests prove shadow loading and full-RAM page-out without corrupting ROM. The
manual clearly distinguishes physical RAM, visible mapping and future loaders.
One logical commit and stacked PR are produced; merge remains Human-controlled.

## Completion — 2026-09-26

Implementation and documentation are complete on the purpose branch. Every
package stage passed, including all CPU phases, video/IPL, BIOS/MON, keyboard,
pageable-memory, pacing, trace, artifact and Technical Manual checks. Offline
installed Chrome passed at 1440×1000 and 390×844: boot, U/R input, visible Boot
ROM and Extension bank 0 inspection, zero console warnings/errors, zero network
requests and zero document overflow. Commit/push/stacked PR remain the final
delivery steps; merge is not authorized.
