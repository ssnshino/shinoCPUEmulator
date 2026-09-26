# SHINO-80 System Disk / Loader v0.1 worklog

## Scope

Branch `feature/shino80-system-disk-loader-v01-20260926`, stacked on SHINO
CBIOS v0.1 `4116919` / PR #32. Complete an original disk-to-RAM boot path before
any third-party operating-system import.

## Implementation

- added deterministic `S80B` v1 system-image builder
- reserved track-0 sectors 1–7 for header, payload and CBIOS
- mounted the system image as Virtual Disk A in the ordinary one-page machine
- added ROM Monitor `O` and its bounded seven-sector PIO loader
- delayed page-zero/memory-map mutation until every sector passed
- installed page-zero warm vector `JP FA03h`
- handed off through the existing F800h trampoline to original code at 8000h
- printed the success banner through loaded CBIOS and left `DSK!` at E260h
- exposed SYSTEM v1 media identity and boot hint in the Device inspector
- updated the one-page build and offline Technical Manual

## Exact automated proof

The system-disk suite checks header fields, payload/CBIOS bytes and E5h padding;
missing-media and corrupt-header recovery; exact RAM destinations before first
payload execution; seven READ commands; 896 DATA reads; page-zero bytes; first
post-pageout RAM fetch; absence of later ROM reads; loaded CBIOS output; HALT;
and RESET recovery with mounted-media preservation.

All 22 package stages pass: PHASE1A–1J, PHASE2A/2A.1, BIOS/MON, Keyboard,
pageable firmware, RAM handoff, execution pace, trace, block device, CBIOS,
system disk, source, one-page artifact and Technical Manual.

Generated artifacts:

- one-page: 206,202 bytes / SHA-256
  `d46dfcdad9a0540b2c485e1410e706821518ab4d9f5aac75b563b289039a89de`
- Technical Manual: 1,997,055 bytes / SHA-256
  `8b2951845dccd4fbee796b6fe8f50c3e29a746f8d3b1846e981ea0afe116b182`
- system-disk builder source SHA-256
  `e52ecba2d1de1e341449310b98a20f5f3169345bf9ecd3579d4b8a0dd4415c4f`

Bundled Node Playwright drove installed Chrome because the browser plugin was
not available. At 1440×1000 and 390×844 it powered on the actual standalone
artifact, typed `O` through the keyboard UI, waited for the RAM payload, and
verified page zero `C3 03 FA`, `DSK!` at E260h, FULL RAM and mounted S80B v1 at
track 0/sector 7. App and manual each had zero console warning/error, page
error, network request and horizontal overflow. Four screenshots were visually
inspected; mobile showed only the clean two-line system banner after payload
VRAM clear.

The tracked Python smoke was extended to the same MON O path. Its local Python
Playwright dependency was absent, so equivalent and stronger Node Playwright
coverage supplied the browser evidence. `git diff --check` passes.

## Boundary

All disk content is original project code. There is no CCP, BDOS, filesystem,
CP/M system image or BASIC. No CPU semantics, block-device protocol, mapper,
CG-ROM or DM-80 rendering behavior was changed.
