# SHINO-80 Technical Manual v0.1

Created: 2026-09-26T09:30:00+09:00
Parent: fa73816 / PR #26; source/CPU candidate remains unmerged.

## Goal / scope

An offline, single HTML online-manual candidate: searchable Z80 instruction
reference, clickable system concept diagram, memory/I/O maps, BIOS/MON guide,
actual CG-ROM glyph atlas and sources/accuracy boundaries. Japanese prose.
No CPU, firmware, workbench UI behavior, hardware or public deployment change.
Future FDD/display connector/serial/timer shown explicitly as unimplemented.

## Source / architecture

Read decoder for encoding inventory; core/flags and Zilog UM008011-0816 plus
hardware findings for semantics and exceptions. Generate deterministic inventory
from source decoder (all7 families; unused/alias/prefix distinctions), with
authored per-kind descriptions and flags; fail build for missing kind coverage.
All examples have executable bytes and measured before/after/T-state evidence
from CPU in an isolated bus, clearly labeled implementation examples, not an
independent oracle. Do not imply decoder-derived data independently proves CPU.
BIOS/video/keyboard constants and glyph bytes come from actual source modules.

## Design system / image blocker

frontend-app-builder Image Gen concept attempt failed with authentication401.
No external API fallback requested or used. Concrete deviation: no accepted
raster concept/fidelity claim; use the existing SHINO dark editorial shell and
code-native HTML/SVG, verified visually in browser. Tokens: navy #0d151c,
slate #141f29, border #2a3c49, white #e7eef4, muted #a5b6c4, cyan #6acbff,
mint #8fffae. System sans Japanese text; monospace encodings. No external assets.
Desktop header76px/rail220px, instruction list+detail; mobile stacked and
wrapping nav, touch targets44px. Diagram fits width with readable node labels,
text alternative and click-through details. Solid current edges/dashed future.
Sections: 機械語リファレンス / システム構成 / メモリ・I/O / BIOS・MON / CG-ROM / 資料・精度.
No marketing hero, invented claims, generated circuit board, electrical pinout.

## Risks / QA / acceptance

Correct word/displacement byte order, conditional/repeat timing, X/Y quirks,
unofficial index halves/SLL/BIT aliases/ED aliases, ignored-prefix behavior.
No fabricated display port: DIGITAL_MONO is a renderer contract, not a physical
DisplayPort interface. VRAM is part of RAM; CG-ROM is renderer-local, not CPU-
mapped. Debug reads do not cause emulated CPU bus activity. BIOS reserved
interrupt stubs are not production handlers; no disk functionality implied.
Coverage/inventory/flags/example/firmware consistency tests; deterministic
build; existing full package regression; Chrome desktop/mobile offline smoke,
search/filter/deep link/back navigation/diagram/glyph/input/console/overflow.
Browser plugin absent: use existing Playwright. No dependency installation.
One logical commit, push and stacked PR after PASS; no merge/public hosting.
Deliver standalone HTML and README/restart/worklog links.

## Completion evidence

Implementation and deterministic manual build complete. 1780 record invariants,
fixed/preserved flag agreement, independent fixtures and full package regression
PASS. Offline Chrome1440×1000/390×844 interaction and visual QA PASS, no network,
console errors or page overflow. See matching worklog/spec for detailed limits.
Real iPhone review and Human PR/merge approval remain; no public hosting.
