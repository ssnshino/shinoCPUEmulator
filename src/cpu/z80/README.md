# SHINO Z80 CPU core

Status: instruction-level milestone complete at implementation baseline
`e75d8c0506a7b1bb711b54c352c8b04580cdddaf`.

```text
z80/
├ z80-core.js
├ z80-decoder.js
└ z80-flags.js
```

## Coverage

- BASE: 252 non-prefix opcodes
- CB: 256 encodings
- ED: 78 active encodings plus classified unused slots
- DD / FD: 252 terminal slots per family
- DDCB / FDCB: 256 encodings per family
- NMI and INT IM 0/1/2
- EI delay and HALT return
- documented and implemented undocumented flag behavior
- WZ / P / Q state
- total T-states at the instruction model boundary
- pinned external full-state oracle: `1,604,000 / 1,604,000 PASS`

## Responsibilities

- `z80-decoder.js`: opcode-family recognition and instruction descriptors
- `z80-flags.js`: arithmetic/logic and flag helpers
- `z80-core.js`: architectural state, execution, interrupts, timing and Bus
  transactions

## Accuracy boundary

This is an instruction-level NMOS-oriented model, not electrical or
pin-cycle-perfect hardware. WAIT, BUSRQ, analogue contention, peripheral
daisy-chain behavior and multi-byte device-fed IM0 streams require a future
accuracy phase.

Do not introduce a generic multi-CPU abstraction while changing this core.
Any semantic change requires a new PLAN, focused regression and updated oracle
evidence.
