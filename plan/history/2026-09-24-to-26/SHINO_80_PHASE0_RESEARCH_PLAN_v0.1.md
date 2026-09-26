# SHINO-80 PHASE 0 — Z80 Research / Architecture Plan v0.1

Created: 2026-09-24T13:20:14+09:00
Status: **ACTIVE PLAN**
Implementation scope: **NO FULL CPU CORE YET**

---

## 1. Purpose

SHINO-80のZ80 Coreを推測や既存エミュレータの丸写しで始めず、一次資料・複数test methodology・明示的なArchitecture Decisionを揃えてからPHASE 1へ入る。

---

## 2. Research targets

### Z80 architecture

- register set
- flags
- alternate registers
- IX / IY
- SP / PC
- I / R
- IFF1 / IFF2
- HALT
- RESET
- INT / NMI
- IM 0 / IM 1 / IM 2

### instruction system

- base opcode table
- CB
- ED
- DD
- FD
- DD CB
- FD CB
- duplicate / undocumented encodings
- illegal/undocumented behavior policy

### timing

- T-state
- M-cycle
- M1
- memory read/write
- I/O read/write
- refresh
- WAIT interaction
- interrupt acknowledge

### edge behavior

- flags
- EI delay
- HALT exit
- R register
- interrupt priority / acceptance
- prefix interactions
- undocumented flags when relevant

---

## 3. Source priority

1. Zilog official documentation / primary material
2. reliable test suites derived from actual CPU/reference behavior
3. multiple independent emulator implementations
4. explanatory articles only as secondary aids

既存implementationとofficial docが食い違う場合は、差を記録して即決しない。

---

## 4. Test methodology research

Candidate suites / approaches:

- single-instruction state tests
- bus-cycle trace tests
- ZEXDOC / ZEXALL family
- z80test family
- focused handcrafted regression cases

調査項目:

- license
- data format
- browser/Nodeでのrunner実装可能性
- expected state coverage
- timing/bus coverage
- undocumented coverage
- actual hardware provenance

---

## 5. Architecture questions to close before PHASE 1

### CPU Core

- state object layout
- opcode decode structure
- prefix decode strategy
- flag helper strategy
- memory/bus access boundary
- cycle/timing representation
- interrupt input model
- debug peek boundary
- trace emission boundary

### SHINO-80 Machine

- CPU clock
- initial ROM size
- initial RAM size
- VRAM model
- initial memory map
- I/O port allocation
- interrupt structure
- timer model
- keyboard model
- first video mode
- first FDD abstraction level

---

## 6. Deliverables

Create/update:

- `research/z80/Z80_RESEARCH_REPORT_v0.1.md`
- `research/z80/Z80_INSTRUCTION_COVERAGE_MATRIX_v0.1.md`
- `research/z80/Z80_TEST_STRATEGY_v0.1.md`
- `docs/head/SHINO_80_ARCHITECTURE_DRAFT_v0.2.md` or promote to SPEC when justified
- `code/head/Z80_PHASE0_RESEARCH_QA.json`
- `working-logs/head/SHINO_80_PHASE0_RESEARCH_WORKLOG_v0.1.md`
- snapshot updates

---

## 7. Non-goals

PHASE 0ではまだやらない:

- complete Z80 implementation
- BIOS coding
- FDD implementation
- WebRTC
- Virtual Modem
- 6502 / 6809 / 68000
- Generic CPU plugin framework
- SHINO-DOS
- BASIC
- fancy motherboard builder
- cycle-perfect device emulation

---

## 8. PHASE 1 entry gate

以下が揃ったらPHASE 1開始可能:

- primary Z80 reference list fixed
- instruction/prefix map understood
- core state model agreed
- basic bus interface agreed
- timing representation agreed at Level 1/2 boundary
- interrupt strategy documented
- test harness strategy documented
- first MVP instruction subset defined
- SHINO-80 initial memory/I/O candidate sufficiently stable

---

## 9. First PHASE 1 milestone

最初のheartbeat:

```text
RESET
↓
fetch NOP from 0000
↓
execute
↓
PC advances
↓
timing advances
↓
trace is emitted
↓
Inspector can observe state without perturbing CPU execution
```

このmilestoneを「画面が出た」より先に置く。

---

## 10. Success criteria

- undocumented/uncertain behaviorを確定事項として扱っていない
- reference/licenseが記録されている
- test-first pathがある
- future CPU familyのための過剰抽象化を入れていない
- DebuggerとCPU execution boundaryが明示されている
- Bus visibilityを後付けにしない
- HumanがPHASE 1開始判断できる資料が揃う
