# PHASE 1F CB execution candidate

2026-09-26 JST. Extends BASE without changing BIOS, CG-ROM, Bus or host pacing.

All 256 CB second-byte encodings execute: RLC/RRC/RL/RR/SLA/SRA/SLL/SRL,
BIT 0..7, RES 0..7, SET 0..7 on B/C/D/E/H/L/(HL)/A. Prefix CB is fetched
as M1, followed by a second M1 fetch at +4 T-states. R increments twice with
bit 7 preserved; PC wraps normally. Both bytes retire as one instruction and
consume only one EI inhibit step. lastInstruction.bytes holds both bytes.

Register forms take 8 T-states. BIT (HL) takes 12 with no write; other (HL)
forms take 15 with data read at +8 and write at +12 in the existing abstract
Bus model. ROM protection remains enforced by Bus. Pin waveforms/WAIT states
are not modeled accurately by this phase.

Rotate/shift result drives S/Z/PV/C; H/N clear. BIT preserves C, sets H, clears
N, uses Z/PV for a clear tested bit and S only for a set bit 7. RES/SET preserve
all flags. SLL shifts left with bit 0 set. Existing undocumented X/Y retention
policy remains an approximation, excluded from oracle comparison (F mask D7).
WZ and oracle P/Q internals remain excluded. BIT S/PV details and SLL are
validated with the independent oracle rather than overstating the manual.

## References

- Zilog UM008011-0816: https://www.zilog.com/docs/z80/um0080.pdf
- SingleStepTests/z80 (MIT, copyright 2024 SingleStepTests):
  https://github.com/SingleStepTests/z80/tree/ebe1875d48f374bcfd4b505d8eb8ee751568b5f7
- Data v1/*.json is cached outside the repo, not vendored. Oracle data is not
  copied as implementation. Summary records fixture and source SHA-256 values.

## Reproduce

Run npm test with Node/npm available (this host ran script stages directly
using bundled Node because npm is absent). External checks, network on first
run, cache and output paths must be explicitly provided:

```sh
node scripts/check-z80-oracle.cjs cb /absolute/cache/v1 /absolute/output/cb.json
node scripts/check-z80-oracle.cjs base /absolute/cache/v1 /absolute/output/base.json
```

Checks architectural registers, alternate pairs, F/F' masked D7, PC/SP, I/R,
IFF1/2, IM, EI delay, final RAM, unexpected RAM writes, I/O transactions and
total T-states. Reports every opcode and up to 30 detailed failures, continues
other cases, exits nonzero on failures. No pin-waveform equivalence claim.

## Next / not implemented

PHASE 1G ED, then DD/FD, indexed CB, then interrupt/precision closeout.
MON expansion is paused. This is not a fully completed Z80 or an OS-ready claim.

## Update History

- 2026-09-26 — CB candidate implemented and externally verified.
