# LAST RUN
## ONE-PAGE Z80 COMPUTER / SHINO-80

Updated: 2026-09-24T18:22:00+09:00

## Task

Implement PHASE 1B: INC / DEC + first real FLAGS ENGINE.

## Research basis

Zilog UM0080 verified:
- INC r 4T
- INC (HL) 11T
- DEC r 4T
- DEC (HL) 11T
- documented S/Z/H/PV/N behavior
- C unaffected

## Implementation

Added:
- `src/cpu/z80/z80-flags.js`
- INC/DEC decoder patterns
- register INC/DEC
- (HL) read-modify-write INC/DEC
- v0.0.4 teaching program

## Exact semantic result

With previous C=1:

```text
INC 7F -> 80  F=95
INC FF -> 00  F=51
DEC 80 -> 7F  F=17
DEC 00 -> FF  F=93
```

Memory INC (HL):

```text
T+0 FETCH
T+2 REFRESH
T+4 READ
T+8 WRITE
total 11T
```

## Accuracy

- documented flags: implemented
- C: preserved
- undocumented Y/X: deliberately preserved / not claimed accurate
- bus precision: M_CYCLE_ABSTRACT

## Next

Human real-device flags-lamp review.
