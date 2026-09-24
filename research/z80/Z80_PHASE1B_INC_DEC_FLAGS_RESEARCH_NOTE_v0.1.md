# Z80 PHASE 1B — INC / DEC Flags Research Note v0.1

Created: 2026-09-24T18:18:00+09:00
Status: IMPLEMENTATION BASIS

## Primary source

Zilog Z80 CPU User Manual, UM0080:
https://www.zilog.com/docs/z80/UM0080.pdf

## INC r

Operation:

`r <- r + 1`

Documented timing:
- 1 M-cycle
- 4 T-states

Documented flags:
- S: set if result is negative
- Z: set if result is zero
- H: set if carry from bit 3
- P/V: set if operand was 7Fh before INC
- N: reset
- C: unaffected

## INC (HL)

Operation:

`(HL) <- (HL) + 1`

Documented timing:
- 3 M-cycles
- 11 T-states: 4,4,3

Documented flags are the same as INC r.

## DEC r / DEC (HL)

Operation:

`m <- m - 1`

Documented timing:
- DEC r: 4 T-states
- DEC (HL): 11 T-states: 4,4,3

Documented flags:
- S: set if result is negative
- Z: set if result is zero
- H: set if borrow from bit 4
- P/V: set if operand was 80h before DEC
- N: set
- C: unaffected

## Why P/V lights at 7F/80 boundaries

For INC:
- 7Fh is +127 in signed 8-bit
- INC produces 80h, interpreted as -128
- signed overflow occurred
- therefore P/V = 1

For DEC:
- 80h is -128 in signed 8-bit
- DEC produces 7Fh, interpreted as +127
- signed overflow occurred
- therefore P/V = 1

## Half Carry examples

INC:
- 0Fh -> 10h crosses the lower-nibble boundary
- H = 1

DEC:
- 10h -> 0Fh requires a borrow into the lower nibble
- H = 1

## Carry behavior

C is explicitly documented as unaffected for INC/DEC.

Therefore PHASE 1B preserves the previous C bit.

This is a good teaching example because arithmetic can occur without updating the Carry flag.

## Undocumented Y/X policy

The current UI shows F bits 5 and 3 as Y/X.

The official INC/DEC descriptions used for this phase do not define those undocumented bits.

PHASE 1B policy:

> preserve Y/X exactly as they were before INC/DEC.

Do not guess undocumented behavior.

A later accuracy phase may research and implement real Y/X behavior using hardware-derived test suites and multiple references.

## Memory read-modify-write observation

For INC/DEC (HL), current SHINO bus trace records:

```text
T+0  OPCODE_FETCH
T+2  MEMORY_REFRESH
T+4  DATA_READ
T+8  DATA_WRITE
```

Total instruction timing is 11 T-states.

This remains an M-cycle-level teaching trace, not a pin-perfect electrical waveform.

## Scope

Not part of PHASE 1B:
- 16-bit INC/DEC register-pair instructions
- ALU ADD/ADC/SUB/SBC
- JP/JR/CALL/RET
- prefixes
- interrupts
- undocumented Y/X refinement
