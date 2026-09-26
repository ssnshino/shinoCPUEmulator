# SHINO-80 BIOS / Monitor v0.3 PLAN

2026-09-26 · branch `feature/shino80-bios-monitor-v03-20260926`
Parent `af6c933` / Technical Manual PR #27 candidate.

## Goal

Grow the ROM-resident monitor into a useful machine-language study tool while
preserving the transparent path: keyboard -> Z80 -> BIOS -> Bus -> VRAM.

Commands:

- keep `H`, `?`, `C`, empty Enter and legacy `D xxxx` (64 bytes)
- add `D xxxx yyyy`: inclusive bounded memory range, wrapping at FFFFh
- add `R`: register snapshot captured before line input
- add `U xxxx`: disassemble eight instructions
- add `U xxxx yyyy`: disassemble through the instruction containing/starting at
  the inclusive end boundary, with a safety cap

## BIOS / implementation

Keep existing jump-table addresses 0100h–0115h stable. Add append-only entries:

- 0118h PARSE_HEX16: bounded four-hex parser for monitor/application reuse
- 011Bh DISASM_ONE: read one instruction through CPU Bus, print address, bytes
  and mnemonic, and return the next 16-bit address

The disassembler executes from SYSTEM ROM. Build-time JavaScript may generate
compact token/dictionary tables from the repository decoder, but the browser
must not parse a command or write the result to VRAM. Runtime bytes are read by
Z80 CPU accesses. Cover BASE/CB/ED/DD/FD/DDCB/FDCB, aliases, unused ED and
ignored/repeated prefixes. Output must remain truthful where arbitrary prefix
chains hit a safety limit.

Register `R` records AF/BC/DE/HL, alternate AF'/BC'/DE'/HL', IX/IY, SP, I and R
at the MON command-input boundary, before GETLINE clobbers working registers.
It is a diagnostic MON context, not yet a resumable application context: there
is no GO/BREAK path in v0.3. PC shown, if any, must be explicitly the MON entry.

## Non-goals

- no CPU/decoder/flags behavior change
- no CG-ROM, renderer, scheduler, debugger or host command parser change
- no memory edit/fill/copy, register edit, GO/CALL, load/save or disk command
- no NMI BREAK handler, ROM bank, physical FDD or public deployment
- no claim of cycle-perfect hardware

## Accuracy / risk

Accuracy level is firmware functional behavior over the instruction-complete CPU.
Primary risks: ROM overflow, prefix termination, byte order/displacement display,
address wrap, disassembling self-changing VRAM/work RAM, screen scrolling changing
subsequent bytes, stack/register corruption and disagreement with decoder/manual.

Range syntax is strict: one ASCII space between uppercase/lowercase-insensitive
hex operands; exactly four hex digits each. Range commands have explicit safety
caps so a malformed/wrapping range cannot monopolize MON. Limits and truncation
messages must be visible, not silent.

## QA / success

- unit-call new BIOS entries through the CPU and verify ABI/register/stack rules
- compare DISASM_ONE output and next address against decoder-generated fixtures
  spanning all families, immediates, signed displacement, aliases, ignored and
  repeated prefixes, wraparound and ROM/RAM
- command tests for old/new dump forms, range endpoints/wrap/cap, R snapshot,
  U default/range/cap, malformed input, repeated use and scroll
- verify reads are real CPU Bus activity and ROM stays write-protected
- existing full package regression, deterministic emulator/manual builds
- update Technical Manual BIOS/MON content and rebuild its standalone artifact
- real Chrome desktop/mobile command smoke; publish review-copy HTML only
- one logical commit, push and stacked PR; no merge without Human authorization

Success means old MON behavior remains compatible, the new commands are entirely
ROM-resident and correctly bounded, all tests pass, worktree is clean, and restart
documents state exact limitations. If full-family disassembly cannot fit correctly
inside the 8KiB ROM, stop and revise the architecture rather than shipping a
misleading partial decoder under the `U` command.

## Completion — 2026-09-26

Implemented as scoped. Full-family disassembly fits through 1FF6h, leaving nine
trailing ROM bytes. The 1,780-form exact decoder comparison, command tests,
package regression, deterministic builds and offline Chrome desktop/mobile
checks pass. See `docs/head/SHINO80_BIOS_MONITOR_v0.3.md` and
`working-logs/head/SHINO80_BIOS_MONITOR_V03_WORKLOG.md`. No merge or public
deployment is part of plan completion.
