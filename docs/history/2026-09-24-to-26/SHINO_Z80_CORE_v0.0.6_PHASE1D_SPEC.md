# SHINO Z80 CORE v0.0.6 — PHASE 1D SPEC

Created: 2026-09-24T20:35:00+09:00

## Added executable BASE opcodes

- CDh — CALL nn
- C9h — RET

Previous executable BASE count: 105
Current executable BASE count: **107**

## Stack

The Z80 stack grows downward.

### CALL

Given SP=F000h and return address 0008h:

```text
SP -> EFFF, write 00h
SP -> EFFE, write 08h
```

Final SP: EFFEh

### RET

```text
read LOW from [SP]
SP++
read HIGH from [SP]
SP++
PC = HIGH:LOW
```

## Bus purposes

- STACK_WRITE
- STACK_READ

Debugger PEEK remains separate and produces no CPU bus traffic.

## Timing

- CALL nn: 17T
- RET: 10T

## UI

Artifact:
`deploy/one_page_shino80_v0.0.6_z80_phase1d.html`

CPU Inspector shows stack movement when the current instruction is CALL/RET.

Existing SP register LEDs show the architectural stack pointer itself.

## Accuracy

- functional stack semantics: implemented
- documented total timing: implemented
- M-cycle abstract trace: implemented
- pin-perfect bus waveform: not claimed
