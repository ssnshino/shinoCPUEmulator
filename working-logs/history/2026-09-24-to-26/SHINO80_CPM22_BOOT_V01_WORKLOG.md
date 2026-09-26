# SHINO-80 CP/M 2.2 Boot v0.1 Worklog

Date: 2026-09-26
Branch: `feature/shino80-cpm22-boot-v01-20260926`
Parent: `72f16bbaf4b710d5dcfed005b1ec13c096d4c07a`
PR: #35

## Research and license gate

Rejected the Computer History Museum non-commercial release as the repository
distribution basis. Selected `brouhaha/cpm22` commit `01018abb...`, whose
bundled DRDOS, Inc. grant permits nonexclusive use, distribution, modification
and derivatives. Imported its exact license, upstream README, CCP and BDOS
source. Built with Macroassembler AS `c7155b4...`.

## Implementation

- embedded deterministic 44K CCP and SHINO-patched BDOS images
- added S80B v2 two-track system layout
- added an original 98-byte RAM loader at 8000h
- retained the one-sector CBIOS WBOOT bootstrap contract
- read 44 CCP/BDOS sectors through CBIOS READ/INIR
- installed page-zero WBOOT and BDOS vectors
- changed CBIOS SECTRAN from zero-based CP/M sectors to one-based media sectors
- cleared text VRAM before entering CCP
- updated standalone build, device inspector and Technical Manual data

The first execution correctly exposed the only port mismatch: unmodified 44K
BDOS called the standard computed BIOS base AA00h and stopped in unused RAM.
The source-level `bios equ 0fa00h` change is documented and the rebuilt BDOS
then reached `A>` and executed `DIR` successfully.

## Focused QA

- CCP 2,048 bytes / SHA-256 `759a93d...27af`
- BDOS 3,584 bytes / SHA-256 `6496c9e...dcab`
- S80B v2 exact layout and E5 data area: PASS
- cold MON `O` -> `A>`: PASS
- CCP `DIR` -> `NO FILE`: PASS
- BDOS function 12 -> `0022h`: PASS
- destructive loader/CCP/BDOS WBOOT recovery: PASS
- missing-media bounded WBOOT failure: PASS
- legacy CBIOS/system-disk/warm-boot focused suites: PASS after contract update

## Closeout QA

- full `npm test`: PASS, all 23 package stages including CPU families,
  interrupts, firmware, block device, CBIOS, CP/M, source, artifact and manual
- standalone build: 218,645 bytes, deterministic artifact test PASS
- Technical Manual: 1,780 encodings, 1,997,572 bytes, deterministic PASS
- installed Chrome 390×844: CP/M boot/memory/device inspector/overflow PASS
- installed Chrome 1440×1000: same checks PASS
- console errors: 0; network requests: 0; document horizontal overflow: 0
- `git diff --check`: PASS

No merge, deploy or public release is part of this worklog.
