# SHINO-80 CP/M 2.2 Boot v0.1

Date: 2026-09-26

## Result

SHINO-80 boots CP/M 2.2 from Virtual Disk A through its real Z80, Bus, block
device and RAM-resident CBIOS path. MON `O` loads the original SHINO loader and
CBIOS, pages out firmware, and the loader reads 44 CCP/BDOS sectors before
entering an interactive `A>` prompt.

## Runtime map

| Address | Content |
|---|---|
| 0000h | `JP FA03h` CBIOS WBOOT |
| 0005h | `JP 9C06h` BDOS public entry |
| 0100h–93FFh | 44K TPA |
| 9400h–9BFFh | CP/M 2.2 CCP |
| 9C00h–A9FFh | CP/M 2.2 BDOS |
| C000h–C7CFh | SHINO text VRAM |
| FA00h–FC84h | SHINO CBIOS, 645 bytes |

The CCP/BDOS origins are the 44K configuration. The single CP/M port change is
BDOS's BIOS base: upstream computes AA00h as the next module; SHINO-80 binds it
to the existing CBIOS at FA00h. CP/M's TPA still ends below CCP at 93FFh.

## S80B v2 system tracks

Tracks 0 and 1 are reserved by DPB `OFF=2`.

- track 0 sector 1: S80B v2 header
- track 0 sector 2: original 98-byte SHINO loader at 8000h
- track 0 sectors 3–8: SHINO CBIOS
- track 0 sectors 9–24: CCP, 16 sectors
- track 0 sectors 25–26 and track 1 sectors 1–26: BDOS, 28 sectors
- tracks 2–76: CP/M directory/data area, initially E5h

CBIOS SECTRAN converts CP/M's zero-based logical sector to the block device's
one-based physical sector. Direct loader calls remain one-based.

## License and reproducibility

The imported source is `brouhaha/cpm22` commit
`01018abbccce0bdf4874b0b2ed1a048c5fcc2987`. The bundled license records the
2022 DRDOS, Inc. permission to use, distribute, modify, enhance and otherwise
make CP/M and derivatives available nonexclusively. The restricted Computer
History Museum release is not the distribution basis.

Macroassembler AS commit `c7155b4fd3d33110f0eb098dede4295a8c008772`
rebuilds the images. CCP is unmodified. The documented one-line BDOS port delta
selects FA00h. Generated SHA-256:

- CCP: `759a93d5642445d5985fc340954c217e831d364600f063c6648f8303a4c827af`
- SHINO BDOS: `6496c9e8d3508b1d8132add59affb8d1237c7f7b5278fae2f93308cdddf2dcab`

## Verified behavior

- cold boot reaches `A>`
- `DIR` on the empty disk prints `NO FILE`
- BDOS function 12 returns CP/M version `0022h`
- page-zero WBOOT restores destroyed loader, CCP and BDOS from disk
- missing-media WBOOT remains a visible bounded HALT
- all post-pageout instruction fetches are RAM-resident

## Limits

No applications or transient commands are bundled yet. `DIR` is a CCP built-in;
commands such as STAT, PIP, ED and ASM require future licensed/free binaries or
new SHINO tools. The device remains instruction-boundary PIO, not a mechanical
cycle-perfect FDC, and browser host-file persistence is not implemented.
