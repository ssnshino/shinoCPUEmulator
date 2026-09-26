# SHINO-80 BIOS console / Monitor v0.2

Candidate — 2026-09-26T01:45:00+09:00

This supersedes the v0.1 wrap-at-bottom and immediate-command behavior.
Public existing BIOS addresses remain stable; internal ROM labels may move.

## Commands

All commands now require Enter (CR). Commands and hex digits are case-insensitive.

| Input | Result |
|---|---|
| `H` or `?` | Help |
| `C` | Clear display and show MON prompt |
| `D 0100` | Dump 64 bytes from 0100h, 8 rows of 8 bytes |
| Empty Enter | New prompt |

`D` requires one space and exactly four hex digits; malformed input prints
`? USE H / C / D xxxx`. No edit, GO, load/save, or register command exists yet.
The 16-bit dump address wraps after FFFFh. Dumps perform actual CPU Bus reads,
unlike the separate observer-only Memory Inspector. Dumps of VRAM, BIOS work
RAM or stack show live values, potentially changed by the dump itself.

## Added BIOS ABI

| CALL | Service | Input / output |
|---|---|---|
| 010Ch / RST 10h | GETCHAR (existing) | blocking keyboard byte in A |
| 010Fh | GETLINE | HL writable buffer; B capacity 1..63 excluding NUL; returns A length |
| 0112h | PRINT_HEX8 | A byte, prints two uppercase hex digits |
| 0115h | PRINT_HEX16 | HL word, prints four uppercase hex digits |

GETLINE preserves BC, DE, HL and caller SP; flags are unspecified. The caller
must supply capacity+1 writable bytes, outside BIOS state and active stack.
It accepts ASCII 20h..7Eh, echoes accepted characters, ignores overflow and
other control bytes, accepts 08h/7Fh as erase, and CR as completion. Empty
Backspace cannot erase the prompt. LF alone is ignored (browser Enter maps to
CR). The returned string is NUL-terminated; bytes after NUL are unspecified.
MON reserves E100h–E13Fh for this buffer. E000h–E002h remain cursor state.
HEX8/HEX16 preserve AF, BC, DE, HL and caller SP.

PUTCHAR 08h erases the previous character, stopping at screen origin. Line
editing additionally stops at the start of the current input. Advancing beyond
the last visible cell scrolls rows 1..24 up, clears the last row and positions
the cursor at C780h. Scrolling leaves C7D0h..C7FFh untouched; CLS retains its
existing full C000h..C7FFh clear behavior. NEWLINE uses the same scroll path.

## Implementation and limits

Parser, formatting, line editing and scrolling run as Z80 BASE instructions in
SYSTEM ROM. CPU core, decoder, flags, bus and CG-ROM are unchanged. Browser
code only forwards host key events; it does not interpret MON commands.
The existing 64-byte keyboard FIFO can overflow on a large fast paste; this
phase does not add a host-side paste protocol. VISUAL pace intentionally runs
slowly; select MAX for normal console testing. iOS real-device QA is pending.

## Update History

- 2026-09-26T01:45:00+09:00 — BIOS line console / MON dump candidate documented.
