# Z80 BASE OPCODE MATRIX v0.5

Status: PHASE 1E BASE COMPLETE candidate

Legend: ✅ executable now / → prefix family next

| | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | A | B | C | D | E | F |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0x | ✅ NOP | ✅ LD BC,nn | ✅ LD (BC),A | ✅ INC BC | ✅ INC B | ✅ DEC B | ✅ LD B,n | ✅ RLCA | ✅ EX AF,AF' | ✅ ADD HL,BC | ✅ LD A,(BC) | ✅ DEC BC | ✅ INC C | ✅ DEC C | ✅ LD C,n | ✅ RRCA |
| 1x | ✅ DJNZ e | ✅ LD DE,nn | ✅ LD (DE),A | ✅ INC DE | ✅ INC D | ✅ DEC D | ✅ LD D,n | ✅ RLA | ✅ JR e | ✅ ADD HL,DE | ✅ LD A,(DE) | ✅ DEC DE | ✅ INC E | ✅ DEC E | ✅ LD E,n | ✅ RRA |
| 2x | ✅ JR NZ,e | ✅ LD HL,nn | ✅ LD (nn),HL | ✅ INC HL | ✅ INC H | ✅ DEC H | ✅ LD H,n | ✅ DAA | ✅ JR Z,e | ✅ ADD HL,HL | ✅ LD HL,(nn) | ✅ DEC HL | ✅ INC L | ✅ DEC L | ✅ LD L,n | ✅ CPL |
| 3x | ✅ JR NC,e | ✅ LD SP,nn | ✅ LD (nn),A | ✅ INC SP | ✅ INC (HL) | ✅ DEC (HL) | ✅ LD (HL),n | ✅ SCF | ✅ JR C,e | ✅ ADD HL,SP | ✅ LD A,(nn) | ✅ DEC SP | ✅ INC A | ✅ DEC A | ✅ LD A,n | ✅ CCF |
| 4x | ✅ LD B,B | ✅ LD B,C | ✅ LD B,D | ✅ LD B,E | ✅ LD B,H | ✅ LD B,L | ✅ LD B,(HL) | ✅ LD B,A | ✅ LD C,B | ✅ LD C,C | ✅ LD C,D | ✅ LD C,E | ✅ LD C,H | ✅ LD C,L | ✅ LD C,(HL) | ✅ LD C,A |
| 5x | ✅ LD D,B | ✅ LD D,C | ✅ LD D,D | ✅ LD D,E | ✅ LD D,H | ✅ LD D,L | ✅ LD D,(HL) | ✅ LD D,A | ✅ LD E,B | ✅ LD E,C | ✅ LD E,D | ✅ LD E,E | ✅ LD E,H | ✅ LD E,L | ✅ LD E,(HL) | ✅ LD E,A |
| 6x | ✅ LD H,B | ✅ LD H,C | ✅ LD H,D | ✅ LD H,E | ✅ LD H,H | ✅ LD H,L | ✅ LD H,(HL) | ✅ LD H,A | ✅ LD L,B | ✅ LD L,C | ✅ LD L,D | ✅ LD L,E | ✅ LD L,H | ✅ LD L,L | ✅ LD L,(HL) | ✅ LD L,A |
| 7x | ✅ LD (HL),B | ✅ LD (HL),C | ✅ LD (HL),D | ✅ LD (HL),E | ✅ LD (HL),H | ✅ LD (HL),L | ✅ HALT | ✅ LD (HL),A | ✅ LD A,B | ✅ LD A,C | ✅ LD A,D | ✅ LD A,E | ✅ LD A,H | ✅ LD A,L | ✅ LD A,(HL) | ✅ LD A,A |
| 8x | ✅ ADD A,B | ✅ ADD A,C | ✅ ADD A,D | ✅ ADD A,E | ✅ ADD A,H | ✅ ADD A,L | ✅ ADD A,(HL) | ✅ ADD A,A | ✅ ADC A,B | ✅ ADC A,C | ✅ ADC A,D | ✅ ADC A,E | ✅ ADC A,H | ✅ ADC A,L | ✅ ADC A,(HL) | ✅ ADC A,A |
| 9x | ✅ SUB B | ✅ SUB C | ✅ SUB D | ✅ SUB E | ✅ SUB H | ✅ SUB L | ✅ SUB (HL) | ✅ SUB A | ✅ SBC A,B | ✅ SBC A,C | ✅ SBC A,D | ✅ SBC A,E | ✅ SBC A,H | ✅ SBC A,L | ✅ SBC A,(HL) | ✅ SBC A,A |
| Ax | ✅ AND B | ✅ AND C | ✅ AND D | ✅ AND E | ✅ AND H | ✅ AND L | ✅ AND (HL) | ✅ AND A | ✅ XOR B | ✅ XOR C | ✅ XOR D | ✅ XOR E | ✅ XOR H | ✅ XOR L | ✅ XOR (HL) | ✅ XOR A |
| Bx | ✅ OR B | ✅ OR C | ✅ OR D | ✅ OR E | ✅ OR H | ✅ OR L | ✅ OR (HL) | ✅ OR A | ✅ CP B | ✅ CP C | ✅ CP D | ✅ CP E | ✅ CP H | ✅ CP L | ✅ CP (HL) | ✅ CP A |
| Cx | ✅ RET NZ | ✅ POP BC | ✅ JP NZ,nn | ✅ JP nn | ✅ CALL NZ,nn | ✅ PUSH BC | ✅ ADD A,n | ✅ RST 00h | ✅ RET Z | ✅ RET | ✅ JP Z,nn | → PREFIX CB | ✅ CALL Z,nn | ✅ CALL nn | ✅ ADC A,n | ✅ RST 08h |
| Dx | ✅ RET NC | ✅ POP DE | ✅ JP NC,nn | ✅ OUT (n),A | ✅ CALL NC,nn | ✅ PUSH DE | ✅ SUB n | ✅ RST 10h | ✅ RET C | ✅ EXX | ✅ JP C,nn | ✅ IN A,(n) | ✅ CALL C,nn | → PREFIX DD | ✅ SBC A,n | ✅ RST 18h |
| Ex | ✅ RET PO | ✅ POP HL | ✅ JP PO,nn | ✅ EX (SP),HL | ✅ CALL PO,nn | ✅ PUSH HL | ✅ AND n | ✅ RST 20h | ✅ RET PE | ✅ JP (HL) | ✅ JP PE,nn | ✅ EX DE,HL | ✅ CALL PE,nn | → PREFIX ED | ✅ XOR n | ✅ RST 28h |
| Fx | ✅ RET P | ✅ POP AF | ✅ JP P,nn | ✅ DI | ✅ CALL P,nn | ✅ PUSH AF | ✅ OR n | ✅ RST 30h | ✅ RET M | ✅ LD SP,HL | ✅ JP M,nn | ✅ EI | ✅ CALL M,nn | → PREFIX FD | ✅ CP n | ✅ RST 38h |

## Count

- BASE non-prefix executable: **252 / 252**
- Prefix introducers recognized: **CB / DD / ED / FD**
- BASE decode slots covered: **256 / 256**
