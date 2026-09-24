# CURRENT SNAPSHOT
## ONE-PAGE Z80 COMPUTER / SHINO-80

Last updated: 2026-09-24T17:18:00+09:00

## Reviewed main baseline

- Repository: `ssnshino/shinoCPUEmulator`
- Default branch: `main`
- UI Design Standard v0.1 / PR #3: MERGED
- SHINO-80 v0.0.2 UI FOUNDATION / PR #4: MERGED / Human smartphone PASS
- Source/deploy split / PR #5: MERGED
- PR #5 merge commit: `dd9443761155630f33749708a7b95f32ca195468`

## Active candidate

- Branch: `feature/z80-phase1a-instruction-architecture-20260924`
- Candidate: **SHINO Z80 CORE v0.0.3 — PHASE 1A**
- Scope: Instruction Architecture + first LD family
- Artifact: `deploy/one_page_shino80_v0.0.3_z80_phase1a.html`
- Automated Node QA: PASS
- Exact GitHub blob semantic execution: PASS
- Local Chromium teaching-program smoke: PASS
- Human real-device review: PENDING

## CPU architecture change

The previous hard-coded NOP switch is replaced by:

```text
opcode fetch
    ↓
z80-decoder.js
    ↓ instruction descriptor
z80-core.js
    ↓
operand/register/memory execution
```

The decoder is deliberately Z80-specific.

## Current executable BASE encodings

- NOP: 1
- LD: 81
- total executable: **82**

HALT 76h is recognized but deliberately remains unimplemented.

## Implemented LD groups

- `LD r,r'`
- `LD r,n`
- `LD dd,nn`
- `LD r,(HL)`
- `LD (HL),r`
- `LD (HL),n`
- `LD A,(BC)`
- `LD A,(DE)`
- `LD (BC),A`
- `LD (DE),A`
- `LD A,(nn)`
- `LD (nn),A`

All preserve F.

## Teaching program

```asm
LD A,41h
LD B,22h
LD HL,0080h
LD (HL),A
LD C,(HL)
LD DE,0090h
LD (DE),A
LD A,(0090h)
NOP
```

Final verified state after 9 instructions:

- A = 41h
- B = 22h
- C = 41h
- HL = 0080h
- DE = 0090h
- [0080h] = 41h
- [0090h] = 41h
- PC = 0011h
- R = 09h
- T = 72

## Accuracy boundary

- instruction functional: current LD subset PASS
- flags: preserved only; ALU flag engine not implemented
- timing: documented totals for current LD subset
- bus: `M_CYCLE_ABSTRACT`
- cycle-perfect: NO

## Next likely gate

Human inspects v0.0.3.

Then next implementation candidate should be deliberately chosen:

- INC / DEC + first Flags engine
- or basic control flow after review

Do not mix prefixes/interrupts into PHASE 1A.


## Human mobile feedback — More menu

Human confirmed PHASE 1A register activity on smartphone via STEP.

Issue found:
- compact toolbar `…` button appeared inert
- RESET / BURST / CLEAR TRACE were implemented through browser `prompt()`

Fix in current candidate:
- `prompt()` removed
- in-page More sheet added
- actions: PACE / BURST ×256 / CLEAR TRACE / RESET CPU
- compact layout uses bottom-sheet presentation
- larger layouts use top-right control panel
- safe-area / reduced-motion included
- artifact test now rejects browser `prompt()`
- Chromium smoke covers opening More, changing pace, and RESET

Human retry of the corrected More sheet: **PASS**.


## PHASE 1A Human status

Smartphone STEP/register observation and corrected More sheet are both confirmed PASS.
