# SHINO-80 BIOS / Monitor v0.3

Candidate — 2026-09-26
Branch `feature/shino80-bios-monitor-v03-20260926`, parent `af6c933`.

This version grows the ROM-resident Monitor into a practical read-only machine
console. Existing BIOS entry addresses and the v0.2 command forms remain valid.
CPU core, decoder execution, flags, Bus, CG-ROM and workbench UI are unchanged.

## Monitor commands

Commands and hexadecimal digits are case-insensitive. Enter sends CR. Address
arguments are exactly four hexadecimal digits and separators are one ASCII
space; malformed forms print the usage line.

| Command | Result |
|---|---|
| `H` or `?` | Show command help |
| `C` | Clear the display and return to MON |
| `D 0100` | Dump 64 bytes beginning at 0100h |
| `D 0100 017F` | Dump the inclusive range, capped at 256 bytes |
| `R` | Show the diagnostic register context captured before line input |
| `U 0100` | Disassemble eight instructions beginning at 0100h |
| `U 0100 017F` | Disassemble an inclusive byte range, capped at 256 bytes or 32 instructions |
| Empty Enter | Show a new prompt |

`D` performs CPU Bus reads and prints eight bytes per row. `D` and `U` ranges
use 16-bit modular distance, so `FFFE 0001` includes four bytes across the
address-space boundary. When a safety cap truncates a command, MON prints
`... RANGE LIMITED`; truncation is never silent.

`U` prints address, fetched bytes and mnemonic. It handles BASE, CB, ED, DD,
FD, DDCB and FDCB forms, signed relative destinations and signed IX/IY
displacements. Unused ED slots are displayed as `NOP (ED UNUSED)`. A chain of
up to four DD/FD prefixes follows Z80 last-prefix/ignored-prefix behavior. A
fifth consecutive DD/FD byte is displayed as `DB DDh ; PREFIX LIMIT` or its FD
equivalent and advances by one byte, guaranteeing progress through malformed
data.

## Register display semantics

`R` displays:

```text
AF BC DE HL
AF' BC' DE' HL'
IX IY SP I R
```

The values are captured at the MON command-input boundary, immediately before
GETLINE. The shown SP is the caller value before the snapshot CALL. R is the
refresh register value observed during that capture sequence and therefore
includes instructions already fetched by MON. This is a diagnostic snapshot,
not a BREAK frame and not a resumable application context. No GO or register
editing command is implied.

## BIOS jump-table additions

Existing entries at 0100h–0115h retain their addresses.

| CALL | Name | Contract |
|---|---|---|
| 0118h | PARSE_HEX16 | HL points to exactly four hex characters. Success: CF=1, DE=value, HL=HL+4. Failure: CF=0. A/F/BC/DE may be changed. |
| 011Bh | DISASM_ONE | HL=start. Prints one disassembly line through BIOS output. Returns HL=next instruction and A=fetched byte length. Other registers and flags are scratch. |

Both routines require a valid RAM stack. DISASM_ONE reads through the CPU Bus,
so device- or VRAM-backed addresses are live observations rather than a frozen
debugger view. Its mnemonic tables are compressed into ROM at build time from
the same decoder descriptors used by the Technical Manual; the runtime routine
itself is Z80 machine code executing on the emulated CPU.

## RAM work areas

| Range | Use |
|---|---|
| E000h–E002h | BIOS cursor pointer and column |
| E100h–E13Fh | MON line buffer, 63 characters plus NUL |
| E140h–E157h | MON register context |
| E158h–E16Fh | D/U range and disassembler scratch |

These are firmware conventions inside ordinary RAM, not separate hardware
banks. Programs using MON or its disassembler must not treat them as preserved
application storage.

## ROM capacity and limits

SYSTEM ROM remains 0000h–1FFFh (8 KiB). The assembled image currently reaches
1FF6h, leaving only nine trailing bytes before 2000h. Further BIOS growth must
first revise the ROM layout, compress/remove functionality, or define banking;
silently overflowing the image is forbidden.

This release intentionally does not add memory/register editing, GO/CALL,
BREAK/NMI return, load/save, disk, serial or printer support. Reserved vectors
remain stubs. Command execution can change VRAM, cursor state, stack and the R
register in the ordinary way.

## Verification contract

- BIOS entry addresses and parser success/failure paths
- exact mnemonic, length and next-address agreement for 1,780 standard
  BASE/CB/ED/DD/FD/DDCB/FDCB encodings
- repeated/ignored prefixes, prefix limit and 16-bit operand wrap
- D exact range, address wrap, real Bus reads and visible 256-byte cap
- R primary/alternate registers, IX/IY, caller SP and I
- U default/range behavior and visible byte/instruction cap
- legacy v0.2 Monitor, full CPU/machine, deterministic build and artifact tests
- offline installed-Chrome desktop/mobile interaction with zero console errors,
  warnings, network requests or horizontal document overflow

## Update history

- 2026-09-26 — BIOS/MON v0.3 candidate: bounded range dump, register context,
  full-family ROM disassembler and two public BIOS services.
