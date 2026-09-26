# SHINO-80 firmware

This directory contains implemented original SHINO-80 firmware and generated
firmware images, including:

- RESET/IPL and ROM BIOS
- interactive Monitor
- native 8×16 CG-ROM
- pageable firmware and RAM handoff support
- original RAM-resident SHINO CBIOS
- S80B System Disk builder and loader
- CP/M 2.2 integration metadata and filesystem/starter-file builders

Firmware is Z80 code/data executed by the emulated CPU. It remains separate
from JavaScript device and UI behavior.

Do not add proprietary ROM dumps or existing-machine BIOS images. Third-party
CP/M CCP/BDOS sources, permission and hashes are isolated under
`third_party/cpm22/`.
