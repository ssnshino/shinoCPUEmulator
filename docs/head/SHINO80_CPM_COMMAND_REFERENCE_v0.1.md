# SHINO-80 CP/M 2.2 Command Reference v0.1

Updated: 2026-09-30 JST
Scope: SHINO-80 CP/M 2.2 CCP with A: system disk and B: work disk

## Starting CP/M

1. Power on SHINO-80 and run the machine.
2. ROM checks the mounted valid S80B v2 CLASSIC or v3 2HD-JP **A:** medium only.
3. `SHINO-80 CP/M 2.2` and then `A>` appear.

UI RESET follows the ROM autoboot path and returns to `A>`. If A: is missing,
unreadable or invalid, ROM remains visible and presents the Monitor `*` prompt,
even if B: is inserted. `MON O` is the manual A: retry path.

Commands are case-insensitive. Filenames use CP/M 8.3 form. Backspace and Delete
edit the current command line, and output scrolls through the 80×25 DM-80.

## Drive roles

### A: — BOOT / SYSTEM / TOOLS

- default S80B v2 CLASSIC system medium; supported v3 2HD-JP system image
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

While POWER is OFF, Disk Inspector can `EXPORT DISK IMAGE` for either A/B from
INSERTED or EJECTED state. The raw `.s80d` retains its native profile: CLASSIC
256,256; 2HD-JP 1,261,568; 2DD-720 737,280; 2HD-AT-1200 1,228,800;
2HD-1440 1,474,560 bytes.
`IMPORT / REPLACE DISK IMAGE` reads and validates the whole file, then waits for
`CONFIRM IMPORT`; until confirmation the existing medium is unchanged. A:
bootability is checked only by the real ROM on the next boot, not by the host UI.
While confirmation is pending, EJECT / INSERT EJECTED DISK for that target drive
is disabled; the other drive remains available except for starting another import.

## Foreign file conversion in the PHASE 4 candidate

Open I/O → FOREIGN MEDIA BRIDGE → OPEN FOREIGN IMAGE. This is a host tool,
not a CP/M command. Choose a disk, explicitly select a compatible F000/F001
profile, and select files (including USER areas 0–15). The tool checks destination
capacity and builds a fresh SHINO data disk with BUILD SHINO DISK. DOWNLOAD
saves it without changing A/B. SEND TO NATIVE IMPORT requires POWER OFF and
then the usual drive-specific CONFIRM IMPORT; CANCEL leaves the old medium intact.

Foreign system tracks are not copied. COM execution is not guaranteed just by
successful conversion: programs using nonstandard BIOS, video or peripherals
may depend on another machine. Raw extraction preserves complete 128-byte
records, including trailing 1Ah; this is not byte-length recovery for text files.
Use a supported system image/CBIOS for mixed-profile guest access. The default
CLASSIC v2 console remains unchanged.

## Not included yet

- browser-reload persistence
- factory restore
- historical utility binaries such as PIP, STAT, ED, ASM, DDT and LOAD
- BASIC

The six built-in command names are confirmed against the included CP/M 2.2 CCP
source at `third_party/cpm22/ccp.asm`. This is a SHINO-80 operating reference,
not a complete general CP/M manual.

## Update History

- 2026-09-30T14:42:19+09:00 — Codex — Corrected PHASE 3 size/boot statements and added PHASE 4 candidate bridge operations without adding CCP commands.
