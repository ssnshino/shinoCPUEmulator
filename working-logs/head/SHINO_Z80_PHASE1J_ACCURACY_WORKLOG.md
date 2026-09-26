# PHASE 1J — CPU instruction-level closeout

Created: 2026-09-26T09:10:24+09:00
Branch: `feature/shino80-z80-accuracy-closeout-20260926`
Parent: `d8d30bc` / PR #25 (`feature/shino80-z80-indexed-cb-20260926`).
Single logical commit owns implementation, tests, docs and generated HTML.
Rollback: revert this phase's commit, preserving the earlier PR stack.
No main merge, release, Docker, or production change performed.

## Outcome

PHASE1J is a completed **instruction-level CPU candidate**, pending Human
review/merge. All instruction families, full F, WZ/P/Q, NMI/INT IM0/1/2,
EI one-instruction inhibit and HALT exit are implemented. Not cycle-perfect.

Core source: flags now produce actual X/Y; CP/BIT/block exceptions included.
WZ follows memory/flow/arithmetic/indexed/block operations. Q distinguishes
flag writers from POP/EX/no-flag instructions and ignored prefixes. P supports
NMOS LD A,I/R immediately interrupted behavior. Full external comparison
also checks alternate F, not just the documented bits.

Interrupt inputs are level INT, edge-latched NMI and pulseNMI. Acknowledgement,
refresh, stack, vector reads and RETI notification are observable through Bus.
IM0 shares the decoder using an injected opcode rather than forcing RST.
Existing pacing, ROM protection, BIOS, CG-ROM and Monitor behavior is retained.
No firmware, decoder, CSS, or peripheral behavior was changed.

## External evidence (final source hashes matched)

Pinned dataset: SingleStepTests/z80
`ebe1875d48f374bcfd4b505d8eb8ee751568b5f7`, MIT fixtures; cache outside Git:
`/Volumes/SSD250GBUSB/source/tmp/z80-oracle-ebe1875/v1`.

| Family | Encodings | Cases | PASS | Failure |
|---|---:|---:|---:|---:|
| BASE | 252 | 252,000 | 252,000 | 0 |
| CB | 256 | 256,000 | 256,000 | 0 |
| ED | 80 | 80,000 | 80,000 | 0 |
| DD | 252 | 252,000 | 252,000 | 0 |
| FD | 252 | 252,000 | 252,000 | 0 |
| DDCB | 256 | 256,000 | 256,000 | 0 |
| FDCB | 256 | 256,000 | 256,000 | 0 |
| Unique baseline | 1,604 | 1,604,000 | 1,604,000 | 0 |

Reports: `code/head/SHINO_Z80_PHASE1J_{BASE,CB,ED,DD,FD,DDCB,FDCB}_QA.json`.
Each includes per-opcode counts, fixture SHA-256, source SHA-256, maskFF and
exclusions. Full F/AF', WZ/P/Q, architectural registers, IFFs/IM/EI delay,
RAM, I/O and total T-states compared. No pin waveform comparison. Earlier
reruns are not added to this unique count. ED coverage is explicitly80,
not256 external fixtures. All256 ED slots retain local classification tests.

Reproduce each family using:

```sh
node scripts/check-z80-oracle.cjs FAMILY CACHE_DIR OUTPUT_JSON full
```

## Local QA

- `npm test` package stages, executed with bundled Node because npm was not
  on the default PATH: all PASS. Includes earlier CPU phases, video/power,
  BIOS/keyboard/MON, pacing, trace equivalence, syntax, build and artifact.
- New `test:phase1j`: **748 interrupt cases**, **589,824 full XY checks**, plus
  Q/WZ history and sequences PASS. Interrupt counts are not external-oracle
  counts. All256 IM0 initial bytes have normal-decoder equivalence checks;
  independent NOP/RST/CALL/JP cases verify timing, PC and stack behavior.
- Interrupt matrix covers vector odd/wrap/overlap, stack wrap, EI-prefix/HALT,
  EI→NMI, nested/held NMI, held INT re-entry, RETI/RETN aliases, R rollover,
  ROM-blocked stack, LD A,I/R P/V quirk, reset and LDIR interrupt/resume.
- Earlier PHASE1B intentionally preserved X/Y. Its obsolete assertion was
  replaced with result-derived X/Y; no new oracle failure was masked out.
- Deterministic rebuild: byte-identical. All seven report source hashes
  match current implementation. `git diff --check`: PASS.

## Rendered standalone QA

Browser plugin not available; existing Playwright + real installed Chrome used.
No new dependency, server, network asset or Docker runtime required.
URL: `file:///Volumes/SSD250GBUSB/source/repos/upstream/shinoCPUEmulator/deploy/one_page_shino80_v0.0.9_z80_base_complete.html`.
Viewports: 390x844 and1440x1000. Script: `/tmp/shino80-accuracy-browser.cjs`.

Flow: open HTML → power/run → MON prompt → H/Enter → help → CPU → STEP
EI/HALT → IM2 dispatch → handler → EI/RETI → NMI → BUS.
Script injects the interrupt diagnostic program into RAM and drives the core
API; it does not claim a new IRQ/NMI user-facing button exists.

Checks: identity, nonblank content, self-test, no error overlay, no console
errors/warnings, responsive overflow, register/inspector updates PASS.
INT dispatch reached4000h and RETI returned2002h, SP F000h restored, B28h,
52T; subsequent NMI reached0066h at63T. Desktop text states the real limits.
Screenshots `/tmp/shino80-accuracy-{390,1440}.png` and boot captures are local
evidence, not tracked assets. Mobile browser viewport is NOT physical iPhone QA.

Initial smoke assertion raced the throttled inspector; wait for rendered text
fixed the test. Expanded MON-input smoke also needed to blur the mobile keyboard
capture before pressing toolbar controls (keyboard focus intentionally hides
the toolbar). Neither required an application change.

## Deliverable / remaining work

Standalone filename remains `one_page_shino80_v0.0.9_z80_base_complete.html`;
its contents are the new CPU despite the historical distribution filename.
151,605 bytes; SHA-256
`68d1fe35844fcadab20c9f91e0d3e48792cf661f88928be051467c9373726503`.
Workspace delivery: `/Volumes/SSD250GBUSB/Nextcloud/work/SHINO80_CPU_COMPLETE_QA_20260926.html`.

Human mobile QA and explicit merge of the stacked PRs remain. Main is not
the new CPU until those PRs are reviewed/integrated. Next feature candidate:
resume MON range/disassembly/register support; no automatic new feature here.
Accuracy limits are in the spec: WAIT/BUSRQ, pin timing/races, variants,
multi-byte device-supplied IM0 streams and peripheral daisy-chain hardware.
Session-workflow kept plan, implementation evidence and restart state together.

## Update History

- 2026-09-26T09:10:24+09:00 — CPU closeout candidate, full-state and interrupt evidence recorded.
