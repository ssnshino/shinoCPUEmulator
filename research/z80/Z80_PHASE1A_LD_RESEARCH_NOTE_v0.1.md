# Z80 PHASE 1A — Instruction Architecture / LD Research Note v0.1

Created: 2026-09-24T16:58:00+09:00
Status: IMPLEMENTATION BASIS

## Primary source

Zilog, Z80 CPU User Manual, UM0080, Sep 2016:
https://www.zilog.com/docs/z80/UM0080.pdf

This phase implements only behavior directly checked against the documented load instructions used below.

## Encoding observations

### LD r,r'

Documented opcode pattern:

`01 ddd sss`

Register code:

- B = 000
- C = 001
- D = 010
- E = 011
- H = 100
- L = 101
- A = 111

The 110 code is the memory operand `(HL)` in the load matrix, except opcode 76h which is HALT.

Timing:
- register → register: 1 M-cycle / 4 T-states
- flags affected: none

### LD r,n

Pattern:

`00 ddd 110`

Timing:
- 2 M-cycles / 7 T-states
- flags affected: none

The ddd=110 case is the distinct `LD (HL),n` form.

### LD (HL),r / LD r,(HL)

Timing:
- 2 M-cycles / 7 T-states
- flags affected: none

### LD (HL),n

Timing:
- 3 M-cycles / 10 T-states
- flags affected: none

### LD dd,nn

Register-pair code:

- BC = 00
- DE = 01
- HL = 10
- SP = 11

The first byte after the opcode is the low-order byte of nn.

Timing:
- 10 T-states total
- flags affected: none

### BC / DE indirect accumulator loads

Implemented:

- `LD A,(BC)`
- `LD A,(DE)`
- `LD (BC),A`
- `LD (DE),A`

Timing:
- 7 T-states
- flags affected: none

### Absolute accumulator loads

Implemented:

- `LD A,(nn)` — 3Ah
- `LD (nn),A` — 32h

The address operand is little-endian.

Timing:
- 13 T-states
- flags affected: none

## Emulator interpretation

PHASE 1A preserves the existing accuracy ladder.

Current bus trace remains:

`M_CYCLE_ABSTRACT`

The trace records:

- opcode fetch
- refresh observation
- operand reads
- data reads/writes

with M-cycle start offsets that match the documented instruction timing structure used in this phase.

It does not yet claim pin-perfect per-T-state electrical behavior.

## R register rule in this phase

R increments on opcode fetch, not on immediate operand/data reads.

Therefore a three-byte `LD HL,nn` increments R once.

This is tested explicitly.

## Test methodology reference

SingleStepTests/z80:
https://github.com/SingleStepTests/z80

The repository's JSON format provides:

- initial CPU state
- initial RAM
- final CPU state
- final RAM
- cycle/bus observations
- I/O port observations

The repository states that state-only comparison is possible without enforcing every cycle, which matches SHINO-80's staged accuracy policy.

License:
MIT License, Copyright (c) 2024 SingleStepTests.

Important:
The repository itself cautions that the tests may not be perfect, so it will be treated as one oracle among several, not as unquestionable truth.

## Phase boundary

Not implemented here:

- HALT
- INC / DEC
- ALU / flags generation
- JP / JR / CALL / RET
- stack
- CB / ED / DD / FD prefixes
- interrupts
- cycle-perfect WAIT/bus pins

Opcode 76h is recognized as HALT by the decoder but deliberately faults as unimplemented.
