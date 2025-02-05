# Bosch HD Camera Control Companion Module

## Overview
This Companion module provides TCP servers for controlling video switching and camera presets.

## Features
- Kramer MV-6 Video Switcher Emulation (Port 5000)
- Camera Preset Control via CGI Commands (Port 80)

## TCP Server Details

### Video Switcher Server (Port 5000)
- Emulates Kramer MV-6 device
- Accepts commands like `#SRC-VID 1,1` or `#SRC-VID 1,3`
- Updates `kramer_vid_in` variable with the input number

### Camera Preset Server (Port 80)
- Supports 6 cameras (cam1 to cam6)
- Authentication-based preset recall
- Updates corresponding preset variables:
  - `cam1_preset`
  - `cam2_preset`
  - ...
  - `cam6_preset`

## Usage
1. Ensure ports 5000 and 80 are available
2. Configure your video switcher and cameras to use these servers

## Limitations
- Requires root/admin privileges for port 80
- Basic HTTP authentication used
