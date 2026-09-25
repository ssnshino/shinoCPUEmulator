# Memory Inspector implementation — 2026-09-26

Branch: feature/shino80-memory-inspector-20260926
Base: f6444c6, PR #17 merged with Human approval.

Implemented all 64 KiB as 256-byte pages, direct hex entry (also 0x / h),
previous/next boundary controls, ASCII, ROM/BIOS/IPL/RAM/VRAM/work/stack
quick jumps, PC/SP/HL/video-cursor Follow, and latest retained CPU access
markers. Compact rows contain 8 bytes; desktop rows contain 16.
Reads use debugPeek and do not create CPU events. Form keys are excluded
from machine keyboard capture. Memory rows only render when MEM is visible.

Validation: Node regression scripts for NOP, PHASE 1A–1E, 2A, 2A.1,
BIOS, Keyboard, source and artifact passed. Real Chrome via bundled
Playwright (Browser plugin unavailable), 1440x900 and 390x844:
FFFF boundary, invalid-address feedback, BIOS C3 byte, SP Follow, 256 cells,
32 compact rows, no horizontal overflow, no extra Bus trace and no runtime
exceptions passed. Desktop reset SP is 0000; F000 is established by IPL.
Screenshots inspected. Human iPhone / Edge review PASS: 「いけたで」.

Next: review mobile artifact, then PR/merge. No BIOS or CPU changes in this branch.
