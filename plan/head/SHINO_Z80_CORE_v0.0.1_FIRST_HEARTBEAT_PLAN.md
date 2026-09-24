# SHINO Z80 CORE v0.0.1 — FIRST HEARTBEAT PLAN

Created: 2026-09-24T13:42:12+09:00
Status: IMPLEMENTED CANDIDATE

## Purpose

SHINO-80本体の前に、Z80 CPU Coreの最小試験台を作る。
最初の成功条件は画面出力ではなく、RESET → NOP fetch → 4 T-state → PC/R更新 → Bus trace観測。

## Research basis

Primary source: Zilog Z80 CPU User Manual UM0080.

For this milestone only, the implementation relies on these documented facts:

- RESET clears PC, I, R, interrupt-enable state and selects interrupt mode 0.
- NOP performs no operation, affects no flags, and takes 1 M-cycle / 4 T-states.
- The first machine cycle is M1 opcode fetch; PC is placed on the address bus and memory is read.
- T3/T4 of M1 are used for refresh.
- R lower seven bits increment after each instruction fetch; bit 7 remains programmed.

Secondary test-method reference:

- SingleStepTests/z80 JSON vectors include initial/final state and cycle/bus observations.

## Scope

### CPU

- full visible register state container
- documented RESET fields
- opcode fetch
- NOP only
- PC increment
- R lower-7 increment / bit7 preservation
- T-state accounting
- instruction count

### Bus

- 64 KiB byte-addressable bench memory
- CPU read/write API
- debug peek/poke that does not emit CPU trace
- abstract M1 fetch trace
- abstract refresh trace

### UI

Altair-inspired observation panel:

- register LEDs
- Address Bus 16 LEDs
- Data Bus 8 LEDs
- M1 / MREQ / IORQ / RD / WR / RFSH / HALT / WAIT / INT / NMI lamps
- Flags LEDs
- current instruction
- bus trace
- memory monitor
- RESET / STEP / RUN VISUAL / PAUSE / BURST controls

## Accuracy statement

This is NOT cycle-perfect.

Bus trace precision for v0.0.1:

`M_CYCLE_ABSTRACT`

It records fetch + refresh intent and timing position for visualization, but it does not yet model every pin transition per T-state.

A7 during refresh is deliberately marked NOT_MODELED rather than guessed.

## Non-goals

- any opcode other than NOP
- HALT behavior
- WAIT behavior
- interrupts
- prefixes
- SHINO-80 ROM/RAM/VRAM final memory map
- BIOS
- video device
- FDD/UART/Printer
- 4 MHz realtime execution
- cycle-perfect signals

## QA

- Node unit tests for RESET/NOP/R/timing/trace
- generated one-page HTML placeholder/static check
- one-page build has no external runtime dependency

## Success criteria

- RESET behavior matches the documented subset used here
- STEP over 00h yields PC+1 / R+1 / +4T
- F register remains unchanged by NOP
- debug memory display generates no CPU bus event
- bus trace exposes M1 fetch and refresh separately
- UI clearly labels its timing accuracy
