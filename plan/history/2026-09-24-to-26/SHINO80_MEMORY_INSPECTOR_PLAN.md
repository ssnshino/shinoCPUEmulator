# 64 KiB Memory Inspector

Date: 2026-09-26 JST
Base: f6444c6 (Keyboard / Monitor PR #17 merged)

Implement read-only pages spanning 0000h–FFFFh, 256 bytes per page,
hex address entry, previous/next, ASCII, region quick jumps, and Follow
PC/SP/HL/BIOS video cursor. Use 8 bytes per row on compact layouts and 16
on desktop. Show recent CPU fetch/read/write locations from existing trace.
Only debugPeek may read memory; observation must not generate bus traffic.

Scope: app, template, CSS, generated HTML, documentation. CPU/ROM unchanged.
Risk: form keys must not enter the machine keyboard FIFO. Page boundaries and
follow must not reset CPU state. Validate desktop/mobile, boundaries, invalid
addresses, follow, console, overflow, and existing regressions.

Commit one implementation after checks pass; leave merge for Human review.
