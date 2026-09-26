# SHINO-80 RAM handoff v0.5

2026-09-26 · candidate on pageable firmware v0.4 `9fd087b`

## Purpose

Define and prove the irreversible transition from RESET-visible firmware to an
all-RAM machine. This is the boot boundary required before adding virtual disk,
a SHINO-80 CP/M CBIOS and an openly redistributable BASIC.

## BIOS API

`BIOS_API_RAM_HANDOFF` is the stable jump-table entry at 011Eh.

Input:

- `HL`: entry point, 4000h–FFFFh
- `A`: memory-control value with bit 0 `LOW_RAM` set
- the caller has already loaded its image and prepared lower RAM/page zero

Behavior:

1. Reject an entry below 4000h or a control value without LOW_RAM and return
   with carry clear.
2. Copy `OUT (00h),A / JP (HL)` to reserved scratch F800h–F802h.
3. Transfer control to F800h.
4. Page firmware out immediately and fetch `JP (HL)` from physical RAM.
5. Continue at the caller's entry point. Success never returns.

F800h–F802h is a transient boot reservation. A future OS image/CBIOS linker
must not place persistent bytes there until after handoff completes. RESET is
the recovery path and restores the v0.4 ROM-visible bank-0 map.

## Monitor B proof

`B` accepts no arguments. It is an original built-in diagnostic, not CP/M.

- copies a small payload from Extension ROM to RAM at 8000h
- enables SHADOW_WRITE and writes `JP 8000h` to physical page zero
- invokes the same RAM_HANDOFF API with LOW_RAM
- clears VRAM and writes `SHINO-80 RAM BOOT` / `ALL 64K RAM ONLINE` directly
- writes ASCII signature `R80!` at E180h
- HALTs without calling ROM BIOS

The UI Reset control resets the mapper and CPU, after which the ordinary ROM
IPL/MON boots again. Power cycling additionally clears physical RAM according
to the existing machine contract.

## Accuracy and boundaries

Tests verify CPU instructions, mapper state and Bus trace, including that the
first opcode fetch after the page-out I/O write is the RAM copy of `JP (HL)` at
F802h and that no later read is attributed to Boot or Extension ROM.

This remains instruction/M-cycle-abstract emulation, not electrical bus timing.
There is no disk, filesystem, CBIOS, warm boot, executable format, CP/M or BASIC
in v0.5. The demo payload is original and contains no third-party code.

## Adopted continuation

1. specify a virtual block device and disk image geometry
2. implement deterministic sector read/write and Bus-visible device timing
3. write a SHINO-80 CBIOS using keyboard, DM-80 and that block device
4. build and boot a license-audited CP/M-family image
5. add Z80 BBC BASIC as a CP/M program with its license and provenance

