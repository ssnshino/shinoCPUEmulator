# SHINO-80 Demo Software Disk Plan

Date: 2026-09-30 JST
Status: Completed candidate / Human Review pending

## Purpose

SHINO-80上で実際にload/executeできる複数のCOM programを作り、標準machineへ
IMPORT可能なdata disk、再現可能なbuilder、実CPU integration test、利用文書を
一つのlogical changeとしてrepositoryへ収録する。

## Source

- Human request: bouncing multi-ball COM, `C` stop, stronger MON
- physical iPhone / Edge acceptance screenshots and Human PASS
- repository CLASSIC block device, CP/M filesystem builder, CCP/BDOS/CBIOS path

## In scope

- CLASSIC 256,256-byte B: data disk
- BALLS / MONX / BEEP / ABOUT
- disk-local README and implementation summaries
- deterministic Node.js builder
- byte-exact and guest-execution regression test
- development history and compatibility notes

## Out of scope

- CPU/Bus/firmware behavior changes
- default A:/B: media changes
- third-party CP/M applications
- 2HD-1440 distribution in v0.1
- website publication or deployment

## Accuracy level

Instruction-level guest execution through the repository's real Z80 Core, Bus, block controller,
CBIOS, BDOS and CCP. BALLS uses the documented SHINO-80 VRAM/keyboard contract. MONX uses BDOS
console services and directly changes live guest RAM where documented.

## Regression risk

- accidental non-deterministic binary generation
- COM program corrupting resident CP/M or VRAM outside bounds
- committed image drifting from builder output
- a non-CLASSIC image appearing valid to the host but unreadable from default S80B v2

## QA

- rebuild and byte-compare committed image
- inspect CP/M directory
- boot standard S80B v2, select B:, DIR and TYPE
- animate BALLS and compare separate frames
- send `C` and prove B: prompt recovery
- execute MONX D/E/F/M/S/G/Q against controlled RAM
- assert three port-40h BEEP triggers
- run full repository regression/build/manual suite
- Human physical iPhone / Edge confirmation

## Success conditions

- one documented CLASSIC image is importable in the default public preview
- all bundled COM files execute through CP/M
- image is reproducible without external assembler or third-party binary
- repository remains one logical commit and awaits Human Review
