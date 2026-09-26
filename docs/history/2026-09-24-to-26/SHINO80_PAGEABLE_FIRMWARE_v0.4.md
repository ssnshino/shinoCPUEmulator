# SHINO-80 pageable firmware v0.4

2026-09-26 · candidate on `d3f223e`

## Purpose

SHINO-80 now has a firmware layout that can retain a recovery Monitor while
leaving a path to BASIC, disk boot and operating systems. This is an original
SHINO-80 design informed by public Z80 system documentation; it does not embed
or claim compatibility with third-party ROMs.

## Physical and visible memory

The machine contains 64 KiB physical RAM at 0000h–FFFFh. Firmware is a 16 KiB
image split into two 8 KiB regions.

| CPU address | RESET / ROM-visible mode | Full-RAM mode |
| --- | --- | --- |
| 0000h–1FFFh | fixed Boot / Recovery ROM | RAM underlay |
| 2000h–3FFFh | selectable Extension ROM bank | RAM underlay |
| 4000h–FFFFh | RAM | RAM |

Bank 0 contains the current BIOS/MON disassembler tables. Executable IPL,
BIOS and Monitor code remains in the fixed half. VRAM C000h–C7CFh, BIOS work
areas and stack remain ordinary physical RAM.

## Memory-control port 00h

The device decodes the low 8 bits of the I/O address, like other SHINO-80
devices. Thus 0000h and AB00h select the same device.

| Bits | Name | Meaning |
| --- | --- | --- |
| 0 | LOW_RAM | 0: ROM overlay visible; 1: RAM visible at 0000h–3FFFh |
| 1 | SHADOW_WRITE | while ROM is visible, write to lower RAM underlay |
| 2–3 | reserved | ignored on write and read as zero |
| 4–7 | EXT_BANK | selects the 8 KiB Extension ROM bank |

RESET restores control 00h: fixed ROM and Extension bank 0 visible, shadow
writes disabled. Only bank 0 is installed in v0.4. Reads from an uninstalled
selected bank return FFh.

Mapping changes are immediate. Code that sets LOW_RAM must execute its OUT
instruction from RAM at 4000h or above and continue from RAM. This version
provides the mechanism and tests but no OS loader command.

## Read, write and debug semantics

- CPU reads follow the visible map.
- CPU writes to visible ROM are blocked by default.
- With SHADOW_WRITE set, a CPU write updates RAM under the ROM while ROM remains
  visible to reads.
- With LOW_RAM set, CPU reads and writes use RAM throughout 0000h–FFFFh.
- `debugPeek` observes what the CPU can currently read.
- `debugPeekRam` and debugger writes address physical RAM underlay directly.
- power clearing clears RAM but not firmware; machine reset restores the
  control register without destroying RAM.
- Bus trace entries identify `BOOT_ROM`, `EXTENSION_ROM`, `RAM`, blocked ROM
  writes and shadow writes.

## Compatibility and boundaries

BIOS/MON v0.3 behavior, jump-table addresses, video, keyboard, CG-ROM and CPU
instruction semantics are unchanged. The generated one-page artifact includes
the controller before the Bus and remains offline/self-contained.

Not included: BASIC, CP/M, FDD/FDC, ROM filesystem, application loader,
high-RAM BIOS proxy, extra extension-bank images, new MON commands, GO/BREAK,
or electrical/pin-cycle memory timing.

## Future use

- bank 0 remains firmware support data.
- future banks may hold original BASIC, assembler, loader or diagnostics.
- an OS loader may use SHADOW_WRITE to prepare page zero, execute from high RAM,
  set LOW_RAM, and transfer control into the all-RAM image.
- disk interfaces and warm-boot policy require their own versioned design.

