# SHINO-80 System Disk / Loader v0.1

Date: 2026-09-26

Status: implementation candidate

Branch: `feature/shino80-system-disk-loader-v01-20260926`

## Purpose

This phase turns the previously separate Virtual Disk A, RAM handoff and CBIOS
components into one CPU-executed boot chain. The distributed one-page machine
mounts an original SHINO-80 system image. At the ROM Monitor prompt, `O` reads
that image through the public block-device ports and enters loaded RAM code.

```text
MON O -> A: sectors -> 8000h payload + FA00h CBIOS
      -> page zero JP FA03h -> full-RAM mode -> CBIOS console -> HALT
```

No browser-side shortcut copies the payload or CBIOS into RAM.

## S80B v1 image

The medium retains the Virtual Disk A geometry: 77 tracks, 26 sectors per
track, 128 bytes per sector. Track 0 contains:

| Sector | Content | Destination |
|---:|---|---:|
| 1 | `S80B` v1 header | loader scratch E300h |
| 2 | original SHINO payload | 8000h |
| 3–7 | CBIOS image and E5h padding | FA00h–FC7Fh |

The 17-byte header records magic, version, sector layout, entry/origin and
payload lengths plus an 8-bit header sum. The loader validates the fixed
layout before changing page zero or the memory map.

## Loader behavior

`O` accepts no arguments. It programs DRIVE/TRACK/SECTOR/COMMAND at ports
32h–34h/31h, verifies ERROR/DRQ and reads each sector with `INIR` through DATA
35h. A successful boot therefore performs seven READ commands and 896 CPU I/O
reads. Only after all seven sectors succeed does it shadow-write `JP FA03h` at
0000h and call the existing RAM_HANDOFF service for 8000h.

On missing media, malformed header or I/O failure it prints `DISK BOOT ERROR`,
leaves ROM visible and returns to MON. RESET always restores ROM visibility and
MON while keeping the mounted system medium.

## Loaded payload

The original payload calls CBIOS BOOT, prints:

```text
SHINO-80 SYSTEM DISK
CBIOS + BLOCK I/O OK
```

through CBIOS CONOUT, writes `DSK!` at E260h and executes HALT. This makes the
result attributable to Z80 code loaded over the block interface, not the UI.

## Boundary

This is a system-loader proof, not CP/M. It contains no CCP, BDOS, filesystem,
directory or third-party binary. CBIOS BOOT/WBOOT still initialize and return;
0005h is not a BDOS vector. Mechanical FDC timing, DMA, interrupts, host-file
persistence and B: remain outside v0.1.

The next OS phase may use this verified original chain as its control. Any
CP/M-family import remains subject to the recorded license audit gate.
