# SHINO-80 host execution pace

Candidate — 2026-09-26 JST. Supersedes VISUAL / FAST / MAX.

- Default REALTIME: target 4,000,000 T-states per wall-clock second.
- VISUAL: previous slow observation behavior, including existing IPL/CLS batches.
- TURBO: no model-frequency cap; bounded host work per animation frame.
- Desktop PACE or compact More → PACE cycles REALTIME → TURBO → VISUAL.
- ACTUAL MHz is completed CPU T-states / elapsed host time, sampled about
  every 500 ms, also visible in More. Model clock is a target, not a claim of
  achieved speed. Initial/warmup, paused and hidden display zero.

Host controller calls ordinary CPU step; it never assigns virtual T-states,
skips ROM loops, or changes CPU/Bus/device behavior. Instruction overshoot is
carried to the next REALTIME frame. Each callback has an 8 ms work budget,
checked every 32 instructions, and a 100,000 instruction failsafe. These are
cooperative limits, not a hard wall-time guarantee. Slow hosts can miss 4 MHz.
REALTIME debt is capped at 100 ms; gaps over 250 ms rebase instead of catching
up. Pause, pace switch and visibility changes also rebase. Hidden pages do
not execute; visible return resumes only if the machine was still RUNNING.
No elapsed host-time debt is injected into virtual time after suspension.

Recent Bus events remain recorded with the existing 512-event retention.
Lamp sampling uses sequence numbers rather than array length, so a full trace
buffer no longer produces an empty activity sample. No trace event is invented
by observer peeks. No trace disabling or CPU fast path was introduced.

## Measured candidate evidence

Installed headless Chrome on Mac, 390x844 / 1440x1000, instrumented CPU prompt
writes: bottom-row newline took 1028.8 ms with the old 256 instructions/RAF
scheduler emulated, versus 154.8 ms compact REALTIME and 158.7 ms desktop
REALTIME. TURBO 158.8 ms. This is one sample per mode, not an iPhone benchmark.
The same BIOS performed the same copy. Measured idle execution was about
0.71–0.75 MHz, below target with full tracing and current implementation.
TURBO and REALTIME can have similar speed when the host work cap dominates.

Next optimization, if requested: profile CPU/Bus event allocation and observer
cost before changing trace/storage semantics. Do not claim full 4 MHz achieved.

## Update History

- 2026-09-26 — initial pacing candidate and performance limits recorded.
