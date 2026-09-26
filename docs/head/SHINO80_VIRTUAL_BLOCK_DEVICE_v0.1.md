# SHINO-80 Virtual Block Device v0.1

Date: 2026-09-26

Status: implementation candidate

Branch: `feature/shino80-block-device-v01-20260926`

## Role

Virtual Disk A is the first SHINO-80 mass-storage device. It is a small PIO
block-device contract, not an emulation of a named floppy-controller chip.
Every byte transferred by the CPU passes through the existing I/O Bus and is
therefore visible in Bus trace.

This boundary intentionally matches what a later CP/M 2.2 CBIOS needs: choose
a drive, track and 128-byte sector, then transfer one record. CBIOS `SETDMA`
will remain a firmware concern; it can loop over DATA with Z80 `IN`/`OUT`
instructions instead of granting the device hidden access to RAM.

## Geometry

| Property | Value |
|---|---:|
| Drives implemented | A: only, drive 0 |
| Tracks | 77, numbered 0–76 |
| Sectors per track | 26, numbered 1–26 |
| Bytes per sector | 128 |
| Image bytes | 256,256 |
| Default blank byte | E5h |

The geometry follows the standard single-density example in the Digital
Research CP/M 2.2 Alteration Guide. CP/M disk formats are otherwise
machine-specific; v0.1 does not claim automatic compatibility with arbitrary
`.dsk` files.

The later CBIOS target parameters are recorded, but not implemented here:

```text
SPT 26, BSH 3, BLM 7, EXM 0, DSM 242, DRM 63,
AL0 C0h, AL1 00h, CKS 16, OFF 2
```

That corresponds to 1 KiB allocation blocks, 243 data blocks, 64 directory
entries and two reserved system tracks.

## I/O registers

All registers decode the low eight bits of the Z80's 16-bit I/O address. The
Bus still records the full address.

| Low port | Register | Read | Write |
|---|---|---|---|
| 30h | STATUS | status bits | ignored |
| 31h | COMMAND | last command | issue command |
| 32h | DRIVE | selected drive | select drive |
| 33h | TRACK | selected track | select track |
| 34h | SECTOR | selected sector | select sector |
| 35h | DATA | next READ byte | next WRITE byte |
| 36h | ERROR | error code | zero clears error |

### Commands

| Value | Operation |
|---:|---|
| 01h | READ selected sector |
| 02h | WRITE selected sector |
| 7Fh | cancel current transfer and clear error |

### Status

| Bit | Name | v0.1 meaning |
|---:|---|---|
| 0 | READY | medium mounted |
| 1 | BUSY | reserved; always clear |
| 2 | DRQ | exactly one 128-byte transfer is active |
| 6 | WRITE PROTECT | mounted medium is read-only |
| 7 | ERROR | ERROR register is nonzero |

### Errors

| Value | Meaning |
|---:|---|
| 0 | none |
| 1 | no media |
| 2 | bad drive |
| 3 | bad track |
| 4 | bad sector |
| 5 | write protected |
| 6 | protocol error |

## Transfer semantics

READ snapshots the selected sector into an internal 128-byte buffer. Each CPU
read of DATA returns and consumes one byte; after byte 128 DRQ clears.

WRITE collects exactly 128 DATA writes in an internal buffer. The image is
updated atomically only after byte 128. Controller reset, a new selection or a
new command cancels an incomplete transfer without changing the medium.

`debugPeekPort(DATA)` sees the next READ byte without consuming it and creates
no Bus event. This preserves the project rule that the debugger is an observer.

The device clones images on mount and export so host code cannot mutate a
mounted medium through a retained array reference. Controller RESET and
machine POWER preserve the mounted medium and write-protect state; eject is
explicit in the module API, though no file/media UI exists yet.

## Timing and accuracy boundary

Command validation and DRQ happen at the command-writing instruction boundary.
No seek, rotation, index pulse, DMA, interrupt, WAIT state or wall-clock delay
is modeled. BUSY consequently stays clear. Future timing must derive from
machine T-states, not an independent browser timer.

## Not included

- SHINO CBIOS, BDOS, CCP, CP/M system tracks or filesystem formatter
- host file open/save and persistent browser storage
- drive B:, removable-media UI and mechanical FDC compatibility
- changes to the CPU, firmware, CG-ROM or DM-80 renderer

## References

- Digital Research, *CP/M Operating System Manual*, including the CP/M 2.2
  Alteration Guide:
  <https://www.bitsavers.org/pdf/digitalResearch/cpm/CPM_Operating_System_Manual_Jul82.pdf>
- CP/M BIOS call summary: <https://www.seasip.info/Cpm/bios.html>
- CP/M disk-format notes: <https://www.seasip.info/Cpm/formats.html>
