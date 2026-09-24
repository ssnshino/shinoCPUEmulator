# SHINO Z80 CORE PHASE 1A — Instruction Architecture Plan

Created: 2026-09-24T16:58:00+09:00
Status: IMPLEMENTED CANDIDATE
Candidate version: v0.0.3

## Purpose

Move SHINO Z80 CORE from one hard-coded NOP switch to the first reusable instruction architecture.

## Architecture

```text
fetch opcode
    ↓
z80-decoder.js
    ↓ descriptor
z80-core.js
    ↓
operand fetch / register / memory execution
    ↓
Bus trace + state
```

## Implemented families

- NOP regression
- LD r,r'
- LD r,n
- LD dd,nn
- LD r,(HL)
- LD (HL),r
- LD (HL),n
- LD A,(BC)
- LD A,(DE)
- LD (BC),A
- LD (DE),A
- LD A,(nn)
- LD (nn),A

## Design rules

- decoder understands opcode shape; core owns execution state
- CPU code remains independent of DOM/UI
- immediate operand reads do not increment R
- load instructions in this phase do not modify F
- unsupported opcodes fault instead of silently acting as NOP
- HALT is decoded but not implemented yet
- little-endian operand order is explicit

## QA

- NOP regression
- all 7 LD r,n forms
- all 49 pure register-register matrix forms
- all 4 LD dd,nn pairs
- HL memory read/write/immediate cases
- BC/DE indirect cases
- absolute (nn) cases
- flags unchanged
- R behavior
- PC / T-state totals
- exact GitHub blob semantic execution
- one-page inline script syntax
- Chromium teaching-program smoke

## Teaching program

The one-page artifact boots with:

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

STEP therefore produces visible register and memory changes before falling into zero-filled NOP memory.

## Non-goals

No ALU, control flow, prefix or interrupt expansion in this PR.
