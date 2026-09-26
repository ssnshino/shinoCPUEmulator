# PHASE 1J — instruction-level CPU completion candidate

Created: 2026-09-26T09:10:24+09:00

## Meaning of complete

All instruction families, documented/undocumented F bits, instruction-boundary
interrupt dispatch, and total T-states are implemented. WZ/P/Q are compared in
the pinned external fixtures. This closes the functional CPU milestone, NOT
pin-level or transistor-level equivalence. Human review/merge is pending.

## Interrupt input API

- `cpu.setINT(asserted, data=255)`: level-sensitive normalized input. `true`
  means asserted, despite the physical pin being active-low. A held request
  can re-enter after EI + one instruction. Data supplies the IM0 opcode or IM2
  vector low byte; IM1 ignores it. Host must deassert when its source clears.
- `cpu.setNMI(asserted)`: edge latch. Holding true does not retrigger. A
  false→true→false pulse between `step()` calls is retained.
- `cpu.pulseNMI()`: latch one request. Multiple unserviced pulses coalesce.
- `step()` accepts pending NMI before INT, before HALT refresh. INT requires
  IFF1 and zero EI inhibit. NMI preserves IFF2 and is not masked by EI delay.
- Raw `state.nmiLine` changes are sampled at step boundaries only. Prefer the
  API for pulses. Reset clears line/latch/internal state; this is a host API
  convention, not a model of external electrical circuitry surviving reset.

NMI takes 11T, clears IFF1, pushes the next PC and jumps to 0066h. IM1 takes
13T, clears both IFFs and jumps to 0038h. IM2 takes 19T, stacks PC before
reading a little-endian vector at `(I<<8)|data`; odd vector bytes and FFFFh
word wrapping are retained. Every acknowledge increments R low seven bits
once and preserves R bit 7. HALT exits only on an accepted interrupt.

IM0 injects its first opcode without fetching it from RAM or incrementing PC.
Subsequent bytes come from memory; all decoder families remain usable. Timing
is ordinary instruction +2T. No automatic push for NOP/JP; RST/CALL perform
their own stack operation. IM0 instructions count as retired instructions;
NMI/IM1/IM2 dispatch and HALT refresh do not. Every step still consumes virtual
T-states, so the existing pacing engine can run handlers without special UI code.

RETN and RETI restore IFF1 from IFF2. Only ED4D emits the `RETI` return event.
That event marks the instruction boundary, not the exact pin decoding time.
The Bus exposes INT acknowledge separately from ordinary I/O read, with
M1+IORQ. NMI performs an ignored M1 memory read, followed by refresh and stack
writes. Neither IRQ vector reads nor stack writes bypass the Bus/ROM policy.

## Flags and internal state

Full eight-bit F and alternate AF are now compared. Arithmetic/logic/rotate
X/Y follow result (high result for 16-bit operations), CP follows its operand.
BIT register uses operand; BIT (HL) uses WZ high byte; indexed BIT uses the
effective address. Block operations apply their special X/Y formulas, including
PC-derived X/Y on repeat iterations. Existing repeat I/O H/PV rules remain.

Q stores F after a flag-writing instruction, zero otherwise (including POP AF
and EX AF,AF'). SCF/CCF use previous Q; ignored DD/FD prefixes clear that history.
WZ transitions cover data addresses, flow, arithmetic, indexed addressing and
block operations. P marks LD A,I / LD A,R for the NMOS interrupted-P/V behavior.
An accepted INT immediately after those instructions clears P/V; NMI does not.

## Verification contract

`scripts/check-z80-oracle.cjs FAMILY CACHE OUTPUT [full|documented]` defaults
to `full`: F=FF, AF'=FFFF, WZ/P/Q plus all existing architectural state, RAM,
ports and total cycles. `documented` preserves the historical D7 comparison.
The fixture source revision is pinned; each file and each implementation source
has a SHA-256 in the report. Fixtures live outside Git. Seven family reports
contain per-opcode counts; unique baseline is 1,604,000 cases, not the sum of
all historical reruns. ED has 80 fixture encodings (78 active +2 unused NOP),
not 256 external test files. The other 176 unused ED slots retain local tests.

Interrupt dispatch is NOT tested by that single-step dataset. The independent
PHASE1J suite exercises inputs, priority, EI/DI/HALT, nesting, return aliases,
all 256 first-byte IM0 values, vector/stack overlap and wrap, ROM rejection,
R/timing/bus ordering, reset, and history-dependent Q/WZ sequences.

## Explicit remaining accuracy limits

- No WAIT/BUSRQ/BUSACK arbitration or per-pin/half-cycle scheduling.
- No electrical edge races, interrupt arrival partway through an instruction,
  or manufacturer-specific variants. Boundary input is the API contract.
- No multi-byte device-supplied IM0 stream. Only acknowledge byte is external.
- No peripheral daisy-chain controller; RETI is observable for future devices.
- Bus events are M-cycle abstract, not fixture waveform equivalence.
- All-address-space endless prefixes trigger the existing host safety guard.
- No claim that one-step coverage proves every possible program sequence.

## References

- [Zilog UM008011-0816](https://www.zilog.com/docs/z80/um0080.pdf), interrupts/timing.
- [Sean Young, Undocumented Z80](https://datasheets.chipdb.org/Zilog/Z80/z80-documented-0.90.pdf), interrupt tests and flags.
- [David Banks hardware findings](https://github.com/hoglet67/Z80Decoder/wiki/Undocumented-Flags), block flags and Q/prefix behavior.
- [EI/NMI investigation](https://github.com/hoglet67/Z80Decoder/wiki/NMI-during-EI-Anomaly).
- [MEMPTR hardware experiments](https://gist.github.com/drhelius/8497817) and
  [updated WZ table](https://github.com/redcode/Z80/wiki/MEMPTR).
- [SingleStepTests/z80](https://github.com/SingleStepTests/z80/tree/ebe1875d48f374bcfd4b505d8eb8ee751568b5f7), fixture data only.

## Update History

- 2026-09-26T09:10:24+09:00 — Functional completion candidate and precision boundary documented.
