# PHASE 1H — DD/FD execution candidate

2026-09-26 JST. Parent bb0daeb / PR #23. Source remains modular src/.

## Scope

DD selects IX, FD selects IY. For each prefix, 252 non-prefix terminal
opcodes execute: 85 change operand semantics, 167 ignore the index selection
but still consume prefix fetch time. Four remaining terminal bytes are prefix
controls, not four additional ordinary instructions. Indexed CB is PHASE1I
and currently throws explicitly; it never falls through to normal CB.

Index pairs, their high/low halves, signed displacement reads/writes, stack,
indirect jump and SP transfers are supported. Register-only H/L operands use
index halves where applicable. With indexed memory, LD H/L,(index+d) and
LD (index+d),H/L use the real H/L. EX DE,HL, EXX and ED use real HL.
Implementation uses explicit index access, never temporarily swaps HL/index.

Repeated DD/FD prefixes select the last index, consuming 4 T-states and an R
increment each. DD/FD before ED are ignored semantically but still fetched.
R retains bit7; one complete instruction retires once, including EI-delay
handling. Prefixed EI retains its new one-instruction inhibit. HALT takes no
displacement. HALT follow-on cycles retain the existing 4-T behavior.

Displacements are signed bytes and effective addresses wrap at 16 bits.
All memory operations use Bus; debug views remain observers. Indexed memory
LD/ALU takes 19 T-states, INC/DEC 23; other affected instructions add the
prefix fetch to the corresponding BASE timing. Additional ignored prefixes
add 4 each. Abstract memory events remain visible, not pin-cycle accurate.

## Accuracy boundaries

F/F' mask D7, architectural registers, alternate pairs, I/R, IFF/IM/EI delay,
RAM, I/O and total T-states are checked. X/Y, WZ/P/Q and pin waveforms remain
excluded. Interrupt dispatch and indexed-CB are not implemented by this phase.
Repeated prefix combinations have focused unit coverage, not exhaustive
external-oracle coverage. ED block repeats rewind to ED, not to ignored DD/FD.

Host safety guard: a stream of 65,536 consecutive DD/FD prefix bytes raises an
explicit error rather than blocking the host forever. This is a simulator
limitation, not a hardware behavior claim; partial fetches are not rolled back.

## Sources / reproduction

- Zilog UM008011-0816: https://www.zilog.com/docs/z80/um0080.pdf
- Sean Young v0.90 index/prefix research:
  https://datasheets.chipdb.org/Zilog/Z80/z80-documented-0.90.pdf
- SingleStepTests/z80 (MIT) pinned ebe1875d48f374bcfd4b505d8eb8ee751568b5f7:
  https://github.com/SingleStepTests/z80/tree/ebe1875d48f374bcfd4b505d8eb8ee751568b5f7

Run npm run test:phase1h and npm test. External data is cached outside repo:

```sh
node scripts/check-z80-oracle.cjs dd /absolute/cache/v1 /absolute/dd.json
node scripts/check-z80-oracle.cjs fd /absolute/cache/v1 /absolute/fd.json
```

Also run base/cb/ed with the same runner. DD/FD inventory is 252 files each,
excluding CB/DD/ED/FD terminal bytes. DDCB/FDCB fixtures are not included.
Per-opcode results, fixture and source hashes: code/head/SHINO_Z80_PHASE1H_*_QA.json.
Unique tested baseline: 252k BASE + 256k CB + 80k ED + 252k DD + 252k FD =
1,092,000. Repeated runs and unit cases are not added to that unique count.

## Update History

- 2026-09-26 — DD/FD candidate implemented and verified; next indexed CB.
