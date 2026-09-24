# Z80 First Heartbeat Research Note v0.1

Created: 2026-09-24T13:42:12+09:00
Scope: RESET / NOP / M1 / R / first-heartbeat test methodology only

## Primary source

Zilog, **Z80 CPU User Manual**, UM0080, revision UM008011-0816.

Official PDF:
https://www.zilog.com/docs/z80/um0080.pdf

### RESET

The manual states that RESET initializes the CPU by resetting the interrupt enable flip-flop, clearing PC and registers I and R, and selecting interrupt Mode 0. It also describes buses/control outputs during reset and the minimum reset duration.

Implementation decision:

- `reset()` changes only the documented programmer-visible reset fields used by this milestone plus emulator control state.
- It does NOT invent reset values for A, F, BC, DE, HL, alternate registers, IX, IY, or SP.
- Constructor cold-state zeroing exists only to make a newly-created bench deterministic; it is not claimed as hardware RESET behavior.

### NOP

The instruction description states:

- no operation
- no condition bits affected
- one machine cycle
- four T-states

Implementation decision:

- only opcode `00h` is accepted in v0.0.1.
- it consumes 4 T-states and leaves F unchanged.

### M1 opcode fetch

The manual describes the first machine cycle as the opcode fetch M1 cycle. PC appears on the address bus; MREQ/RD participate in the memory read; T3/T4 are used for memory refresh.

Implementation decision:

v0.0.1 emits two abstract observation records:

1. `OPCODE_FETCH` with `M1 MREQ RD`
2. `MEMORY_REFRESH` with `MREQ RFSH`

This is a teaching/inspection trace, NOT an electrical pin waveform.

### R refresh register

The manual describes R as an 8-bit register where seven bits automatically increment after each instruction fetch and the eighth bit remains as programmed by `LD R,A`.

Implementation decision:

`R = (R & 0x80) | (((R & 0x7f) + 1) & 0x7f)`

The refresh trace uses I as the upper byte and R[6:0] as the guaranteed refresh counter contribution. A7 is explicitly left unmodeled.

## Secondary test-method source

SingleStepTests/z80:
https://github.com/SingleStepTests/z80

The test data format includes initial state, final state, RAM, and cycle/bus observations. This is useful for later expansion from functional tests toward cycle/bus validation.

Important caveat:

The repository itself notes configurable simplifications and that tests may not be perfect. It will not be treated as a single unquestionable oracle.

## Status

This note does NOT complete PHASE 0 research.

It only justifies the first NOP heartbeat implementation.
