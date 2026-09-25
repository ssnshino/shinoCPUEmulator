# SHINO Z80 CORE PHASE 1E WORKLOG

Created: 2026-09-24T23:55:00+09:00

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

SingleStepTests representative run:
23 opcodes x 1000 tests = 23,000 cases.

Initial DAA:
- 826 pass
- 174 fail

After DAA correction:
- 23,000 / 23,000 PASS under documented-state comparison policy.

## Next

PHASE 1F:
CB 256 encodings.

## External oracle sweep continuation — 2026-09-25

### Validation policy

Oracle:
- `SingleStepTests/z80`
- `v1/*.json`

CPU checkpoint:
- `efcdd08ebbb6bdeb1ba7c7d6ad7e3616aa1aebf2`

Rules:
- checkpoint CPU core only; no CPU-core source changes during validation
- 1000 oracle cases per opcode
- compare documented flags only: `F & 0xD7`
- WZ / P / Q / undocumented Y / X are outside PHASE 1E comparison
- compare architectural registers, PC / SP, alternate registers, I / R,
  IFF1 / IFF2 / IM / EI delay, final RAM, and total T-states
- total T-states are compared against oracle `cycles.length`

### Entry state

Before this continuation:
- Oracle verified: 138 opcode
- Oracle cases: 138,000
- PASS: 138,000
- Failure: 0
- `40h–7Fh` had been fully verified
- final previous block `54h–7Fh`: 44,000 / 44,000 PASS

### 80h–BFh ALU matrix

All 64 ALU opcodes were verified, including every `(HL)` form.

Results:
- `80–8F` ADD / ADC: 16,000 / 16,000 PASS
- `90–9F` SUB / SBC: 16,000 / 16,000 PASS
- `A0–AF` AND / XOR: 16,000 / 16,000 PASS
- `B0–BF` OR / CP: 16,000 / 16,000 PASS

ALU matrix total:
- 64 opcode
- 64,000 / 64,000 PASS
- Failure: 0

Unique verified coverage after the ALU matrix:
- Oracle verified: 202 opcode
- Oracle cases: 202,000
- PASS: 202,000
- Failure: 0

### C0h–CFh revalidation

The next sweep deliberately re-ran the C0h block rather than assuming which
earlier representative opcodes were already included in the 138-opcode total.

Confirmed PASS:
- `C0–C7`: 8,000 / 8,000
- `C8`
- `C9`
- `CA`
- `CC`
- `CD`
- `CE`
- `CF`

`CB` is a prefix introducer and is outside non-prefix BASE validation.

C0h–CFh non-prefix revalidation total:
- 15 opcode
- 15,000 / 15,000 PASS
- Failure: 0

These 15 opcodes are recorded as **revalidation** and are not added blindly to
the unique 202-opcode coverage count, because the earlier 138-opcode run already
contained some opcodes outside the 00h–7Fh range. Reconstruct the exact opcode
coverage set before publishing a final unique-opcode total.

Observed oracle executions through this stopping point:
- previous confirmed executions: 202,000
- C0h–CFh revalidation: +15,000
- total executed oracle cases represented by the current record: 217,000
- observed failures: 0

### Stop point

A `D0h–DFh` automated run was started, but its result was not returned before
the validation session was stopped.

Therefore:
- do **not** infer PASS/FAIL for `D0h–DFh` from that interrupted run
- resume from `D0h` (excluding prefix `DDh`) or reconstruct the full
  remaining non-prefix BASE set automatically
- prefixes `CBh / DDh / EDh / FDh` remain outside PHASE 1E BASE oracle scope

### Recommended continuation

Use an automated oracle harness to:
1. pin the emulator to checkpoint `efcdd08ebbb6bdeb1ba7c7d6ad7e3616aa1aebf2`
2. leave CPU-core source unchanged
3. reconstruct the exact already-verified opcode set
4. run every remaining non-prefix BASE opcode against all 1000 oracle cases
5. print per-opcode PASS/FAIL and cumulative totals
6. stop and preserve the first mismatch with full state diagnostics
7. finish only when non-prefix BASE coverage can be stated unambiguously as
   `252 / 252` under the documented-state comparison policy

