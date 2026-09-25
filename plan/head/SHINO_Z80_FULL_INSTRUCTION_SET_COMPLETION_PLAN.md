# SHINO Z80 — FULL INSTRUCTION SET COMPLETION PLAN

Created: 2026-09-24T23:55:00+09:00

## Goal

Complete the Z80 instruction set as a real executable CPU core, not merely a mnemonic decoder.

Accuracy ladder remains:

1. functional instruction semantics
2. documented flags / interrupt semantics
3. documented total T-states
4. bus-cycle visibility
5. cycle-sensitive hardware behavior

## Completion sequence

### PHASE 1E — BASE COMPLETE
Status: candidate complete

- all 256 BASE slots decode
- 252 non-prefix opcodes execute
- CB / DD / ED / FD recognized as prefix entry points
- general ALU
- 16-bit arithmetic
- exchange
- conditional JP/CALL/RET
- PUSH/POP/RST
- immediate IN/OUT
- HALT
- DI/EI functional state

### PHASE 1F — CB COMPLETE

2026-09-26: implemented/verified candidate on feature/shino80-z80-cb-20260926.
CB 256,000/256,000 and BASE recheck 252,000/252,000 PASS; see
SHINO_Z80_PHASE1F_CB_PLAN.md and SHINO_Z80_PHASE1F_CB_WORKLOG.md.
Review/merge pending. Completion applies to documented-state comparison;
PHASE 1J precision/interrupt scope is not implied complete.

Implement all 256 CB second-byte encodings:

- RLC / RRC / RL / RR
- SLA / SRA / SLL / SRL
- BIT
- RES
- SET
- register and (HL) forms

### PHASE 1G — ED COMPLETE

2026-09-26: implemented/verified candidate on feature/shino80-z80-ed-20260926,
parent 42d04f7 / PR #22. ED 80,000 + BASE/CB 508,000 external cases PASS.
78 active encodings, 178 unused NOP slots; only 80 ED slots have external
fixtures (includes ED77/7F). See PHASE1G_ED plan/spec/worklog. Review pending.
Next PHASE 1H. Interrupt dispatch and full precision remain PHASE 1J.

Implement defined ED-family instructions:

- IN r,(C) / OUT (C),r
- ADC HL,ss / SBC HL,ss
- LD (nn),ss / LD ss,(nn)
- NEG
- RETN / RETI
- IM 0 / 1 / 2
- LD I,A / LD R,A / LD A,I / LD A,R
- RRD / RLD
- block transfer/search/I/O families

Undefined ED encodings will be researched and classified separately.

### PHASE 1H — DD / FD COMPLETE

2026-09-26: verified candidate feature/shino80-z80-index-20260926 on bb0daeb /
PR #23. DD/FD 252 terminal encodings each, external 504k PASS; BASE/CB/ED
588k regression PASS. Prefix controls tested separately, indexed CB excluded.
See PHASE1H_INDEX plan/spec/worklog. Human review/merge pending; next PHASE1I.

Implement IX/IY substitution rules and displacement forms.

Do not blindly substitute H/L in encodings where Z80 semantics differ.

### PHASE 1I — DDCB / FDCB COMPLETE

2026-09-26: candidate feature/shino80-z80-indexed-cb-20260926 on e01d5ed /
PR #24. DDCB/FDCB256 each; new512k external plus prior1,092k PASS. See
PHASE1I_INDEXED_CB plan/spec/worklog. Instruction families execute under D7;
full CPU accuracy/interrupts are NOT complete. Next PHASE1J. Review pending.

Implement indexed bit/rotate families including the register-copy forms.

### PHASE 1J — INTERRUPT + ACCURACY CLOSEOUT

- NMI
- INT
- EI one-instruction inhibit
- HALT exit
- IM0 / IM1 / IM2
- R refresh behavior under prefixes/interrupts
- undocumented X/Y
- WZ and other internal-state behavior where useful
- oracle comparison expansion
- bus precision upgrades

## Primary references

- Zilog Z80 CPU User Manual UM0080
- SingleStepTests/z80 as an independent test oracle

SingleStepTests is used as a test dataset, not copied as emulator implementation code.
