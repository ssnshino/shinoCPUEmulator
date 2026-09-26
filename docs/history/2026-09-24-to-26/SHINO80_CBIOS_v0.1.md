# SHINO-80 CBIOS v0.1

Date: 2026-09-26

Status: implementation candidate

Branch: `feature/shino80-cbios-v01-20260926`

## What this is

SHINO CBIOS v0.1 is an original 566-byte, RAM-resident Z80 firmware image at
`FA00h`–`FC35h`. It presents the standard CP/M 2.2 17-entry BIOS jump-vector
order while adapting calls to SHINO-80's own Keyboard, Text VRAM and Virtual
Disk A interfaces.

It is not copied from the Digital Research sample BIOS. The public ABI and disk
table formats are followed from the CP/M 2.2 Alteration Guide; the code and
SHINO-80 hardware binding are original to this repository.

## Jump vector

Each slot is one three-byte `JP` instruction.

| Address | Entry | v0.1 behavior |
|---:|---|---|
| FA00h | BOOT | initialize state, then return |
| FA03h | WBOOT | initialize state, then return |
| FA06h | CONST | `A=FFh` when a key is ready, otherwise `00h` |
| FA09h | CONIN | wait for and return a 7-bit Keyboard byte |
| FA0Ch | CONOUT | write `C` to Text VRAM; CR/LF and wrap supported |
| FA0Fh | LIST | harmless return; no printer yet |
| FA12h | PUNCH | harmless return; no punch yet |
| FA15h | READER | return Ctrl-Z (`1Ah`) |
| FA18h | HOME | select track zero |
| FA1Bh | SELDSK | `C=0` returns A: DPH in HL; others return zero |
| FA1Eh | SETTRK | store track from BC |
| FA21h | SETSEC | store sector from BC |
| FA24h | SETDMA | store DMA address from BC |
| FA27h | READ | read 128 bytes to DMA; A=0 success, 1 error |
| FA2Ah | WRITE | write 128 bytes from DMA; A=0 success, 1 error |
| FA2Dh | LISTST | return ready (`FFh`) |
| FA30h | SECTRAN | identity when DE=0; table lookup otherwise |

BOOT and WBOOT deliberately return in v0.1. A complete CP/M WBOOT must reload
CCP/BDOS, rebuild page zero and enter CCP. That work is not represented as done.

## Hardware mapping

### Console input

- Keyboard STATUS `21h`
- Keyboard DATA `20h`
- CONST is non-consuming
- CONIN polls CONST, consumes one byte and clears the parity bit

### Console output

CONOUT writes directly to RAM Text VRAM at `C000h`–`C7CFh`. It keeps private
cursor/column state, handles CR/LF, wraps 80 columns and wraps the final screen
cell to the beginning. It does not call the ROM BIOS after RAM handoff.

Scrolling and backspace editing are not CBIOS v0.1 features. CP/M's ordinary
console stream uses printable characters plus CR/LF, which this phase covers.

### Disk

READ and WRITE program Virtual Disk A's DRIVE/TRACK/SECTOR/COMMAND registers,
verify ERROR and DRQ, then execute exactly 128 `INIR` or `OTIR` byte transfers
through DATA `35h`. The device's exact error codes map onto the CP/M BIOS
convention: zero success, one unrecoverable error. Write-protect therefore
returns one at this boundary.

Track and sector are stored as 16-bit CP/M values. Values whose high byte is
nonzero fail before being truncated to the device's 8-bit register.

## Disk tables

The A: DPH has no sector translation vector and points to private DIRBUF, DPB,
CSV and ALV regions inside the image.

```text
SPT  26
BSH   3
BLM   7
EXM   0
DSM 242
DRM  63
AL0 C0h
AL1 00h
CKS  16
OFF   2
```

This describes 1 KiB allocation blocks, 243 blocks, 64 directory entries and
two reserved tracks on the 77 × 26 × 128-byte A: image.

## Verified path

The automated integration suite uses the real Z80 core, Bus, mapper, Keyboard
and Virtual Disk module. It loads the original CBIOS image to FA00h, enters
all-RAM mode, and invokes the public jump slots.

Coverage includes:

- all 17 contiguous JP entries
- exact DPH/DPB bytes and pointer targets
- BOOT initialization and Keyboard/VRAM console
- SELDSK, HOME, SECTRAN, LISTST and READER conventions
- first-sector READ and last-sector WRITE
- write-protected error mapping
- an original sector-1 payload read to 8000h and executed from RAM
- no Boot/Extension ROM access during that proof

## Current integration boundary

The source builder and tests own this candidate. The ordinary one-page startup
does not silently inject the CBIOS into RAM because there is not yet a complete
cold loader/media lifecycle. The next phase must build that explicit path.

No CCP, BDOS, CP/M filesystem, system-track image or BASIC is present. This is
a validated CBIOS hardware adapter, not a CP/M boot claim.

## Reference

Digital Research, *CP/M Operating System Manual*, CP/M 2.2 Alteration Guide,
especially BIOS Entry Points and Disk Parameter Tables:
<https://www.bitsavers.org/pdf/digitalResearch/cpm/CPM_Operating_System_Manual_Jul82.pdf>
