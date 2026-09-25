# Z80 PHASE 1E — BASE COMPLETION RESEARCH NOTE v0.1

Created: 2026-09-24T23:55:00+09:00

## Primary specification

Zilog Z80 CPU User Manual UM0080:
https://www.zilog.com/docs/z80/UM0080.pdf

The BASE instruction families and documented flag/timing behavior were implemented against the Zilog instruction descriptions.

## Independent oracle

Repository:
https://github.com/SingleStepTests/z80

License:
MIT, Copyright (c) 2024 SingleStepTests.

Each opcode fixture contains 1000 generated tests with initial/final CPU state, RAM, cycles and I/O transactions.

PHASE 1E comparison policy:

- compare documented architectural register state
- compare documented F bits S/Z/H/PV/N/C
- compare PC/SP/I/R/IFF/IM where applicable
- compare RAM and I/O transactions
- compare total T-state count using fixture cycle length
- do not yet require undocumented F bits X/Y
- do not yet require WZ / P / Q internal states

## Oracle sample

23 representative BASE opcodes were checked, 1000 cases each:

07 09 22 27 2A 2F 3F
C0 C4 C6 C7 CE
D3 D6 DB DE
E3 E6 EE
F1 F5 F6 FE

Total: **23,000 cases**

Final result: **23,000 / 23,000 PASS** under the PHASE 1E comparison policy.

## DAA finding

The first DAA implementation passed normal BCD examples but failed 174 / 1000 randomized oracle cases.

Root cause:

The subtraction-path correction amount was selected only from old H/C. Real Z80 behavior for arbitrary input states also depends on the current upper/lower digit values; N selects whether the chosen correction is added or subtracted.

After changing correction selection to:

- add/subtract 06h when old H is set or low digit > 9
- add/subtract 60h when old C is set or A > 99h
- N chooses add versus subtract

DAA reached **1000 / 1000** on the independent oracle.

This is also consistent with the correction cases in the Zilog DAA table.

## Explicit accuracy boundary

PHASE 1E does not claim:

- exact undocumented X/Y flag behavior
- WZ behavior
- Q/P internal-state behavior
- prefix-family execution
- interrupt acceptance
- pin-perfect bus timing

Those are scheduled later rather than guessed.
