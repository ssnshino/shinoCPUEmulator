# SHINO-80 CP/M 2.2 Command Reference v0.1

Updated: 2026-09-28 JST
Scope: SHINO-80 CP/M 2.2 CCP with A: system disk and B: work disk

## Starting CP/M

1. Power on SHINO-80 and run the machine.
2. ROM checks the mounted valid S80B v2 **A:** medium only.
3. `SHINO-80 CP/M 2.2` and then `A>` appear.

UI RESET follows the ROM autoboot path and returns to `A>`. If A: is missing,
unreadable or invalid, ROM remains visible and presents the Monitor `*` prompt,
even if B: is inserted. `MON O` is the manual A: retry path.

Commands are case-insensitive. Filenames use CP/M 8.3 form. Backspace and Delete
edit the current command line, and output scrolls through the 80×25 DM-80.

## Drive roles

### A: — BOOT / SYSTEM / TOOLS

- S80B v2 system medium
- CP/M loader / CBIOS / CCP / BDOS
- starter files: WELCOME.TXT, HELLO.COM, S80INFO.COM
- only ROM autoboot source

### B: — USER / WORK / INTERCHANGE

- blank writable CLASSIC CP/M work medium at page construction
- no S80B boot payload
- not a ROM boot source

Switch with the standard CCP drive command:

```text
A>B:
B>A:
A>
```

A and B have independent filesystems.

## Built-in CCP commands

| Command | Purpose | Example |
| --- | --- | --- |
| `DIR [filespec]` | List matching files on the current drive. `?` and `*` wildcards are accepted. | `DIR` |
| `TYPE filename` | Display a text file. | `TYPE WELCOME.TXT` |
| `ERA filespec` | Erase matching file entries on the current drive. | `ERA COPY.COM` |
| `REN new=old` | Rename a file on the current drive without copying contents. | `REN NEW.COM=OLD.COM` |
| `SAVE n filename` | Save `n` pages of 256 bytes beginning at 0100h to the current drive. | `SAVE 1 COPY.COM` |
| `USER n` | Select CP/M user area 0 through 15. | `USER 0` |

`ERA` is destructive. `SAVE` writes memory beginning at 0100h through
BDOS/CBIOS to the currently selected drive.

## Bundled A: transient commands and files

| Name | Purpose |
| --- | --- |
| `WELCOME.TXT` | Starter text for `TYPE` and console/scroll checks. |
| `HELLO.COM` | Original SHINO-80 sample program. Run it as `HELLO`. |
| `S80INFO.COM` | Reports the SHINO-80 / CP/M environment. Run it as `S80INFO`. |

Useful A:/B: check:

```text
A>DIR
A>B:
B>DIR
NO FILE
B>SAVE 1 WORK.COM
B>DIR
WORK     COM
B>A:
A>DIR
; WORK.COM is not present on A:
A>B:
B>DIR
WORK     COM
```

## Warm boot and RESET

These paths intentionally differ.

### CP/M warm boot

When B: is current and a transient program returns through `JP 0000h` / WBOOT,
the system code is reloaded from A:, but Page Zero current-drive state is
preserved. The prompt returns to:

```text
B>
```

### UI RESET

UI RESET re-enters ROM autoboot. ROM explicitly initializes the CP/M current
drive to A:, so after boot:

```text
A>
```

B: media bytes are not discarded. Switching back to B: finds the previously
written files.

## Removable-media lifecycle

A and B each have an independent page-local medium and ejected-media shelf.

POWER OFF:

- EJECT target drive
- exact medium bytes are retained
- INSERT EJECTED DISK restores the same medium

POWER ON:

- replacement controls are disabled and handler-guarded

Mounted media survives RESET, POWER cycling inside the page, and CP/M warm boot.
It does not survive closing/reloading the browser page yet.

## Not included yet

- whole-disk IMPORT / EXPORT
- browser-reload persistence
- larger WORK media profiles
- factory restore
- historical utility binaries such as PIP, STAT, ED, ASM, DDT and LOAD
- BASIC

The six built-in command names are confirmed against the included CP/M 2.2 CCP
source at `third_party/cpm22/ccp.asm`. This is a SHINO-80 operating reference,
not a complete general CP/M manual.
