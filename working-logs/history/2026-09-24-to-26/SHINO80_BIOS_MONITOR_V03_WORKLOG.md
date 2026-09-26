# SHINO-80 BIOS / Monitor v0.3 — worklog

2026-09-26 · branch `feature/shino80-bios-monitor-v03-20260926`
Parent `af6c933` (Technical Manual candidate).

## Request and scope

Human requested continued BIOS/MON growth after the CPU and Technical Manual
milestones. Implemented the previously planned read-only console set: bounded
range dump, diagnostic registers and full-family disassembly. No memory edit,
GO, BREAK/NMI contract, device driver, CPU behavior, CG-ROM or UI change.

## Delivered

- stable BIOS jump-table additions: PARSE_HEX16 at 0118h and DISASM_ONE at 011Bh
- legacy `D xxxx` retained; `D xxxx yyyy` adds inclusive wrap-aware ranges
- `R` shows main/alternate register banks, IX/IY, caller SP and I/R
- `U xxxx` shows eight instructions; `U xxxx yyyy` is a bounded range form
- BASE/CB/ED/DD/FD/DDCB/FDCB ROM-resident disassembly with immediates, relative
  targets, signed index displacement, unused ED and malformed-prefix handling
- ROM tables generated from decoder descriptors at build time; runtime command
  parsing, Bus reads, formatting and output all execute as Z80 firmware
- Technical Manual memory map, BIOS table and MON chapter updated and rebuilt
- matching plan, specification, regression suite and restart documentation

## Design decisions

- All new Monitor commands are read-only and strictly bounded. D is limited to
  256 bytes; ranged U to 256 bytes or 32 instructions. A visible `RANGE LIMITED`
  line reports truncation.
- R captures the MON boundary before GETLINE. It is intentionally diagnostic,
  not a saved application task or a promise that GO can resume it.
- DD/FD prefix scanning permits four consecutive prefixes. A fifth becomes a
  one-byte DB/PREFIX LIMIT line, guaranteeing forward progress on arbitrary RAM.
- Public BIOS entries were appended; no existing call address moved.
- SYSTEM ROM reaches 1FF6h, leaving nine trailing bytes. Future firmware work
  must make an explicit space/layout decision before adding features.

## Verification evidence

- `tests/shino80_bios_monitor_v03.test.cjs`: PARSE plus 1,780 disassembly
  encodings and D/R/U command behavior PASS.
- Exact decoder agreement covers all seven instruction families; additional
  cases cover repeated DD/FD, DD-before-ED, five-prefix limit and FFFFh operand
  wrap.
- Legacy v0.2 and complete package regressions, deterministic emulator/manual
  generation and artifact checks: PASS.
- Offline installed Chrome against the generated file URL:
  1440×1000 and 390×844, power/run/keyboard/U/C/R flow PASS; Technical Manual
  BIOS section PASS; page identity/nonblank/no overlay PASS; console errors 0,
  warnings 0, network requests 0, horizontal overflow 0.
- Visual review found cramped alternate-register labels; spaces were added and
  the browser smoke was rerun.
- Temporary browser harness/screenshots are outside the repository at
  `/tmp/shino80-mon-v03-qa.YTV89r/` and are not source artifacts.

## Boundaries and rollback

CPU core/decoder execution/flags, Bus behavior, CG-ROM and workbench source are
unchanged. Decoder data is consumed only while assembling the firmware tables.
Reserved disk/serial/printer/interrupt vectors remain stubs. No public deploy,
main merge or release is authorized by this work.

Rollback is the single BIOS/MON v0.3 feature commit. Regenerate both standalone
HTML artifacts after any rollback. Resume by reading README, current snapshot,
this worklog and the v0.3 specification.
