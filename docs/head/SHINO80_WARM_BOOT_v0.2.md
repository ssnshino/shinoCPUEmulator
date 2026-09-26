# SHINO-80 Warm Boot v0.2

Date: 2026-09-26

Status: implementation candidate

Branch: `feature/shino80-warm-boot-v02-20260926`

## Purpose

Warm Boot v0.2 makes the disk-backed page-zero restart path executable. After
MON `O` has loaded the original System Disk, address 0000h contains `JP FA03h`.
FA03h is CBIOS WBOOT and now reloads the original system payload from A: before
transferring control back to 8000h.

## WBOOT sequence

1. initialize CBIOS private state;
2. select track 0, sector 2 and DMA 8000h;
3. call the ordinary CBIOS READ entry;
4. transfer exactly 128 bytes through DATA 35h using INIR;
5. jump to 8000h when READ succeeds.

The restored payload clears Text VRAM, calls CBIOS BOOT, prints the System Disk
banner through CBIOS CONOUT, writes `DSK!` at E260h and HALTs. BOOT itself
continues to initialize and return; WBOOT is the disk-backed non-returning path.

## Failure behavior

If A: is missing or READ fails, WBOOT prints `WBOOT DISK ERROR` through its own
loaded CONOUT implementation and HALTs. It does not jump into the possibly
damaged 8000h region. Hardware RESET remains the recovery path to ROM MON.

## Verified invariants

- page zero remains the exact bytes `C3 03 FA`
- a deliberately destroyed 8000h payload is restored byte-for-byte
- warm boot issues one READ command and exactly 128 DATA reads
- the restored payload executes and recreates the banner and `DSK!`
- every opcode fetch in the warm path comes from physical RAM
- missing-media failure is visible and reaches stable HALT

## Boundary

This is not CP/M warm boot yet. It reloads one original SHINO-80 sector, not a
CCP/BDOS image. There is no 0005h BDOS vector, filesystem, directory, transient
program return convention or third-party code. The mechanism is the control
path on which a later license-audited system image can be built.
