# src/devices

SHINO-80 peripheral implementations live here.

Current devices:

- `shino80/shino80-keyboard.js` — low-byte-decoded `20h` DATA / `21h`
  STATUS ports with a 64-byte host-input FIFO
- `shino80/shino80-media-profiles.js` — immutable PHASE 3 profile/DPB model;
  Checkpoint A defines all five native profiles
- `shino80/shino80-block-device.js` — independent A:/B: native-profile media,
  transferred through low-byte-decoded PIO ports `30h`–`38h`; Checkpoint B adds
  HEAD / MEDIA_PROFILE, per-profile CHS and 128/512/1024-byte physical sectors
  while legacy CLASSIC constants and `30h`–`36h` behavior remain compatible

Planned domains include:

- video
- physical/mechanical floppy controller
- uart
- printer
- timer
- sound

Create a device directory when that device enters an approved implementation PLAN.
