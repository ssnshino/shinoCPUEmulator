# src/devices

SHINO-80 peripheral implementations live here.

Current device:

- `shino80/shino80-keyboard.js` — low-byte-decoded `20h` DATA / `21h`
  STATUS ports with a 64-byte host-input FIFO

Planned domains include:

- video
- floppy
- uart
- printer
- timer
- sound

Create a device directory when that device enters an approved implementation PLAN.
