# PHASE 1I — indexed CB execution candidate

2026-09-26 JST. Parent e01d5ed / PR #24. Source src/, generated artifact deploy/.

DD CB d op and FD CB d op now execute all 256 final-byte encodings per family.
The signed displacement selects memory at IX/IY+d with 16-bit wrapping.
Rotate/shift (including SLL), RES and SET write the computed memory result;
target codes other than6 additionally copy it into real B/C/D/E/H/L/A.
The copy still occurs when Bus ROM protection rejects the memory write.
BIT does not write memory or registers for any of its eight target-code aliases.
Neither index register changes when H/L is the copy destination.

## Fetch / timing

For one index prefix, two M1 fetches at +0/+4 advance R twice, preserving its
high bit. Displacement at +8 and final opcode at +11 use ordinary memory
reads, not M1 or refresh. Final opcode is visible as OPCODE_READ in the trace.
Memory operand read is at +15; modifying forms write at +19 in the abstract
Bus model. BIT takes20 T-states, other forms23. Extra DD/FD prefixes add4
each and last index wins. The whole sequence retires once and consumes one
EI-delay boundary, even when the final opcode happens to be FB.

## Flags / scope

Reuse verified CB arithmetic helpers. Compare S/Z/H/PV/N/C with D7; RES/SET
preserve full F. X/Y retention remains approximate, including indexed BIT
address-derived bits, and is excluded along with WZ/P/Q and pin waveforms.
This completes executable instruction families under the staged policy, not
full silicon compatibility. PHASE1J interrupt dispatch and precision remain
open. The inherited 65,536-prefix host-safety guard also remains.

## Evidence / reproduction

- Zilog UM008011-0816: https://www.zilog.com/docs/z80/um0080.pdf
- Sean Young v0.90, indexed-CB copies/BIT aliases:
  https://datasheets.chipdb.org/Zilog/Z80/z80-documented-0.90.pdf
- SingleStepTests/z80 MIT, pinned ebe1875d48f374bcfd4b505d8eb8ee751568b5f7:
  https://github.com/SingleStepTests/z80/tree/ebe1875d48f374bcfd4b505d8eb8ee751568b5f7

No third-party implementation or raw fixture files committed. The runner
maps ddcb/fdcb to upstream filenames dd cb __ XX / fd cb __ XX. The __ is
a displacement placeholder, not a fixed displacement; case RAM supplies it.

```sh
npm run test:phase1i
npm test
node scripts/check-z80-oracle.cjs ddcb /absolute/cache/v1 /absolute/ddcb.json
node scripts/check-z80-oracle.cjs fdcb /absolute/cache/v1 /absolute/fdcb.json
```

Also run base/cb/ed/dd/fd. Canonical per-opcode results and source/fixture
hashes: code/head/SHINO_Z80_PHASE1I_*_QA.json. Current external baseline:
BASE252k + CB256k + ED80k + DD252k + FD252k + DDCB256k + FDCB256k =
1,604,000 unique cases. ED80 includes two unused NOP slots; the remaining
unused ED slots and redundant-prefix combinations have unit coverage only.
Do not double-count previous or repeated runs as new unique cases.

## Update History

- 2026-09-26 — Indexed CB execution and external verification complete as candidate.
