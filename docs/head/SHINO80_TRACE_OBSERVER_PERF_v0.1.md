# Trace / observer performance candidate

2026-09-26 JST. Parent REALTIME 3f4f90d / PR #20.

## Changes

Bus retention is a fixed-capacity ring, replacing per-event array push/splice.
Every emitted record is still a fresh object with the same payload, monotonic
sequence and virtual T-state. No event pooling, trace disabling, CPU fast path
or firmware shortcut. CPU, ROM, CG-ROM and 8 ms pacing budget are unchanged.

`bus.trace` now returns a chronological Array snapshot of retained references.
It supports existing read-only map/some/find/at/slice/iteration consumers.
Mutating this array does not alter Bus storage; use `clearTrace()` instead.
Snapshots are shallow: treat individual records as read-only, as before.
`traceCount` reads retained count without materializing an Array.
`traceLimit` accepts nonnegative integers; resizing keeps the newest entries,
zero retains none but still emits/returns records and increments sequence.
Clearing releases retained references and does not reset sequence.

Heavy CPU register/lamp updates run only on CPU/Bus views as appropriate.
Hidden Bus lists do not rebuild; the expanded visible trace panel still does.
CRT paint runs only on DISPLAY; the side inspector updates only at noncompact
widths. Pane changes/resize request a fresh render from current machine state.
Status information remains current. Memory already had a hidden-view guard
before this change; it was not the source of the measured hidden DOM work.

## Verification contract

Ring tests cover zero/one/wrap, clear, resize, snapshot lifetime, debug isolation
and exact event/state/RAM equivalence against legacy retention for a real
30,000-instruction IPL + keyboard + MON dump stream, including ROM protection.
Full existing regression remains required; no external oracle rerun claimed.

Browser performance uses frozen parent HTML versus generated candidate, same
Chrome/viewport, 1 s warmup then 2 s sampling, alternating versions. Execution
MHz is actual T-state delta / elapsed host time, not label text. These desktop
measurements do not predict iPhone performance. See worklog for samples.

## Update History

- 2026-09-26 — storage/observer optimization candidate and API contract.
