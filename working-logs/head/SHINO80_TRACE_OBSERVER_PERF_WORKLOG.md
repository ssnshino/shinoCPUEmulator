# Trace / observer optimization worklog

2026-09-26 JST. Human authorized JS/storage optimization after iPhone reported
REALTIME around 2.2–2.7 MHz. Single writer, branch
perf/shino80-trace-observer-20260926 on 3f4f90d / PR #20. Predecessors unmerged.

Plan: SHINO80_TRACE_OBSERVER_PERF_PLAN.md; spec:
SHINO80_TRACE_OBSERVER_PERF_v0.1.md (respective head directories).

## Implementation

Fixed-size Bus ring, ordered trace Array snapshots, allocation-free count.
Retained record payload/order/timing unchanged; no pooling or lost events
beyond the existing retention bound. Hidden CPU/Bus DOM and CRT/inspector work
gated by view/layout. Corrected earlier explanation: MEM was already gated.
CPU/decoder/flags, BIOS/CG-ROM and pacing source unchanged.

## Performance evidence

Frozen parent /tmp/shino80-before-observer-perf.html versus new artifact.
Installed Chrome, same default REALTIME, 1 s warmup / 2 s sample per page;
alternating after/before/after/before/after, 390x900 and 1440x900.

| Width | Before MHz samples | After MHz samples |
|---|---|---|
| 390 | 0.6995, 0.7219 | 4.0094, 4.0063, 4.0058 |
| 1440 | 0.7082, 0.7527 | 3.9975, 3.9973, 4.0039 |

CPU callbacks before ~8.05 ms, after ~4.05–5.24 ms on these samples. Short-window
sampling around frame boundaries can show slightly above 4 MHz; target unchanged.
This is combined storage+observer improvement, not an isolated causal benchmark
for each edit. Earlier memory mutation counter showed zero both versions,
confirming its existing guard. Bus mutation recheck is recorded at closeout.

Sequential final recheck: hidden Bus rebuilds 126 → 0 per ~2 s at both widths;
before 0.7068/0.7354 MHz, after 4.0077/4.0060 MHz. Benchmark script:
/tmp/shino80-observer-bench.cjs. Repeated comparison reaches the target without
raising the CPU work budget or reducing trace retention.

## Correctness / QA

All package test stages executed directly with bundled Node (npm absent): NOP,
1A–1E, 2A/2A.1, BIOS, keyboard/MON, scheduler, new ring, syntax/build/artifact
PASS. New tests compare actual CPU state, memory and every retained event with
legacy storage at 100-instruction checkpoints through 30,000 instructions.
External oracle not rerun; CPU code unchanged.

Browser plugin not available; bundled Playwright + installed Chrome used.
Existing Python smoke adapted to enter BUS before reading its now-lazy DOM;
Python Playwright unavailable, Node flows used instead. Browser validation:
local standalone HTML and HTTP deployment artifact, PC/mobile identity,
nonblank/no overlay, console, input/edit/dump, pause/STEP/modes, visibility,
MEM navigation, pane refresh and trace clear. Final run results below.

Final /tmp/shino80-pace-browser.cjs sequential run PASS: 390x844 and 1440x1000,
REALTIME and TURBO. CPU view instruction count matches actual state after
switch, BUS view shows current IO_READ, More → CLEAR TRACE empties view/storage
without changing sequence. Console/page errors zero, no horizontal overflow,
screenshots visually inspected (/tmp/shino80-pace-mobile.png and desktop.png).
REALTIME bottom-row newline 29.7 ms mobile-width / 27.4 ms desktop-width;
TURBO 14.9 ms, sampled idle ACTUAL 8.54 MHz (one sample, not guaranteed).
Local-file benchmark self-contained execution also PASS. Final syntax/artifact,
build reproducibility and diff checks PASS.

Initial additional UI test tried the hidden desktop CLEAR TRACE control on
compact; corrected to the user-visible More → CLEAR TRACE route. An overlapping
browser benchmark was invalidated by visibility suspension; rerun sequentially.
Neither failed harness attempt is counted as performance evidence.

## Handoff

Mobile copy: SHINO80_OPTIMIZED_QA_20260926.html. Default REALTIME; try repeated
D 0100 Enter and inspect More → PACE actual MHz; TURBO is optional. iPhone
speed/thermal/energy behavior needs Human QA. Keep prior HTML for comparison.
Single commit rollback unit relative to 3f4f90d. Push stacked PR, no merge.

## Update History

- 2026-09-26 — implementation, equivalence regression and alternating benchmark.
