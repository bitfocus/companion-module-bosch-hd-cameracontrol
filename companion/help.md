# Bosch HD Camera Control Module

## Overview
This module provides TCP servers for controlling video switching and camera presets.

## TCP Servers

### Video Switcher Server (Port 5000)
- Emulates Kramer MV-6 device
- Accepts commands in the format: `#SRC-VID 1,1` or `#SRC-VID 1,3`
- Updates the `kramer_vid_in` variable with the input number

### Camera Preset Server (Port 80)
- Supports 6 cameras (cam1 to cam6)
- Uses HTTP Basic Authentication
- Accepts preset commands: `command/presetposition.cgi?Parameter=VALUE`
- Updates corresponding preset variables:
  - `cam1_preset`
  - `cam2_preset`
  - `cam3_preset`
  - `cam4_preset`
  - `cam5_preset`
  - `cam6_preset`

## Authentication
- Camera 1: username `cam1`
- Camera 2: username `cam2`
- Camera 3: username `cam3`
- Camera 4: username `cam4`
- Camera 5: username `cam5`
- Camera 6: username `cam6`

## No Configuration Required
This module automatically starts the necessary TCP servers on ports 5000 and 80.

