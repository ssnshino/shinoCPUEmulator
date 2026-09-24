# Z80 PHASE 1D — CALL / RET + STACK Research Note v0.1

Created: 2026-09-24T20:35:00+09:00

Primary source:
Zilog Z80 CPU User Manual UM0080
https://www.zilog.com/docs/z80/UM0080.pdf

## CALL nn

Opcode: CD nn nn

The immediate address is little-endian.

CALL pushes the already-advanced PC (the return address) onto the external memory stack and loads PC with nn.

Stack push order used by the documented operation:
1. SP <- SP - 1, write PCH
2. SP <- SP - 1, write PCL
3. PC <- nn

Timing:
- 5 M-cycles
- 17 T-states: 4,3,4,3,3

Flags:
- unaffected

Current abstract trace offsets:

```text
T+0  OPCODE_FETCH
T+2  MEMORY_REFRESH
T+4  OPERAND_READ low target byte
T+7  OPERAND_READ high target byte
T+11 STACK_WRITE return HIGH
T+14 STACK_WRITE return LOW
```

## RET

Opcode: C9

RET pops the return address from the stack into PC.

Current stack interpretation:

```text
LOW  <- [SP] ; SP++
HIGH <- [SP] ; SP++
PC   <- HIGH:LOW
```

Timing:
- 3 M-cycles
- 10 T-states: 4,3,3

Flags:
- unaffected

Current abstract trace offsets:

```text
T+0 OPCODE_FETCH
T+2 MEMORY_REFRESH
T+4 STACK_READ LOW
T+7 STACK_READ HIGH
```

## Nested call teaching value

Two nested calls visibly produce:

```text
SP F000
   ↓ CALL
   EFFE
   ↓ CALL
   EFFC
   ↑ RET
   EFFE
   ↑ RET
   F000
```

This makes PC, SP, RAM and bus traffic move together for the first time.

## Scope

Not yet included:
- conditional CALL
- conditional RET
- PUSH / POP
- RST
- interrupts

The internal pushWord/popWord helpers are intentionally introduced now because CALL/RET require them.
