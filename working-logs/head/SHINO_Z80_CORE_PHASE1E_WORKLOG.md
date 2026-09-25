# SHINO Z80 CORE PHASE 1E WORKLOG

Created: 2026-09-24T23:55:00+09:00
Updated: 2026-09-25T20:03:00+09:00

## Starting point

main after PR #6 through PR #11:
- LD / INC/DEC
- FLAGS foundation
- control flow
- CALL/RET stack
- IPL/video/DM-80 machine

Executable BASE count before PHASE 1E: 107.

## Implementation

Expanded:
- z80-flags.js
- z80-decoder.js
- z80-core.js
- shino80-bus.js

Added:
- general ALU helpers
- DAA
- accumulator rotates
- 16-bit arithmetic
- all BASE conditional flow
- exchange and stack families
- RST
- immediate I/O
- HALT
- DI/EI state
- I/O port bus space

## Exhaustive BASE smoke

Decoder:
- 256 / 256 slots recognized

Execution:
- every one of the 252 non-prefix BASE opcodes executed once on a fresh CPU
- failures: 0

## Targeted semantic regression

PASS:
- arithmetic overflow/carry/half-carry boundaries
- DAA BCD example
- 16-bit ADD/INC/DEC
- exchange families
- absolute 16-bit load/store
- all 8 JP conditions
- all 8 CALL conditions
- all 8 RET conditions
- all 8 RST vectors
- PUSH/POP all qq pairs
- IN/OUT 16-bit port addressing
- repeated HALT cycle behavior
- DI/EI functional state

## Independent oracle

Oracle source:
- SingleStepTests/z80
- v1/*.json
- 1000 cases per opcode

Comparison policy:
- documented flags only
- F mask: 0xD7
- PHASE 1E excludes WZ / P / Q / Y / X
- compare architectural registers
- compare PC / SP
- compare alternate registers
- compare I / R
- compare IFF1 / IFF2 / IM / EI delay
- compare final RAM
- compare total T-states

Initial representative run:
- 23 opcodes x 1000 tests = 23,000 cases

Initial DAA:
- 826 pass
- 174 fail

After DAA correction:
- 23,000 / 23,000 PASS under documented-state comparison policy

## Oracle continuation — 2026-09-25

Checkpoint under test:
- efcdd08ebbb6bdeb1ba7c7d6ad7e3616aa1aebf2

Repository source code was not modified during oracle verification.

Starting cumulative state supplied at continuation:
- Oracle verified: 138 unique opcodes
- Oracle cases: 138,000
- PASS: 138,000
- Failure: 0
- 40h-7Fh fully verified

### 80h-8Fh — ADD / ADC matrix

- 80-8F: 16 opcodes
- 16,000 / 16,000 PASS
- Failure: 0

Includes:
- ADD A,r
- ADD A,(HL)
- ADC A,r
- ADC A,(HL)

### 90h-9Fh — SUB / SBC matrix

- 90-9F: 16 opcodes
- 16,000 / 16,000 PASS
- Failure: 0

Includes:
- SUB r
- SUB (HL)
- SBC A,r
- SBC A,(HL)

### A0h-AFh — AND / XOR matrix

- A0-AF: 16 opcodes
- 16,000 / 16,000 PASS
- Failure: 0

Includes:
- AND r
- AND (HL)
- XOR r
- XOR (HL)

### B0h-BFh — OR / CP matrix

- B0-BF: 16 opcodes
- 16,000 / 16,000 PASS
- Failure: 0

Includes:
- OR r
- OR (HL)
- CP r
- CP (HL)

### 80h-BFh ALU total

- 64 opcodes
- 64,000 / 64,000 PASS
- Failure: 0

Unique cumulative total after 80h-BFh:
- Oracle verified: 202 unique opcodes
- Oracle cases: 202,000
- PASS: 202,000
- Failure: 0

### C0h-CFh restart / re-scan

To avoid relying on an incomplete record of which high BASE opcodes were part of the earlier representative oracle set, C0h-FFh was started as a clean re-scan.

Completed before pause:

C0-C7:
- 8,000 / 8,000 PASS

C8-CF excluding prefix CB:
- C8, C9, CA, CC, CD, CE, CF
- 7,000 / 7,000 PASS

C0-CF non-prefix re-scan subtotal:
- 15 opcodes
- 15,000 / 15,000 PASS
- Failure: 0

IMPORTANT:
- This 15,000-case re-scan is confirmed PASS.
- Do not add all 15 opcodes to the unique-opcode cumulative count until overlap with the earlier 138-opcode set is reconciled.
- The safe unique cumulative count remains 202 opcodes / 202,000 cases.

### Interrupted point

D0-DF verification was launched next, excluding prefix DD.

The run did not return a result before the session was stopped.

Therefore:
- D0-DF must be treated as NOT VERIFIED by this continuation.
- Restart D0-DF from the beginning.
- Do not infer partial PASS from the interrupted run.

## Next oracle work

Continue from:
1. D0-DF excluding DD
2. E0-EF excluding ED
3. F0-FF excluding FD

Prefix introducers excluded from PHASE 1E BASE execution:
- CB
- DD
- ED
- FD

Recommended completion strategy:
- re-scan all C0-FF non-prefix opcodes
- print PASS/FAIL per opcode
- print subtotal per 16-opcode range
- reconcile overlap with the original 138-opcode verified set
- produce final unique BASE coverage count
- target final result: all 252 non-prefix BASE opcodes externally oracle-verified

## Next implementation phase

After PHASE 1E BASE oracle verification is complete:

PHASE 1F:
- CB 256 encodings
