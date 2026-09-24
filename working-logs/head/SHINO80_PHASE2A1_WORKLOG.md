# SHINO-80 PHASE 2A.1 WORKLOG

Updated: 2026-09-24T22:55:00+09:00

Human feedback:
- full A-H VRAM diagnostic confirmed visually
- large top/bottom blank area identified
- user rejected logical safe-margin tricks because future GVRAM and alternate resolutions must remain clean
- user specified DISPLAY itself is replaceable hardware
- user requested monitor bezel identity and system telemetry moved to footer

Implemented:
- removed fixed 4:3 CRT assumption
- removed 96% canvas safe-margin scaling
- TEXT VIDEO BOARD now publishes signal geometry
- CRT viewport follows VIDEO signal width/height dynamically
- canvas occupies the complete logical display surface
- removed monitor-bottom machine/debug information band
- moved machine/debug information into footer
- added DM-80 bezel identity
- added SHINOMIYA maker mark
- added GREEN MONO DIGITAL DISPLAY type mark
- separated TEXT VIDEO BOARD and DM-80 in DEVICE DOCK
- reserved future physical monitor controls

Retained:
- POWER / warm RESET
- IPL A-H full-screen display test
- IPL VRAM clear
- CG-ROM top/bottom blank scanlines
- MONITOR_LOOP 009Ch

Human correction: monitor frame/bezel stays rounded, but the actual raster viewport must have square corners. Updated DM-80 so the logical display area has border-radius 0 while the physical bezel retains its radius.
