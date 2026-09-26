# SHINO-80 CP/M 2.2 Command Reference v0.1

Date: 2026-09-26
Scope: the CP/M 2.2 CCP and starter disk currently shipped by SHINO-80

## Starting CP/M

1. Power on SHINO-80 and run the machine.
2. At the ROM Monitor `*` prompt, enter `O` and press Enter.
3. A successful disk boot ends at the `A>` prompt.

Commands are case-insensitive. Filenames use CP/M 8.3 form. Backspace and
Delete edit the current command line, and output scrolls through the 80 x 25
DM-80 screen.

## Built-in CCP commands

| Command | Purpose | Example |
| --- | --- | --- |
| `DIR [filespec]` | List matching files on the current disk. `?` and `*` wildcards are accepted by CP/M. | `DIR` |
| `TYPE filename` | Display a text file. | `TYPE WELCOME.TXT` |
| `ERA filespec` | Erase matching file entries. This changes the mounted disk immediately. | `ERA COPY.COM` |
| `REN new=old` | Rename a file without copying its contents. | `REN NEW.COM=OLD.COM` |
| `SAVE n filename` | Save `n` pages of 256 bytes beginning at 0100h. | `SAVE 1 COPY.COM` |
| `USER n` | Select CP/M user area 0 through 15. | `USER 0` |

`ERA` is destructive. `SAVE` writes memory beginning at 0100h into the mounted
directory/media; check `DIR` before and after using either command.

## Bundled transient commands and files

| Name | Purpose |
| --- | --- |
| `WELCOME.TXT` | Starter text for `TYPE` and console/scroll checks. |
| `HELLO.COM` | Original SHINO-80 sample program. Run it as `HELLO`. |
| `S80INFO.COM` | Reports the SHINO-80 / CP/M environment. Run it as `S80INFO`. |

Useful end-to-end check:

```text
A>S80INFO
A>SAVE 1 COPY.COM
A>DIR
A>COPY
A>ERA COPY.COM
A>DIR
```

## Persistence boundary

The mounted A: medium survives SHINO-80 RESET, POWER cycling inside the page,
and CP/M warm boot. It does not currently survive closing/reloading the browser
page. Host-file import/export and IndexedDB/localStorage persistence are not
implemented.

## Not included yet

- Historical utility binaries such as PIP, STAT, ED, ASM, DDT and LOAD
- BASIC
- B: drive
- Host disk-image import/export
- Browser-reload persistence

The six built-in command names are confirmed against the included CP/M 2.2 CCP
source at `third_party/cpm22/ccp.asm`. This document describes SHINO-80's
current shipped image; it is not a complete general CP/M manual.
