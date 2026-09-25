# SHINO-80 execution pace improvement

2026-09-26 JST. Candidate on MON v0.2 6707ace / PR #19 (Human functional PASS,
scroll speed complaint). One writer, no main merge.

Goal: remove the 256 instructions/frame ceiling without bypassing Z80 BIOS.
Source: current RAF scheduler, cpu.state.tStates and Human approval of
VISUAL / REALTIME / TURBO. Default REALTIME targets 4,000,000 T-states/second;
VISUAL keeps observable stepping, TURBO uses a bounded host-time budget.
CPU/decoder/flags, Bus, BIOS and CG-ROM are out of scope.

Add testable host-side pacing controller; wall clock budgets execution only,
never edits virtual T-states or device state. Carry instruction overshoot,
bound catch-up and callback duration, rebase on pause/mode switch/visibility.
Show measured execution MHz separately from model clock, including in More.
Accuracy: instruction/T-state level; not cycle-perfect or guaranteed 4 MHz
on slow hardware. Background tabs suspend execution with no catch-up debt.

Risks: UI starvation, hidden-tab backlog, pause/reset races, trace observer
cost. Test deterministic budgets/overshoot/caps, machine state equivalence,
scroll timing, browser PC/mobile input and mode changes, hidden/resume, STEP,
full existing tests and reproducible build. Single commit after verification,
push feature/PR stacked on #19, hand off standalone HTML; no merge.
