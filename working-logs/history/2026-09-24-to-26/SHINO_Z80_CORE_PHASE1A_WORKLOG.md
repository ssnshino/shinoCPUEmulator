# SHINO Z80 CORE PHASE 1A WORKLOG

Created: 2026-09-24T16:58:00+09:00

## Research

Verified against Zilog UM0080:

- LD r,r' encoding/timing
- LD r,n
- LD (HL),r
- LD (HL),n
- LD dd,nn and low-byte-first immediate order
- BC/DE indirect accumulator load/store
- absolute (nn) accumulator load/store

Reviewed SingleStepTests/z80 format and license for later oracle integration.

## Implementation

Added:

- `src/cpu/z80/z80-decoder.js`
- descriptor-based BASE opcode decoding
- operand byte/word fetch helpers
- register 8-bit helpers
- BC/DE/HL/SP pair helpers
- memory data read/write helpers
- LD execution subset
- dynamic last-instruction metadata
- one-page decoder embedding
- visible teaching program

## QA

Local Node suite PASS:

- NOP regression
- 7 LD r,n forms
- 49 register-register combinations
- 4 LD dd,nn pairs
- (HL) forms
- BC/DE indirect
- absolute (nn)
- flags unchanged
- R increments only per opcode fetch
- PC/T-state totals

Exact GitHub source blobs were also executed directly in V8:

Final teaching-program state:

- A = 41h
- B = 22h
- C = 41h
- HL = 0080h
- DE = 0090h
- [0080h] = 41h
- [0090h] = 41h
- F = A5h unchanged
- PC = 0011h
- R = 09h
- T = 72

Exact generated GitHub artifact:
- 4 inline scripts parsed PASS
- no external runtime dependency

Local Chromium teaching smoke PASS:
- STEP through first 5 instructions
- LAST mnemonic updates
- PC=0009h
- T=38 after fifth instruction
- zero page errors

## Scope discipline

HALT remains unimplemented even though 76h is decoded.

No ALU/prefix/interrupt implementation was mixed into this phase.


## Mobile More menu fix (2026-09-24T17:56:00+09:00)

Human real-device feedback found that the compact toolbar `…` button appeared inert on iPhone Edge external-file execution.

Root cause:
- the More action used browser `prompt()`
- prompt-style modal UI is not a reliable control surface for local-file mobile browser execution
- it also violates the project's modern in-page shell direction

Fix:
- removed `prompt()`
- added an in-page responsive More sheet
- compact/mobile: bottom sheet
- wider layout: top-right control panel
- actions: PACE / BURST ×256 / CLEAR TRACE / RESET CPU
- backdrop tap / close button / Escape close the sheet
- safe-area padding and reduced-motion support included

Regression:
- deploy artifact test rejects `prompt()`
- Chromium smoke opens the More sheet, changes pace, and resets CPU

## Human real-device confirmation (2026-09-24T18:03:00+09:00)

Human confirmed on smartphone:
- STEP visibly updates register LEDs and values
- A=41h / B=22h / C=41h sequence observed
- corrected in-page More sheet opens successfully

PHASE 1A mobile review: **PASS**.
