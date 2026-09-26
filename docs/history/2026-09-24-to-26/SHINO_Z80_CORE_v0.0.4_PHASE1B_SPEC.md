# SHINO Z80 CORE v0.0.4 — PHASE 1B SPEC

Created: 2026-09-24T18:18:00+09:00
Status: CANDIDATE SPEC

## New component

`src/cpu/z80/z80-flags.js`

Exports:
- FLAG_BITS
- FLAG_MASK
- flagState()
- inc8()
- dec8()

## Decoder additions

Executable BASE encodings added:

- INC B/C/D/E/H/L/A: 7
- INC (HL): 1
- DEC B/C/D/E/H/L/A: 7
- DEC (HL): 1

Added executable encodings: **16**

Previous executable encodings: 82

Current executable BASE encodings: **98**

## Flags semantics

### INC

Updates:
- S
- Z
- H
- P/V
- N=0

Preserves:
- C
- Y/X by current PHASE 1B policy

### DEC

Updates:
- S
- Z
- H
- P/V
- N=1

Preserves:
- C
- Y/X by current PHASE 1B policy

## Timing

```text
INC r      4T
DEC r      4T
INC (HL)  11T
DEC (HL)  11T
```

Memory forms use read-modify-write bus observation.

## UI

Artifact:

`deploy/one_page_shino80_v0.0.4_z80_phase1b.html`

The existing CPU Debug Lab is reused.

No new FLAGS widget was invented; existing lamps now gain real semantics.

The default teaching program is changed to exercise visible flag transitions.

## Accuracy boundary

- documented INC/DEC flags: implemented
- undocumented Y/X: preserved, not claimed accurate
- timing totals: implemented for current forms
- bus: M_CYCLE_ABSTRACT
- cycle-perfect: no
