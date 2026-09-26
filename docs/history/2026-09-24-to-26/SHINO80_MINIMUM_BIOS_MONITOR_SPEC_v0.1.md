# SHINO-80 MINIMUM BIOS + MONITOR FOUNDATION SPEC v0.1

Status: CANDIDATE
Date: 2026-09-25

## Scope

This specification defines the first executable original SHINO-80 BIOS ABI.
It does not claim a complete interactive Monitor or device BIOS.

## SYSTEM ROM

- mapped range: `0000h-1FFFh`
- size: 8 KiB
- CPU writes: blocked by the Bus ROM range
- RESET vector: `0000h`
- IPL implementation entry: `0200h`

The ROM image is produced by the internal label/fixup builder in
`src/firmware/shino80/shino80-system-rom.js`. Source labels are exported with
the image for deterministic tests and debugger use.

## Hardware / RST vectors

| Address | Service | v0.1 behavior |
|---:|---|---|
| `0000h` | RESET | jump to IPL entry |
| `0008h` | PUTCHAR | jump to executable PUTCHAR |
| `0010h` | GETCHAR | reserved; returns |
| `0018h` | DISK READ | reserved; returns |
| `0020h` | DISK WRITE | reserved; returns |
| `0028h` | SERIAL I/O | reserved; returns |
| `0030h` | PRINTER OUTPUT | reserved; returns |
| `0038h` | IM1 | reserved; returns |
| `0066h` | NMI | reserved; returns |

A reserved vector is not evidence that the named service is implemented.

## BIOS v0.1 jump table

The call table begins at `0100h`. Every slot is a three-byte `JP` so routine
implementations can move inside SYSTEM ROM without moving the public entry.

| Address | Service |
|---:|---|
| `0100h` | PUTCHAR |
| `0103h` | NEWLINE |
| `0106h` | CLS |
| `0109h` | PRINT_STRING |

## BIOS work area

The minimum BIOS owns three bytes of SYSTEM RAM.

| Address | Meaning |
|---:|---|
| `E000h-E001h` | little-endian TEXT VRAM cursor pointer |
| `E002h` | cursor column `0-79` |

## PUTCHAR

Entry:

- `RST 08h`, or
- `CALL 0100h`

Input:

- `A` = byte to emit

Behavior:

- ordinary bytes are written at the current cursor through a CPU Bus write
- `0Dh` moves to column zero of the current row
- `0Ah` moves to column zero of the next row
- advancing after `C7CFh` wraps the cursor to `C000h`

Preserved:

- `AF`, `BC`, `HL`
- caller-visible `SP`

## NEWLINE

Entry: `CALL 0103h`

Moves the cursor to column zero of the next row and wraps after row 24.
Preserves `AF`, `BC`, `HL`, and caller-visible `SP`.

## CLS

Entry: `CALL 0106h`

Clears `C000h-C7FFh` and resets the cursor to `C000h`, column zero. The range
includes the 48-byte reserved tail after the 2000 visible character cells.

Preserves `AF`, `BC`, `HL`, and caller-visible `SP`.

## PRINT_STRING

Entry: `CALL 0109h`

Input:

- `HL` = address of a zero-terminated byte string

Each nonzero byte is emitted through `RST 08h`. On return, `HL` points to the
terminating zero. `AF` and `HL` are clobbered; `BC`, `DE`, and caller-visible
`SP` are preserved.

## IPL

RESET performs the following machine-side sequence:

1. disables maskable interrupts
2. sets `SP=F000h`
3. runs the existing eight-page A-H TEXT VRAM diagnostic
4. holds the diagnostic image for observer pacing
5. calls BIOS CLS through the public jump table
6. calls BIOS PRINT_STRING through the public jump table
7. enters the Monitor wait loop

The BIOS-generated display remains:

```text
SHINO-80 IPL
VIDEO OK
MON
*
```

## Monitor status

The `*` prompt and wait loop establish the Monitor entry surface only.
Keyboard input, command parsing, memory dump/edit, GO, register inspection,
load/save, disk, serial, and printer commands are not implemented in v0.1.

## Accuracy / observability

- BIOS code consists only of Z80 instructions executed by the CPU core.
- TEXT VRAM changes are CPU Bus writes, not JavaScript UI writes.
- ROM protection remains enforced by the Bus.
- Total firmware timing is deterministic at the current instruction/T-state
  accuracy level.

## Integration status

After CG-ROM / DM-80 PR #14 merged, the BIOS candidate was updated from the
reviewed `main` and the canonical one-page artifact was regenerated. The
package test chain includes the BIOS unit test, and Chrome smoke reaches the
Monitor loop at `0220h` with the final CG-ROM / DM-80 renderer active.

Repository README and restart snapshots are refreshed in the post-merge
closeout so they can record the exact reviewed `main` commit.
