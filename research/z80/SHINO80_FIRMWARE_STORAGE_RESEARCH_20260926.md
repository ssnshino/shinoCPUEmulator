# SHINO-80 firmware storage research

2026-09-26T10:49:16+09:00

## Question

How did practical Z80 computers store IPL, Monitor and BIOS code, and which
pattern should SHINO-80 adopt now that its original 8 KiB SYSTEM ROM is full?

## Primary-source findings

### Small Computer Monitor / RC2014

Small Computer Monitor documents three useful stages:

- R1: Monitor in 0000h–1FFFh, never paged out.
- R2: Monitor plus BASIC in 0000h–3FFFh.
- R3: Monitor, BASIC and CP/M loader in 0000h–7FFFh; ROM is paged out and RAM
  becomes 0000h–FFFFh before CP/M runs.

Its ROM filing system can relocate command/application images to RAM. This is
the closest precedent for SHINO-80's current ROM-resident Monitor.

Source: <https://smallcomputercentral.com/wp-content/uploads/2018/05/scmon-v1-0-userguide-e1-0-0.pdf>

### CP/M 2.2

CP/M loads its machine-specific BIOS with the OS at the high end of RAM. In the
standard relocation model CCP starts at 3400h+b, BDOS at 3C00h+b and the BIOS
jump vector at 4A00h+b. Page zero contains the warm-boot and BDOS jumps. A boot
ROM therefore has to disappear or otherwise expose RAM at address zero.

Source: <https://bitsavers.org/pdf/digitalResearch/cpm/CPM_Operating_System_Manual_Jul82.pdf>

### RC2014 CP/M-IDE

The loader begins in pageable ROM. Before CP/M it pages ROM out, writes the RAM
Page 0 vectors, and transfers control to CCP. Warm boot may page ROM back in to
reload the operating-system image.

Sources:

- <https://github.com/RC2014Z80/RC2014/blob/master/ROMs/CPM-IDE/README.md>
- <https://github.com/RC2014Z80/RC2014/blob/master/ROMs/CPM-IDE/z80-pata-sio/cpm22bios.asm>

### MSX

MSX uses separate 64 KiB slot spaces divided into four 16 KiB pages. MAIN-ROM
holds BIOS entries and BASIC in the lower 32 KiB; MSX-DOS can map RAM across
the CPU address space. It is flexible but more complex than SHINO-80 presently
needs.

Source: <https://github.com/Konamiman/MSX2-Technical-Handbook/blob/master/md/Chapter1.md>

### RomWBW

RomWBW copies HBIOS from boot ROM into a dedicated RAM bank. A 512-byte proxy
at FE00h–FFFFh swaps the HBIOS bank in for calls and restores the caller bank.
This is a strong later-stage model when SHINO-80 needs many drivers and banks,
but is too large a first step for the current machine.

Sources:

- <https://wwarthen.github.io/RomWBW/SystemGuide/>
- <https://github.com/wwarthen/RomWBW/blob/master/Source/HBIOS/hbios.asm>

## Adopted direction

Implement an original SHINO-80 hybrid, not source compatibility with any one
machine:

```text
ROM-visible mode after RESET
0000–1FFF  fixed Boot / Recovery ROM (8 KiB)
2000–3FFF  selectable Extension ROM window (8 KiB bank)
4000–FFFF  RAM (VRAM and firmware work areas remain ordinary RAM)

Full-RAM mode
0000–FFFF  RAM
```

The physical machine has 64 KiB RAM under the lower ROM overlay. Memory control
selects visible ROM/RAM, optional shadow writes, and the extension bank. RESET
always restores Boot ROM plus extension bank 0. Current BIOS/MON code stays in
the fixed half; large disassembly tables move to extension bank 0. Later banks
may contain BASIC, assemblers, loaders or device diagnostics.

This phase supplies the memory architecture and preserves current user-visible
MON behavior. It does not yet implement CP/M, BASIC, a disk loader, a high-RAM
proxy, or arbitrary ROM files.

## Original-design boundary

Only architecture patterns and public interfaces were studied. No third-party
ROM, BIOS binary or proprietary source is included. SHINO-80 port assignments,
firmware, tests and generated artifacts remain original work.
