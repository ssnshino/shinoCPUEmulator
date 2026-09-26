# SHINO-80 CP/M 2.2 Boot v0.1 PLAN

Date: 2026-09-26

## Purpose

Boot a license-audited CP/M 2.2 CCP and BDOS on the existing original SHINO-80
hardware, Virtual Disk A and RAM-resident CBIOS. Preserve the proven MON `O`,
all-RAM handoff and disk-backed WBOOT path.

## Source and license gate

- CP/M source: `brouhaha/cpm22`, commit
  `01018abbccce0bdf4874b0b2ed1a048c5fcc2987`.
- Upstream source states that the reformatted CCP/BDOS assemble byte-for-byte
  with real CP/M 2.2 binaries except for serial-number bytes.
- `LICENSE.txt` records the 2022-07-07 DRDOS, Inc. grant to use, distribute,
  modify, enhance and otherwise make CP/M and derivatives available on a
  nonexclusive basis.
- Build tool: Macroassembler AS commit
  `c7155b4fd3d33110f0eb098dede4295a8c008772`, GPL-2.0.
- The Computer History Museum non-commercial CP/M release is not used as the
  distribution basis.

Imported source, the exact license text, provenance and deterministic binary
hashes must travel with the repository. No proprietary ROM dump is permitted.

## Memory layout

| Range | Use |
|---|---|
| 0000h | `JP FA03h` warm boot vector |
| 0003h | IOBYTE |
| 0004h | current drive |
| 0005h | `JP 9C06h` BDOS public entry |
| 0100h-93FFh | 44K TPA |
| 9400h-9BFFh | CCP, 2,048 bytes |
| 9C00h-A9FFh | BDOS, 3,584 bytes |
| C000h-C7CFh | text VRAM |
| FA00h-FC7Ch | SHINO CBIOS candidate |

## System tracks and loader

The existing 77 x 26 x 128-byte medium and DPB `OFF=2` reserve tracks 0 and 1.
S80B remains an original SHINO boot envelope:

| Location | Content |
|---|---|
| track 0 sector 1 | S80B header |
| track 0 sector 2 | original 128-byte SHINO CP/M loader at 8000h |
| track 0 sectors 3-7 | SHINO CBIOS, padded |
| track 0 sectors 8-23 | CP/M CCP, 16 sectors |
| track 0 sectors 24-26 + track 1 sectors 1-25 | CP/M BDOS, 28 sectors |
| track 1 sector 26 | reserved / E5h |
| tracks 2-76 | CP/M directory and data area, initially empty/E5h |

MON `O` continues to load the header, the original loader and CBIOS before
paging out ROM. The RAM loader then uses CBIOS READ/INIR for all 44 CCP/BDOS
sectors, installs page-zero vectors, calls CBIOS BOOT and enters CCP at 9400h.
CBIOS WBOOT continues to restore track 0 sector 2 and jumps to the same loader.

## Changes

- Add third-party provenance/license/source snapshot for CCP and BDOS.
- Add deterministic CP/M 2.2 44K image data and integrity checks.
- Replace the diagnostic system payload with the original sector loader.
- Extend S80B metadata and image construction with CCP/BDOS system sectors.
- Add exact cold boot, prompt, BDOS call, directory and destructive WBOOT tests.
- Update runtime inspector, Technical Manual, snapshots and worklog.

## Non-targets

- No change to Z80 CPU semantics, decoder or flags.
- No change to CG-ROM or DM-80 rendering.
- No bundled applications, BASIC, host-file persistence or physical FDC timing.
- No claim of binary compatibility with another machine's BIOS or disk image.
- No merge, deploy or public release in this phase.

## Accuracy level and risks

Instruction-level CPU and real PIO sector paths are used. The block device is
still instruction-boundary, not mechanical or cycle-perfect. Primary risks are
CP/M page-zero conventions, CBIOS register contracts, system-sector rollover,
console semantics and a mismatch between imported source and embedded bytes.

## QA

- Verify pinned source/tool commits, sizes and SHA-256 hashes.
- Verify exact system-track bytes and E5-filled data area.
- Boot through MON `O` to an interactive `A>` prompt.
- Execute at least one CCP command and one direct BDOS call.
- Prove empty-directory behavior and page-zero vectors.
- Destroy resident CCP/BDOS, enter through 0000h and prove disk-backed recovery.
- Prove missing-media/error behavior remains bounded.
- Run full package regression, deterministic one-page/manual builds and Chrome
  desktop/mobile smoke with no console errors or horizontal overflow.

## Success conditions

- The distributed standalone HTML boots license-audited CP/M 2.2 from A:.
- CCP 9400h, BDOS 9C00h and CBIOS FA00h execute through documented vectors.
- Cold and warm boot both traverse observable Virtual Disk A traffic.
- Imported provenance/license and generated-byte integrity are reviewable.
- Existing CPU, firmware, disk, UI and manual regressions remain green.
