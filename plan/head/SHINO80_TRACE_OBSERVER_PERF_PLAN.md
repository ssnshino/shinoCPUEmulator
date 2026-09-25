# Trace storage / observer performance

2026-09-26 JST. Parent 3f4f90d / PR #20. Human iPhone speed improvement
confirmed, ~2.7 MHz observed; do not infer phone performance from desktop QA.
User approved profiling, hidden observer updates and ring-buffer optimization.

Scope: fixed-size Bus trace storage with ordered array snapshots; visible-only
heavy DOM updates. CPU/decoder/flags/BIOS/CG-ROM/pacing budgets unchanged.
Bus events keep content, sequence, timing, retention and ordering. Debug peek
remains side-effect free. Do not pool/reuse published event objects this phase.
Trace array mutations have no external consumers in src/tests; document getter
snapshot contract and use clearTrace for clearing. Test zero/one/wrap/resize.

Before/after: frozen standalone HTML in /tmp, same Chrome viewport, warmup,
repeat alternating comparisons. Measure execution MHz, CPU callback time and
hidden DOM mutations. Separate synthetic storage results from app performance.
Correctness: reference-array retention oracle, mixed real CPU/I/O/ROM events,
existing regression; UI pane switches must refresh current state immediately.
PC/mobile render and console checks, local-file run, reproducible artifact.
One logical commit after QA, push and stacked PR; no merges. Deliver new HTML.
