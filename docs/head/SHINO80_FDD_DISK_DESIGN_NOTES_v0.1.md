# SHINO-80 FDD / DISK Design Notes v0.1

Status: DESIGN NOTES / NOT YET IMPLEMENTATION SPEC
Updated: 2026-09-26 JST

## Purpose

Record the agreed direction for SHINO-80 removable disk usability before a new
implementation PLAN is created.

The immediate motivation is not persistence by itself. SHINO-80 needs a practical
way to load and exchange software large enough to make the machine useful as a
development computer: text editor, assembler, compiler, linker, utilities and
user programs.

This note separates three things:

- current implemented behavior
- agreed design direction
- future candidates that are not yet fixed specifications

## 1. Core model: drive and medium are separate

SHINO-80 treats the drive/controller and removable disk medium as different
objects.

- **FDD / DRIVE** — the installed drive/controller device
- **DISK / MEDIA** — the removable medium inserted into that drive

The A: drive remains part of the machine even when no medium is inserted.

```text
SHINO-80
   |
   +-- DRIVE A:
        +-- controller state
        |    drive
        |    track
        |    sector
        |    command
        |    transfer state
        |    error
        |
        +-- removable DISK MEDIA
             256,256 bytes
```

The current implementation is a virtual PIO block device. Calling it an FDD in
the UI/design sense does **not** imply that mechanical seek/rotation timing or a
real historical FDC chip is already emulated.

## 2. Current implemented baseline

Virtual Disk A currently provides:

- 77 tracks
- 26 sectors per track
- 128 bytes per sector
- 256,256 bytes total
- writable media
- Bus-visible PIO through low I/O ports 30h-36h
- atomic 128-byte sector writes
- incomplete writes are not committed to the medium
- controller reset preserves inserted media and write-protect state
- SHINO-80 RESET and in-page POWER OFF/ON preserve the mounted medium
- CP/M WBOOT preserves and rereads the mounted medium
- browser reload/page close does not preserve media
- host disk-image import/export is not yet exposed in the machine UI

The current starter medium is the deterministic S80B v2 system disk containing
the SHINO loader, SHINO CBIOS, licensed CP/M 2.2 and starter filesystem.

The block-device implementation already has media-oriented primitives including
mount, eject and defensive image export. The next phase should build on those
boundaries rather than bypassing them.

## 3. Why disk usability is a priority

A CPU that can execute machine code is not yet a comfortable development
computer.

SHINO-80 should eventually support a workflow such as:

```text
A>EDIT HELLO.ASM
A>ASM HELLO
A>HELLO

HELLO FROM SHINO-80!
```

The disk system therefore needs to support practical software distribution and
working media, not only boot demonstration.

Important future software classes include:

- text editor
- assembler
- compiler
- linker
- debugger / monitor utilities
- file-management utilities
- graphics and sound development tools
- user-created ASM, source, data and COM files

ROM should not absorb software merely because disk handling is inconvenient.

**ROM is the machine. DISK is the software culture that grows on top of it.**

## 4. Agreed POWER ON boot direction

Current manual disk boot through ROM Monitor command `O` remains useful and
should be retained.

The desired normal POWER ON behavior is:

```text
POWER ON
   |
   v
ROM IPL
   |
   v
RAM / VIDEO / DEVICE initialization
   |
   v
DRIVE A: media present?
   | no
   +--------------------> MON
   |
  yes
   |
   v
bootable SHINO-80 medium?
   | no
   +--------------------> MON
   |
  yes
   |
   v
BOOT A:
   |
   v
disk loader / SHINO CBIOS / operating system
   |
   v
disk-side title/startup message
   |
   v
A>
```

The automatic boot path should reuse the existing disk-boot logic rather than
creating a second unrelated loader.

Expected fallback behavior:

- no medium -> enter MON
- non-bootable or rejected medium -> enter MON
- bootable S80B system medium -> boot it automatically
- `MON O` remains the explicit manual retry/boot command

The ROM IPL may identify the machine and boot attempt. The richer system title
should preferably come from software loaded from the disk, so another bootable
disk may present a different environment in the future.

## 5. INSERT / EJECT direction

The Device Inspector is the preferred home for media operations.

Conceptual DRIVE A: controls:

```text
VIRTUAL DISK DRIVE A:

MEDIA
S80B SYSTEM DISK v2

STATUS
INSERTED / READY

WRITE PROTECT
OFF

[ EJECT ]
[ INSERT IMAGE... ]
[ INSERT FACTORY DISK ]
[ EXPORT IMAGE ]
```

Initial safety direction:

- POWER OFF: INSERT / EJECT / IMPORT / factory replacement allowed
- POWER ON: media replacement initially disabled
- running hot-swap is a separate future design problem

This avoids silently changing media while CP/M may have assumptions about the
currently logged disk.

## 6. Disk-image and browser-persistence direction

The disk medium should remain the canonical machine-facing object. Browser
persistence and host files belong outside the guest-machine boundary.

```text
Z80
 |
Bus
 |
FDD / Virtual Block Device
 |
DISK MEDIA
---------------- machine / host boundary
 |
browser persistence
image import / export
```

Current planning candidates:

- preserve the exact 256,256-byte medium as a portable raw disk image
- use a SHINO-specific extension such as `.s80b` if adopted by the PLAN
- browser-reload persistence using IndexedDB or another explicitly selected
  browser-storage mechanism
- explicit image import/export as the portable backup and exchange boundary
- persistence failure must not prevent SHINO-80 itself from running

These mechanisms are not fixed implementation specifications until the next
PLAN defines validation, migration, corruption handling, mobile behavior and
`file://` constraints.

## 7. Future A: / B: development model

A second drive is not part of the next committed implementation yet, but the
current design should not make it difficult.

A useful future arrangement is:

```text
A: SYSTEM / TOOLS DISK

EDITOR.COM
ASM.COM
LINK.COM
UTILITY.COM

B: USER / WORK DISK

HELLO.ASM
GAME.ASM
TEST.COM
DATA.TXT
```

That provides a natural separation between the development environment and
user work.

B: drive I/O allocation and exact device contract remain undecided.

## 8. Future host file exchange

The first portable boundary should be whole disk-image import/export.

A later host-side disk workshop may also understand the CP/M filesystem and
support individual file transfer:

```text
HOST HELLO.ASM
      |
      v
import into CP/M medium
      |
      v
B:HELLO.ASM
```

and the reverse for COM/source/data files.

Such host tooling must not become a shortcut in the Z80/CBIOS runtime path.

## 9. Design principles carried forward

- FDD/drive and removable disk medium are separate concepts.
- Guest disk I/O continues through CPU -> Bus -> device.
- Browser persistence remains outside the guest hardware contract.
- Debugger/host tooling stays observer-side where possible.
- `MON O` remains available even after automatic boot exists.
- Automatic boot and manual boot should share the same loader path.
- Disk usability should enable larger software instead of pushing tools into ROM.
- CPU core must not change merely to implement host-side media handling.
- Generated standalone HTML is never hand-edited.
- One environment / one writer / one purpose branch.
- PLAN FIRST before implementation.

## 10. Candidate next implementation scope

The next PLAN should decide whether one bounded phase can include all of the
following, or whether it should be split:

1. removable media UI for DRIVE A:
2. bootable-media detection and POWER ON automatic boot
3. browser-reload persistence
4. explicit disk-image import/export
5. factory-media restore
6. corruption/version validation
7. regression coverage for RESET / POWER / WBOOT / CP/M writes
8. iPhone / Edge / standalone `file://` Human QA

Assembler/compiler/editor selection, B: drive, individual host-file transfer
and mechanical FDD timing are later work unless explicitly brought into a
future PLAN.
