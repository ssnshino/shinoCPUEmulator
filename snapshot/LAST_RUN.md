# LAST RUN
## Z80 PHASE 1E — BASE COMPLETE

Updated: 2026-09-24T23:55:00+09:00

Completed the Z80 non-prefix BASE instruction map.

Results:

```text
BASE slots decoded          256 / 256
Non-prefix opcodes executed 252 / 252
Prefix introducers          CB / DD / ED / FD
Fresh-opcode failures       0
```

Added:
- general ALU
- 16-bit arithmetic
- DAA
- accumulator rotates
- EX family
- full conditional control flow
- PUSH/POP/RST
- I/O port space + IN/OUT
- HALT functional cycles
- DI/EI functional state

Independent oracle:
- SingleStepTests representative opcodes: 23,000 cases
- final failures: 0

DAA was corrected after the first randomized oracle pass found 174 edge-case mismatches.

Next: CB 00h-FFh.
