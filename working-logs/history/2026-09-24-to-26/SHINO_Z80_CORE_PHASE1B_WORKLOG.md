# SHINO Z80 CORE PHASE 1B WORKLOG

Created: 2026-09-24T18:18:00+09:00

## Research

Verified from Zilog UM0080:

- INC r: 4T and documented flags
- INC (HL): 11T (4,4,3)
- DEC r: 4T and documented flags
- DEC (HL): 11T (4,4,3)
- Carry is unaffected
- P/V boundary cases: 7Fh for INC and 80h for DEC

## Implementation

Added:
- `src/cpu/z80/z80-flags.js`
- INC/DEC decoder patterns
- register INC/DEC execution
- memory INC/DEC read-modify-write
- v0.0.4 teaching program
- PHASE 1B self-test

## Exact blob verification

Verified:

```text
INC 7F -> 80   F=95h with old C=1
INC FF -> 00   F=51h with old C=1
DEC 80 -> 7F   F=17h with old C=1
DEC 00 -> FF   F=93h with old C=1
```

Memory:

```text
INC (HL)
T+0 FETCH
T+2 REFRESH
T+4 READ
T+8 WRITE
total 11T
```

## Undocumented bits

Y/X are preserved in this phase rather than guessed.

## Regression

PHASE 1A LD semantics remain part of the test suite.

Mobile More sheet remains in the same app shell and is included in browser regression.

## Human gate

Human should STEP through the teaching program and observe the FLAGS lamps changing.

Most useful steps:
- INC A after A=7Fh
- INC B after B=FFh
- DEC C after C=80h
- DEC D after D=00h
