# SHINO-80 CP/M Filesystem & Starter Disk v0.1 WORKLOG

Date: 2026-09-26
Branch: `feature/shino80-cpm-filesystem-v01-20260926`
Parent: `d0457dc47f08ee14e1b39f18d5d31064916c4d02`
Status: implementation and local QA complete; stacked PR #37 open

## Outcome

The S80B v2 A: medium is now a real writable CP/M 2.2 filesystem rather than
an E5-filled empty disk. It boots through the existing `MON O` / SHINO CBIOS
path and starts with three original SHINO files:

- `WELCOME.TXT` — 207 bytes / 2 records
- `HELLO.COM` — 32 bytes / 1 record
- `S80INFO.COM` — 64 bytes / 1 record

CPU, decoder, flags, CCP, BDOS, CG-ROM and display semantics are unchanged.
After iPhone Human QA, RAM CBIOS console handling was completed for BS/DEL and
bottom-row scrolling; its existing disk ABI and six-sector reservation remain
unchanged.

## Implemented

- Added a deterministic CP/M 2.2 filesystem packer derived from the existing
  CBIOS DPB.
- Added conservative CP/M 8.3 validation, user 0–15 validation, duplicate
  rejection, 32-byte directory entries, one-byte block allocation and
  multi-extent file packing.
- Preserved both reserved directory blocks, all S80B/CBIOS/CCP/BDOS system
  tracks, and E5h in unused directory/media space.
- Added original SHINO starter-file generation. Both COM files execute at
  0100h and print through BDOS function 9.
- Mounted the populated image through the existing system-disk builder.
- Added the two source modules to the standalone build and deterministic
  Technical Manual fingerprint set.
- Updated the Device inspector to display all starter filenames and direct the
  user to `DIR`, `TYPE WELCOME.TXT`, `HELLO` and `S80INFO`.
- Documented the disk geometry, directory format, ownership, guest commands,
  persistence boundary and non-goals in the Technical Manual and candidate
  specification.
- Fixed RAM CBIOS CONOUT so 08h/7Fh move the cursor left and the 80×25 text
  screen scrolls upward instead of wrapping to C000h. CBIOS is now 713 bytes at
  FA00h–FCC8h, still within the existing 768-byte sector 3–8 reservation.

## Runtime proof

`tests/shino80_cpm_filesystem_v01.test.cjs` executes the actual Z80 core with
the current BDOS, CBIOS and block-device ports. It proves:

1. `DIR` lists all three starter files.
2. `TYPE WELCOMX`, Backspace, `E.TXT` proves real CCP line editing and reads
   the packed `WELCOME.TXT` records.
3. `HELLO` and `S80INFO` load and execute as transient COM programs.
4. `SAVE 1 COPY.COM` causes real CBIOS sector writes and creates a directory
   entry plus file data.
5. Entering WBOOT through page zero (`PC=0000h`) reloads CCP/BDOS while the
   modified mounted medium remains intact.
6. `COPY` executes after WBOOT.
7. `ERA COPY.COM` removes the new file.

## iPhone Human QA

Human verification on the generated standalone HTML confirmed:

- `DIR`: PASS
- `TYPE WELCOME.TXT`: PASS
- `S80INFO`: PASS
- `HELLO`: PASS
- Backspace: FAIL before remediation; appeared as tab-like spacing
- text scrolling: FAIL before remediation; CBIOS wrapped to screen origin
- `SAVE` / copied program: not yet Human-tested

The two failures were reproduced as guest CBIOS console defects. Automated
post-fix proof covers direct 08h/7Fh cursor motion, 24-row VRAM shift and clear,
real CCP line editing, plus browser `deleteContentBackward` → 08h FIFO mapping.
Fresh iPhone confirmation remains the final Human check.

The packer unit portion also verifies invalid names/users, duplicate rejection,
system-track identity, exact starter entries, allocation ownership and a
16,385-byte multi-extent boundary case.

## Verification evidence

### Focused

- New module syntax: PASS
- `shino80_cpm_filesystem_v01.test.cjs`: PASS
- `shino80_cbios_v01.test.cjs` BS/DEL and 80×25 scroll: PASS
- `shino80_cpm22_boot_v01.test.cjs`: PASS
- `shino80_system_disk_loader_v01.test.cjs`: PASS
- `shino80_warm_boot_v02.test.cjs`: PASS
- deterministic one-page build: PASS
- deterministic Technical Manual build: PASS
- artifact test: PASS
- Technical Manual test: PASS
- `pnpm test`: PASS
- `git diff --check`: PASS

### Full source/package regression

All package test stages were run with the bundled Node runtime on 2026-09-26.
PASS includes:

- Z80 NOP and PHASE 1A–1J
- PHASE 2A / 2A.1
- BIOS/MON, keyboard, console v2 and 1,780-form disassembler
- pageable firmware, RAM handoff, execution pace and trace ring
- Virtual Disk A, CBIOS, system-disk loader, WBOOT and CP/M 2.2 boot
- CP/M filesystem and cursor/beeper
- source syntax, one-page build, artifact and Technical Manual

### Installed Chrome

Google Chrome 153 was run headless against the generated standalone files.

- app 1440×1000: iOS-delete mapping and starter-file inspector PASS
- app 390×844: iOS-delete mapping and starter-file inspector PASS
- manual 1440×1000: filesystem section PASS
- manual 390×844: filesystem section PASS
- console warnings/errors: 0
- network requests: 0
- document horizontal overflow: 0

### Generated artifacts

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `deploy/one_page_shino80_v0.0.9_z80_base_complete.html` | 233,403 | `92f1800001f346d7600d2e9bb4f3e0585f14c054c1ac12fdfa3bd4df47759941` |
| `deploy/shino80_technical_manual_v0.1.html` | 2,000,317 | `f4261d68c4e71ab3ac79482b2dabdb1bee1defc6ab184847d2da5ae277582f8c` |

## Research decisions

The implementation follows the CP/M 2.2 directory/extent model and cpmtools
filesystem description: 32-byte entries, 128-byte records, DPB-based block
size and directory reservation, and one-byte allocation pointers for a disk
whose DSM is below 256.

- Digital Research CP/M 2.2 manual, section 6:
  `https://ftpmirror.infania.net/sites/www.gaby.de/cpm/manuals/archive/cpm22htm/ch6.htm`
- cpmtools filesystem format:
  `https://manpages.debian.org/testing/cpmtools/cpm.5.en.html`

## Explicitly deferred

- Historical `PIP`, `STAT`, `ED`, `ASM`, `DDT`, `LOAD` and BASIC binaries
- B: drive and disk selection UI
- host image import/export or file drag-and-drop
- browser-reload persistence through IndexedDB/localStorage
- mechanical FDD timing, skew, DMA, WAIT and interrupt behavior
- merge and public deployment

## Delivery

- Commit: one logical `feat(shino80): add writable CP/M starter filesystem`
- Branch: `feature/shino80-cpm-filesystem-v01-20260926`
- Pull request: `https://github.com/ssnshino/shinoCPUEmulator/pull/37`
- Base: `feature/shino80-cursor-beep-v01-20260926` / PR #36
- Mergeability at creation: MERGEABLE
- iPhone Backspace/scroll remediation: included in the same logical PR commit
- Automatic merge/deploy: not performed
