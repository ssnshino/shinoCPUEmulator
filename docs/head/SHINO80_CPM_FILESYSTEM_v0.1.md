# SHINO-80 CP/M Filesystem & Starter Disk v0.1

Status: candidate
Date: 2026-09-26
Branch: `feature/shino80-cpm-filesystem-v01-20260926`

## Purpose

S80B v2 の A: を「CP/M 2.2 が起動するだけの空媒体」から、実際に読書き
できる starter disk へ進める。媒体生成は決定的で、one-page HTML 内に完全
同梱され、実行時ネットワークを必要としない。

## Disk geometry and DPB

| Item | Value |
| --- | --- |
| Physical geometry | 77 tracks × 26 sectors × 128 bytes |
| Image size | 256,256 bytes |
| Reserved system tracks | 2 (`OFF=2`) |
| CP/M allocation block | 1,024 bytes (`BSH=3`, `BLM=7`) |
| Allocation blocks | 243 (`DSM=242`) |
| Directory entries | 64 (`DRM=63`) |
| Reserved directory blocks | 0–1 (`AL0=C0h`) |
| First file-data block | 2 |
| Extent capacity | 128 records / 16 KiB |
| Allocation pointer width | 1 byte (`DSM < 256`) |

Track 0–1 contains the S80B header, loader, CBIOS and CP/M CCP/BDOS system
payload. CP/M logical track 0 starts at physical track 2. Directory and data
offsets are therefore derived from the CBIOS DPB, not duplicated as unrelated
magic values.

## Directory encoding

Each entry is the CP/M 2.2 32-byte form:

- byte 0: user number 0–15; unused entry is `E5h`
- bytes 1–8: uppercase, space-padded filename
- bytes 9–11: uppercase, space-padded extension
- bytes 12 and 14: extent number (`EX` / `S2`)
- byte 15: record count (`RC`, 128-byte records)
- bytes 16–31: one-byte allocation block pointers

The builder accepts conservative uppercase CP/M 8.3 names, rejects duplicate
names and invalid users, emits additional extents past 16 KiB, gives every
allocation block a single owner, and rejects directory or medium overflow.
Unused directory entries and unused logical-media bytes remain `E5h`. File
records are padded with CP/M text EOF `1Ah` unless another padding byte is
explicitly requested.

## Bundled original files

| File | Size | Records | Purpose |
| --- | ---: | ---: | --- |
| `WELCOME.TXT` | 207 bytes | 2 | Starter commands and provenance |
| `HELLO.COM` | 32 bytes | 1 | BDOS function 9 console example |
| `S80INFO.COM` | 64 bytes | 1 | SHINO-80 / CP/M configuration report |

All three files and the filesystem builder are original SHINO-80 work. No
historical CP/M transient-command binary is imported by this phase. The
existing third-party CP/M 2.2 CCP/BDOS provenance and license record remains
under `third_party/cpm22/`.

## Guest-visible operation

After `MON O` reaches `A>`, the following are supported by the resident CCP and
the mounted writable filesystem:

```text
DIR
TYPE WELCOME.TXT
HELLO
S80INFO
SAVE 1 COPY.COM
ERA COPY.COM
REN NEW.COM=COPY.COM
```

`SAVE`, `ERA` and `REN` operate through BDOS and the existing CBIOS sector
WRITE path. Mounted media survives CPU RESET, POWER cycling inside the current
page, and CBIOS WBOOT. It does not yet survive closing or reloading the browser.

RAM CBIOS CONOUT handles CR, LF, BS (`08h`), DEL (`7Fh`) and BEL (`07h`). BS
and DEL move the text cursor left for BDOS/CCP line editing; reaching the end of
the 80×25 VRAM shifts rows 1–24 upward, clears row 24 and leaves the cursor at
the first cell of the cleared row. This behavior is guest-side terminal
semantics and does not depend on browser scrolling.

## Preserved boundaries

- CPU core, decoder and flag semantics are unchanged.
- CCP, BDOS and CBIOS machine-code semantics are unchanged.
- Existing S80B v2 system-track bytes remain unchanged.
- CG-ROM, DM-80 raster, AA, phosphor and scanline behavior are unchanged.
- No B: drive, host file picker, image import/export, IndexedDB/localStorage,
  mechanical seek/rotation, DMA, WAIT or disk interrupt is added.

## Verification contract

- Unit tests cover name/user validation, deterministic entries, allocation,
  block ownership, multi-extent files, bounds and system-track preservation.
- A real Z80 execution path boots through `MON O`, runs `DIR`, `TYPE`, both COM
  programs, edits a mistyped CCP command with Backspace, writes `COPY.COM`
  using CCP `SAVE`, enters WBOOT at 0000h, runs the persisted copy and deletes
  it using `ERA`.
- Generated one-page and Technical Manual artifacts must be deterministic,
  self-contained and free of unresolved build markers.
- Desktop and mobile installed-Chromium smoke must show the three starter files
  in the Virtual Disk A inspector with no console, network or overflow finding.

## Primary references

- Digital Research, *CP/M 2.2 Alteration Guide*, section 6:
  `https://ftpmirror.infania.net/sites/www.gaby.de/cpm/manuals/archive/cpm22htm/ch6.htm`
- cpmtools filesystem format manual:
  `https://manpages.debian.org/testing/cpmtools/cpm.5.en.html`
