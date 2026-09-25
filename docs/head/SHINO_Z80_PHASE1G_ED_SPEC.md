# PHASE 1G — ED execution candidate

2026-09-26 JST. Extends BASE + CB; original BIOS, CG-ROM, Bus and pacing unchanged.

## Encoding classification

All 256 ED second-byte slots decode and retire. This is not 256 documented
instructions. There are 78 active slots: 58 canonical/documented encodings
(including ED63/6B duplicates of BASE loads), 18 NEG/RETN/IM aliases, and
2 undocumented I/O encodings (ED70 flag-only IN, ED71 NMOS OUT zero).
The other 178 slots are two-byte, 8-T-state unused NOPs. ED followed by CB,
DD, ED or FD is an unused ED slot, not a new nested prefix in this phase.

External oracle provides 80 ED files: 78 active plus unused ED77/7F.
The other 176 unused slots have unit coverage only. Never report 256,000
external ED cases or equate unused-NOP behavior with documented instructions.

## Execution

Two M1 fetches increment R twice; bit 7 is retained unless LD R,A replaces R.
An ED instruction retires once and consumes one EI-delay boundary. LD A,R
observes R after both fetches. LD A,I/R use IFF2 as PV. RETN and RETI pop PC
and copy IFF2 to IFF1; peripheral daisy-chain notification is not implemented.

Block operations perform one byte per step. Repeating forms rewind PC by two
while BC remains nonzero (transfer/search), with search additionally stopping
on match; block I/O repeats while B remains nonzero. Zero initial count wraps.
Continuing iterations take 21 T-states; terminal and non-repeating ones take
16. Scheduling is not a host-language loop that hides intermediate state.

All CPU memory and I/O traffic goes through Bus. Block input uses original BC
for its port; block output uses B after decrement. This is confirmed against
the pinned oracle ports. Sean Young v0.90 section 4.4 states the opposite
ordering; that conflicting sentence is not used as implementation evidence.

Timing: IN/OUT(C) 12; ADC/SBC HL 15; word memory loads 20; NEG/IM/unused 8;
RETN/RETI 14; I/R loads 9; RRD/RLD 18. The bus model remains abstract, not
pin-cycle-accurate. Byte/word/prefix addresses wrap at 16 bits; ROM guards apply.

## Flags and accuracy

Continue F/F' D7 comparison: S/Z/H/PV/N/C, not X/Y. 16-bit arithmetic uses full
16-bit sign/zero/overflow and bit-11 half-carry. RRD/RLD set S/Z/PV from A,
clear H/N and preserve C. Transfer preserves S/Z/C and sets PV from remaining
BC. Search preserves C with compare S/Z/H/N and remaining-BC PV.

Block I/O H/PV/N behavior includes extra repeat-cycle H/PV effects from the
hardware research below, because these bits are inside D7 even though Zilog
marks some of their behavior undefined. Existing X/Y retention remains an
approximation. WZ, P, Q, interrupt dispatch, LD A,I/R interrupt race, WAIT,
daisy-chain behavior and pin waveforms are still outside the verified scope.
No claim of full silicon accuracy or whole-Z80 completion is made.

## Evidence and reproduction

- Zilog UM008011-0816: https://www.zilog.com/docs/z80/um0080.pdf
- Sean Young, The Undocumented Z80 Documented v0.90 (original research,
  mirrored PDF): https://datasheets.chipdb.org/Zilog/Z80/z80-documented-0.90.pdf
- David Banks, repeat-cycle hardware findings:
  https://github.com/hoglet67/Z80Decoder/wiki/Undocumented-Flags
- SingleStepTests/z80, MIT (2024 SingleStepTests), pinned revision:
  https://github.com/SingleStepTests/z80/tree/ebe1875d48f374bcfd4b505d8eb8ee751568b5f7

No external implementation code or raw fixture data is vendored. The runner
accepts ed, cb or base. Its ED inventory is independent of the local decoder.

```sh
npm run test:phase1g
npm test
node scripts/check-z80-oracle.cjs ed /absolute/cache/v1 /absolute/ed-report.json
node scripts/check-z80-oracle.cjs base /absolute/cache/v1 /absolute/base-report.json
node scripts/check-z80-oracle.cjs cb /absolute/cache/v1 /absolute/cb-report.json
```

Per-opcode results and SHA-256 hashes: code/head/SHINO_Z80_PHASE1G_*_QA.json.
Current unique baseline: BASE 252,000 + CB 256,000 + ED 80,000 = 588,000.
Repeated runs are not added to unique coverage. Unit arithmetic/nibble counts
are independent and not counted as external oracle cases.

## Update History

- 2026-09-26 — ED candidate implemented and externally verified; next PHASE1H.
