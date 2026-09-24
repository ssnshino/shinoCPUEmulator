# SHINO Z80 CORE v0.0.9 — PHASE 1E BASE COMPLETE SPEC

Created: 2026-09-24T23:55:00+09:00

## BASE decoder

All 256 first-byte BASE slots return a descriptor.

### Executable now

**252 / 252 non-prefix BASE opcodes**

### Prefix entry points

- CB
- DD
- ED
- FD

These four are recognized and intentionally raise an unimplemented-prefix error until their family phases land.

## Family count by BASE slot

- CONTROL: 2
- LD: 84
- INC_DEC_16: 8
- INC_DEC: 16
- ROTATE: 4
- EXCHANGE: 4
- ALU_16: 4
- CONTROL_FLOW: 16
- ALU: 76
- STACK_FLOW: 26
- STACK: 8
- IO: 2
- INTERRUPT_CONTROL: 2
- PREFIX: 4

Total: 256.

## HALT

Executing 76h:

- sets halted state
- PC remains at the byte after HALT
- subsequent step calls generate 4T HALT fetch/refresh cycles
- R continues to increment
- exit by interrupt is deferred to PHASE 1J

## EI / DI

DI clears IFF1/IFF2.

EI sets IFF1/IFF2 and records an EI-delay marker for the future interrupt-acceptance phase.

## I/O

SHINO-80 bus now exposes a separate 64 Ki-entry logical port space.

Immediate I/O forms use the Z80 16-bit port address:

A on the upper address byte, immediate n on the lower byte.

No physical device decoder is attached yet; the bus provides a latch-like port backing store for CPU functional testing.

## Flags

Documented flag semantics are implemented for BASE arithmetic/control operations.

Undocumented X/Y accuracy is intentionally deferred.

## Timing

Documented total instruction T-state counts are represented for BASE instructions.

Bus trace remains M_CYCLE_ABSTRACT and is not a pin-perfect waveform claim.

## Distribution

Artifact:
`deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
