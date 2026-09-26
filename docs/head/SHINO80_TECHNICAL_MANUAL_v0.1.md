# SHINO-80 Technical Manual v0.1

Status: CURRENT / RELEASED
Updated: 2026-09-26 JST
Implementation baseline: `e75d8c0506a7b1bb711b54c352c8b04580cdddaf`

## Deliverable and authority

`deploy/shino80_technical_manual_v0.1.html` is the generated standalone manual.
It works offline without font, CDN or runtime network dependencies. It is also
published as an unlisted/noindex page by the Shinomiya Daihanten content
repository.

Authoring sources:

- `src/manual/`
- `scripts/build-technical-manual.cjs`

Build and verification:

```bash
pnpm run build:manual
pnpm run test:manual
```

Do not hand-edit the generated HTML. When CPU, firmware or devices change,
review authored prose, baseline labels, diagrams, examples and tests before
rebuilding.

## Current content

- searchable BASE252 / CB256 / ED256 / DD252 / FD252 / DDCB256 / FDCB256:
  1,780 encodings including aliases, unused ED slots and ignored-prefix forms
- byte patterns, lengths, timings, flags, X/Y behavior and execution examples
- logical system wiring diagram and memory/I/O maps
- ROM BIOS/MON, pageable firmware and RAM handoff
- DM-80 and actual 4 KiB CG-ROM glyph atlas
- Virtual Disk A ports 30h–36h and beeper port 40h
- S80B v2, SHINO CBIOS/WBOOT, CP/M 2.2 memory map and writable A: starter
  filesystem
- CP/M command reference for DIR, TYPE, ERA, REN, SAVE, USER and bundled COM
  programs
- source hashes, external references and explicit accuracy boundaries

The generated examples are demonstrations made by running one instruction in
an isolated CPU/Bus. They are not a replacement for the pinned external oracle
suite.

## Accuracy and implementation boundaries

- external full-state CPU baseline: `1,604,000 / 1,604,000 PASS`, Failure 0
- instruction-level, not electrical/pin-cycle-perfect
- WAIT/BUSRQ, hardware races, daisy chains and multi-byte external IM0 streams
  remain outside the milestone
- VRAM is physical RAM observed by video; CG-ROM is renderer-local
- Virtual Disk A is a PIO block device, not a mechanical FDD/FDC
- browser-reload disk persistence, host import/export, B: drive, UART, printer
  and physical display interfaces remain future work
- reserved BIOS vectors are not implemented drivers or interrupt handlers
- no FPGA implementation is claimed

## Publication

The published manual is a vendored generated artifact. Publication updates must
record the exact source commit and SHA-256 in
`ssnshino/shinomiya-daihanten-content`; machine and manual remain independent
standalone HTML files.
