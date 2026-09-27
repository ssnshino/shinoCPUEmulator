# SHINO-80 Current Integrated System Specification

Status: RELEASED BASELINE
Updated: 2026-09-27 JST
Released implementation baseline: `01c5d4433f06f5c41254c2d0b4137606d8990be5` / PR #42

## Purpose

This is the concise current-system specification for ordinary restart and
future planning. Completed incremental phase specifications are preserved under
`docs/history/`; they describe how the system arrived here, not unfinished
work.

## Distribution

- authoring source: `src/`
- build scripts: `scripts/build-one-page.cjs`, `scripts/build-technical-manual.cjs`
- standalone machine: `deploy/one_page_shino80_v0.0.9_z80_base_complete.html`
- standalone manual: `deploy/shino80_technical_manual_v0.1.html`
- runtime dependency: none before the user explicitly follows an external link

The machine filename is retained for compatibility and does not limit the
current feature set to the historical BASE-complete milestone.

## CPU

- Z80 instruction families: BASE, CB, ED, DD, FD, DDCB, FDCB
- flags: documented and implemented undocumented X/Y behavior
- internal accuracy state: WZ, P, Q
- interrupts: NMI and INT IM 0/1/2 at instruction boundaries
- EI delay and HALT return behavior implemented
- pinned external full-state baseline: `1,604,000 / 1,604,000 PASS`
- independent interrupt/sequence and XY checks: PASS

Accuracy is instruction-level, not electrical or pin-cycle-perfect. WAIT,
BUSRQ, analogue/electrical contention, peripheral daisy-chain behavior and
multi-byte device-fed IM0 streams remain outside this milestone.

## Memory and firmware

- physical RAM: 64 KiB
- RESET-visible firmware overlay: Boot/Recovery ROM 0000h–1FFFh plus Extension
  ROM 2000h–3FFFh
- memory-control port: low I/O 00h
- VRAM: C000h–C7CFh, 2,000 text cells
- RAM handoff trampoline: F800h–F802h
- ROM BIOS stable jump table includes console, parsing, disassembly and RAM
  handoff services
- ROM Monitor supports help, clear, bounded dump, registers, disassembly, RAM
  boot proof and system-disk boot

## Display and input

- DM-80 text display: 80 columns × 25 rows
- logical raster: 640 × 400
- native CG-ROM: 256 glyphs × 16 bytes = 4 KiB
- native/integer enlargement: pixel-perfect
- reduction/non-integer scaling: gentle antialiasing
- scanline/phosphor: presentation layer only
- keyboard controller: byte FIFO exposed through Bus-visible I/O
- mobile keyboard mode keeps the DM-80 display visible above the OS keyboard
- CBIOS console implements CR, LF, Backspace, Delete, BEL and real 80×25 scroll

## Mass storage and CP/M

- Virtual Disk A: 77 tracks × 26 sectors × 128 bytes = 256,256 bytes
- Bus-visible PIO ports: 30h–36h
- system image: S80B v2
- RAM-resident original SHINO CBIOS with standard CP/M 2.2 entry order
- CP/M 2.2 CCP at 9400h and BDOS at 9C00h, public BDOS entry 9C06h
- TPA: 0100h–93FFh
- writable A: starter filesystem with deterministic CP/M directory/extents
- bundled original files: WELCOME.TXT, HELLO.COM, S80INFO.COM
- supported resident CCP commands: DIR, TYPE, ERA, REN, SAVE, USER
- page-local media survives RESET, POWER and WBOOT
- browser reload persistence and host file import/export are not implemented
- POWER followed by RUN, and machine RESET, automatically boot a mounted valid
  S80B v2 A: medium without keyboard input
- missing, unreadable or invalid boot media falls back to the ROM Monitor before
  page-out; `MON O` remains the explicit retry path
- the disk payload prints `SHINO-80 CP/M 2.2` through CBIOS before CCP enters A>

The CP/M CCP/BDOS redistribution permission, exact upstream origin, patches and
hashes are retained under `third_party/cpm22/`. SHINO firmware, filesystem
builder and starter files are original repository work.

## Devices and observers

- one-bit beeper: low I/O 40h; BEL triggers the machine device
- Debugger/Inspector uses observer APIs and must not become an execution path
- Bus trace uses bounded storage; visible observers avoid high-frequency DOM
  updates
- B: drive, mechanical FDC timing, UART, printer and physical display ports are
  future work and have no invented current I/O allocation

## Human acceptance

Real iPhone/Edge review confirmed:

- machine launch and mobile layout
- MON O to CP/M
- DIR, TYPE WELCOME.TXT, HELLO, S80INFO
- Backspace/Delete line editing
- 80×25 scrolling
- SAVE 1 COPY.COM, copied COM execution and ERA COPY.COM
- cursor and BEEP behavior

Issue #41 / PR #42 automatic POWER → RUN / RESET boot has automated,
real-Chrome and Human Codex-preview coverage. Physical iPhone/Edge autoboot
recheck is not recorded.

## Change rule

Future work starts with one PLAN in `plan/head/`. Any CPU semantic change needs
a new accuracy phase and matching oracle/regression evidence. Generated deploy
HTML is never the authoring source.
