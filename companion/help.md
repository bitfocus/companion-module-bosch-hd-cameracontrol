# Bosch HD Camera Control Module

## Overview
This module provides TCP servers for controlling video switching and camera presets on other devices then those listed in HD Camera Control.

## No Configuration Required
This module automatically starts the necessary TCP servers on ports 80 5000 and 10001.

## TCP Servers

### Video Switcher Server (Port 5000)
- Emulates Kramer MV-6(6 inputs) or TvOne Corio(8 inputs) devices
- Updates the `kramer_vid_in` variable or updates the `TvOne_vid_in` variable with the input number which will let user create triggers for use with whatever switcher is supported by Companion.

### Camera Preset Server (Port 80)
- Supports 6 cameras (cam1 to cam6)
- Updates corresponding preset variables:
  - `cam1_preset`
  - `cam2_preset`
  - `cam3_preset`
  - `cam4_preset`
  - `cam5_preset`
  - `cam6_preset`

To control preset recall on other PTZ cameras then supported by HD Camera Control use IP address of Companion for all of them and use Sony protocol. To distinguish the cameras use usernames as listed bellow
 
- Camera 1: username `cam1` no password
- Camera 2: username `cam2` no password
- Camera 3: username `cam3` no password
- Camera 4: username `cam4` no password
- Camera 5: username `cam5` no password
- Camera 6: username `cam6` no password

The module will update corresponding camera variables when it recieves a preset change which the user can use in a trigger to control any PTZ camera that is supported by Companion.

#### Logging
The module logs all incoming commands for debugging purposes, including:
- Client connection details
- Received commands
- Variable updates
- Any errors encountered during communication
