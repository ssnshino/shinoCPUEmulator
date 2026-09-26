# SHINO-80 Warm Boot v0.2 worklog

## Scope

Branch `feature/shino80-warm-boot-v02-20260926`, stacked on System Disk / Loader
v0.1 `4d5e81a` / PR #33. Implement the original disk-backed WBOOT mechanism;
do not import an operating system.

## Implementation

- retained the standard CBIOS vector at FA03h and page-zero `JP FA03h`
- changed WBOOT from initialize/return into a non-returning reload path
- selected A: track 0 sector 2 with DMA 8000h through CBIOS state setters
- reused the public CBIOS READ implementation and 128-byte INIR transfer
- jumped to the restored original payload at 8000h on success
- added internal zero-terminated CBIOS output for a deterministic failure banner
- added `WBOOT DISK ERROR` plus stable HALT on missing/read-failed media
- expanded CBIOS from 566 to 635 bytes, still within the reserved 640 bytes
- updated the S80B header length/checksum and ROM header validation

## Automated proof

The v0.2 suite first performs an ordinary MON O cold boot. It then overwrites
the complete payload at 8000h, clears `DSK!`, clears Bus trace and resumes at
CPU address 0000h. Assertions require byte-exact payload restoration, renewed
banner/signature, one READ command, 128 DATA reads, RAM fetches at 0000h and
8000h, and zero Boot/Extension ROM fetches. A second machine ejects A: and must
display the error through loaded CBIOS before HALT.

All 23 package stages pass: PHASE1A–1J, PHASE2A/2A.1, BIOS/MON, Keyboard,
pageable firmware, RAM handoff, execution pace, trace, block device, CBIOS,
system disk, warm boot, source, one-page artifact and Technical Manual.

Generated artifacts:

- one-page: 207,142 bytes / SHA-256
  `257e3135d15ac354db281e7ea076fae219e0cb44619b8e692a96108e0362bd05`
- Technical Manual: 1,997,245 bytes / SHA-256
  `c83e1a76a8521bf1d1bdcb1ae1f10e884d92cd3074c3296893733a6c9642ffd8`
- CBIOS source SHA-256
  `0d63d3e94deb2dc03ef2078139eec1560e47c341360f7eb2a6a1613f9b1036ca`

Bundled Node Playwright drove installed Chrome at 1440×1000 and 390×844.
The standalone app still cold-boots through MON O and exposes page-zero,
`DSK!`, FULL RAM and S80B media state. The updated manual exposes WBOOT v0.2,
FA00h–FC7Ah and 635 bytes. App/manual console warning/error, page error,
network request and horizontal overflow findings are all zero. Screenshots were
visually inspected. The tracked Python smoke still lacks a local Python
Playwright package; equivalent Node browser coverage supplies this evidence.
`git diff --check` passes.

## Boundary

No CCP, BDOS, filesystem, CP/M image or BASIC is present. This phase changes
CBIOS and generated media only; CPU, mapper, block protocol, CG-ROM and DM-80
rendering remain unchanged.
