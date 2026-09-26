# SHINO Z80 CORE PHASE 1E WORKLOG

Created: 2026-09-24T23:55:00+09:00
Updated: 2026-09-25T20:40:26+09:00

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

## Oracle completion — 2026-09-25

PHASE 1E BASE oracle verification was completed without changing CPU implementation code.

Pinned inputs:
- SHINO-80 CPU checkpoint: `efcdd08ebbb6bdeb1ba7c7d6ad7e3616aa1aebf2`
- Oracle repository: `SingleStepTests/z80`
- Oracle commit: `ebe1875d48f374bcfd4b505d8eb8ee751568b5f7`
- Dataset: `v1/*.json`
- Cases per opcode: 1000

Comparison:
- A / B / C / D / E / H / L
- IX / IY
- documented F bits only: `F & 0xD7`
- PC / SP
- alternate AF / BC / DE / HL, with undocumented F' Y/X ignored
- I / R
- IFF1 / IFF2 / IM / EI delay
- final RAM
- I/O read/write transactions where present
- total T-states from oracle `cycles.length`

Excluded by PHASE 1E policy:
- WZ
- P / Q
- undocumented F Y / X
- pin-level cycle waveform

### Requested D0h–DFh verification

Prefix `DD` was excluded.

```text
D0 1000/1000 PASS
D1 1000/1000 PASS
D2 1000/1000 PASS
D3 1000/1000 PASS
D4 1000/1000 PASS
D5 1000/1000 PASS
D6 1000/1000 PASS
D7 1000/1000 PASS
D8 1000/1000 PASS
D9 1000/1000 PASS
DA 1000/1000 PASS
DB 1000/1000 PASS
DC 1000/1000 PASS
DE 1000/1000 PASS
DF 1000/1000 PASS
```

Block result:
- verified opcodes: 15
- tested cases: 15,000
- PASS: 15,000
- Failure: 0

### Requested E0h–EFh verification

Prefix `ED` was excluded.

```text
E0 1000/1000 PASS
E1 1000/1000 PASS
E2 1000/1000 PASS
E3 1000/1000 PASS
E4 1000/1000 PASS
E5 1000/1000 PASS
E6 1000/1000 PASS
E7 1000/1000 PASS
E8 1000/1000 PASS
E9 1000/1000 PASS
EA 1000/1000 PASS
EB 1000/1000 PASS
EC 1000/1000 PASS
EE 1000/1000 PASS
EF 1000/1000 PASS
```

Block result:
- verified opcodes: 15
- tested cases: 15,000
- PASS: 15,000
- Failure: 0

### Requested F0h–FFh verification

Prefix `FD` was excluded.

```text
F0 1000/1000 PASS
F1 1000/1000 PASS
F2 1000/1000 PASS
F3 1000/1000 PASS
F4 1000/1000 PASS
F5 1000/1000 PASS
F6 1000/1000 PASS
F7 1000/1000 PASS
F8 1000/1000 PASS
F9 1000/1000 PASS
FA 1000/1000 PASS
FB 1000/1000 PASS
FC 1000/1000 PASS
FE 1000/1000 PASS
FF 1000/1000 PASS
```

Block result:
- verified opcodes: 15
- tested cases: 15,000
- PASS: 15,000
- Failure: 0

D0h–FFh requested sweep total:
- verified opcodes: 45
- tested cases: 45,000
- PASS: 45,000
- Failure: 0

### Full unique BASE oracle baseline

The earlier 138-opcode verification record did not retain a complete opcode list.
To avoid inferred coverage and duplicate counting, all available two-digit BASE oracle files were therefore re-run once at the pinned checkpoint.

Dataset integrity before execution:
- non-prefix opcode files: 252
- each file: 1000 cases
- total unique baseline cases: 252,000
- malformed or short fixture files: 0

Final result:

```text
BASE decode          256 / 256
non-prefix BASE      252 / 252
Oracle verified      252 / 252
Oracle cases         252,000 unique baseline cases
PASS                 252,000
Failure              0
```

Coverage map:

```text
00 PASS  01 PASS  02 PASS  03 PASS  04 PASS  05 PASS  06 PASS  07 PASS  08 PASS  09 PASS  0A PASS  0B PASS  0C PASS  0D PASS  0E PASS  0F PASS
10 PASS  11 PASS  12 PASS  13 PASS  14 PASS  15 PASS  16 PASS  17 PASS  18 PASS  19 PASS  1A PASS  1B PASS  1C PASS  1D PASS  1E PASS  1F PASS
20 PASS  21 PASS  22 PASS  23 PASS  24 PASS  25 PASS  26 PASS  27 PASS  28 PASS  29 PASS  2A PASS  2B PASS  2C PASS  2D PASS  2E PASS  2F PASS
30 PASS  31 PASS  32 PASS  33 PASS  34 PASS  35 PASS  36 PASS  37 PASS  38 PASS  39 PASS  3A PASS  3B PASS  3C PASS  3D PASS  3E PASS  3F PASS
40 PASS  41 PASS  42 PASS  43 PASS  44 PASS  45 PASS  46 PASS  47 PASS  48 PASS  49 PASS  4A PASS  4B PASS  4C PASS  4D PASS  4E PASS  4F PASS
50 PASS  51 PASS  52 PASS  53 PASS  54 PASS  55 PASS  56 PASS  57 PASS  58 PASS  59 PASS  5A PASS  5B PASS  5C PASS  5D PASS  5E PASS  5F PASS
60 PASS  61 PASS  62 PASS  63 PASS  64 PASS  65 PASS  66 PASS  67 PASS  68 PASS  69 PASS  6A PASS  6B PASS  6C PASS  6D PASS  6E PASS  6F PASS
70 PASS  71 PASS  72 PASS  73 PASS  74 PASS  75 PASS  76 PASS  77 PASS  78 PASS  79 PASS  7A PASS  7B PASS  7C PASS  7D PASS  7E PASS  7F PASS
80 PASS  81 PASS  82 PASS  83 PASS  84 PASS  85 PASS  86 PASS  87 PASS  88 PASS  89 PASS  8A PASS  8B PASS  8C PASS  8D PASS  8E PASS  8F PASS
90 PASS  91 PASS  92 PASS  93 PASS  94 PASS  95 PASS  96 PASS  97 PASS  98 PASS  99 PASS  9A PASS  9B PASS  9C PASS  9D PASS  9E PASS  9F PASS
A0 PASS  A1 PASS  A2 PASS  A3 PASS  A4 PASS  A5 PASS  A6 PASS  A7 PASS  A8 PASS  A9 PASS  AA PASS  AB PASS  AC PASS  AD PASS  AE PASS  AF PASS
B0 PASS  B1 PASS  B2 PASS  B3 PASS  B4 PASS  B5 PASS  B6 PASS  B7 PASS  B8 PASS  B9 PASS  BA PASS  BB PASS  BC PASS  BD PASS  BE PASS  BF PASS
C0 PASS  C1 PASS  C2 PASS  C3 PASS  C4 PASS  C5 PASS  C6 PASS  C7 PASS  C8 PASS  C9 PASS  CA PASS  CB PREFIX  CC PASS  CD PASS  CE PASS  CF PASS
D0 PASS  D1 PASS  D2 PASS  D3 PASS  D4 PASS  D5 PASS  D6 PASS  D7 PASS  D8 PASS  D9 PASS  DA PASS  DB PASS  DC PASS  DD PREFIX  DE PASS  DF PASS
E0 PASS  E1 PASS  E2 PASS  E3 PASS  E4 PASS  E5 PASS  E6 PASS  E7 PASS  E8 PASS  E9 PASS  EA PASS  EB PASS  EC PASS  ED PREFIX  EE PASS  EF PASS
F0 PASS  F1 PASS  F2 PASS  F3 PASS  F4 PASS  F5 PASS  F6 PASS  F7 PASS  F8 PASS  F9 PASS  FA PASS  FB PASS  FC PASS  FD PREFIX  FE PASS  FF PASS
```

### Execution accounting

Unique coverage is always reported as the 252,000-case full baseline above.
Repeated runs are not added to that unique count.

Current continuation session actually executed:
- six-opcode harness calibration: 6,000 cases
- requested D0h–FFh sweep: 45,000 cases
- full 252-opcode unique baseline sweep: 252,000 cases
- current session total executed: 303,000 cases
- current session failures: 0

Including the prior worklog's 217,000 recorded executions, the project record now represents 520,000 total executed oracle cases. This is an execution-volume figure only, not a unique-coverage figure.

### Source immutability evidence

The following SHA-256 values were identical before and after oracle execution:

```text
23dc989a6fb98b16f982f4da9db8394861ee686a63e8b5e4b638ef8807f8bf06  src/cpu/z80/z80-core.js
630c52155dafc4945f89241bf3587f9bfa62138696f7aa8f7a2f183a03393817  src/cpu/z80/z80-decoder.js
ec2389578dfbe9df6cd8a001ad2f0fcac3876450eb558228be5317031faad834  src/cpu/z80/z80-flags.js
bd41d783d302cd81d8b27d7062cb84a94bb3e3498a0d47b465f66cafbe78659c  src/machine/shino80/shino80-bus.js
```

The checkpoint worktree remained clean at `efcdd08ebbb6bdeb1ba7c7d6ad7e3616aa1aebf2`.

### Conclusion

PHASE 1E BASE is externally oracle-verified for all 252 non-prefix BASE opcodes under the documented-state comparison policy.

No CB implementation, CB validation, or PHASE 1F source work was performed in this continuation.
