# Z80 INSTRUCTION COVERAGE MATRIX v0.5

Created: 2026-09-24T23:55:00+09:00

## Summary

| Encoding space | Status |
| --- | --- |
| BASE non-prefix | ✅ **252 / 252 executable** |
| BASE prefix entry bytes | ✅ CB / DD / ED / FD recognized |
| CB second byte | ⬜ PHASE 1F |
| ED second byte | ⬜ PHASE 1G |
| DD / FD second byte | ⬜ PHASE 1H |
| DDCB / FDCB indexed-bit | ⬜ PHASE 1I |
| Interrupt acceptance / closeout | ⬜ PHASE 1J |

## BASE

Every first-byte value 00h-FFh now decodes.

The four prefix introducers are not standalone instructions; their second-byte families are the next implementation target.

See:
`research/z80/Z80_BASE_OPCODE_MATRIX_v0.5.md`

## Accuracy note

BASE COMPLETE means functional execution of all non-prefix BASE instructions with documented flags and total T-state counts.

It does not yet mean the entire Z80 instruction universe or undocumented electrical behavior is complete.
