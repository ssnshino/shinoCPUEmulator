# SHINO Z80 CORE v0.0.5 — PHASE 1C SPEC

Created: 2026-09-24T20:12:00+09:00
Status: CANDIDATE SPEC

## Decoder additions

Added executable BASE encodings:

- 10h DJNZ e
- 18h JR e
- 20h JR NZ,e
- 28h JR Z,e
- 30h JR NC,e
- 38h JR C,e
- C3h JP nn

Added: **7 encodings**

Previous executable BASE encodings: 98

Current executable BASE encodings: **105**

## Dynamic execution result

`executeDescriptor()` may now return execution metadata rather than only a mnemonic.

```text
mnemonic
tStates
branchTaken
branchTarget
fallThrough
condition
```

This allows conditional timing without duplicating the decoder.

## PC rules

### JP nn

PC is loaded directly from the little-endian immediate address.

### JR

The signed displacement is added to PC after reading the displacement byte.

### DJNZ

B is decremented first.

If B != 0, relative branch is taken.

F is unchanged.

## UI

Artifact:

`deploy/one_page_shino80_v0.0.5_z80_phase1c.html`

CPU Inspector adds a Flow line for branch instructions.

Examples:

```text
Flow  TAKEN -> 0004h
Flow  NOT TAKEN -> 000Ch
```

## Timing

- JP nn: 10T
- JR e: 12T
- JR cc taken: 12T
- JR cc not taken: 7T
- DJNZ taken: 13T
- DJNZ not taken: 8T

## Accuracy

Flags are decision inputs for JR cc but are not modified by these control-flow instructions.

Bus remains M_CYCLE_ABSTRACT.
