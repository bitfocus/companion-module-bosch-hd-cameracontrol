import { InstanceBase, runEntrypoint, InstanceStatus } from '@companion-module/base'
import net from 'node:net'
import { updateVariableDefinitions, initializeVariables } from './variables.js'

class BoschHDCameraControlInstance extends InstanceBase {
    constructor(internal) {
        super(internal)
        this.kramerVideoServer = null
        this.cameraPresetServer = null
        this.tvOneVideoServer = null
    }

    static getConfigFields() {
        return [
            {
                type: 'static-text',
                id: 'info',
                label: 'Information',
                value: 'This module does not require any configuration. It automatically starts two TCP servers: one on port 5000 for video switching and another on port 80 for camera preset control.'
            },
            {
                type: 'checkbox',
                id: 'enableKramer',
                label: 'Enable Kramer Video Switcher (Port 5000)',
                width: 12,
                default: true
            },
            {
                type: 'checkbox',
                id: 'enableTvOne',
                label: 'Enable TvOne Video Switcher (Port 10001)',
                width: 12,
                default: true
            },
            {
                type: 'checkbox',
                id: 'enableCameraPreset',
                label: 'Enable Camera Preset Server (Port 80)',
                width: 12,
                default: true
            }
        ]
    }

    // Instance method to bridge to the static one, as a workaround
    getConfigFields() {
        return BoschHDCameraControlInstance.getConfigFields();
    }

    async init(config) {
        this.config = config
        this.initVariables()
        this.initActions()
        this.initTCPServers()
        this.updateStatus(InstanceStatus.Ok)
    }

    async configUpdated(config) {
        this.log('info', 'Configuration updated')
        this.config = config
        
        // Close existing servers
        if (this.kramerVideoServer) {
            this.kramerVideoServer.close()
        }
        if (this.cameraPresetServer) {
            this.cameraPresetServer.close()
        }
        if (this.tvOneVideoServer) {
            this.tvOneVideoServer.close()
        }

        // Reinitialize servers with new configuration
        this.initTCPServers()
        this.updateStatus(InstanceStatus.Ok)
    }

   initVariables() {
       updateVariableDefinitions(this) // Call imported function
       initializeVariables(this)       // Call imported function
   }

    initActions() {
        // Define actions if needed
    }

    initTCPServers() {
        // Kramer Video Switcher Emulation Server (Port 5000)
        if (this.config.enableKramer) {
            this.kramerVideoServer = net.createServer((socket) => {
                this.log('info', `Kramer Video Switcher: New client connected from ${socket.remoteAddress}:${socket.remotePort}`)

                socket.on('data', (data) => {
                    const command = data.toString().trim()
                    this.log('debug', `Kramer Video Switcher: Received command: ${command}`)

                    // Handle #WIN 1 command for initial connection
                    if (command === '#WIN 1') {
                        this.log('info', 'Kramer Video Switcher: Received initial connection command')
                        socket.write(`${command}\r\n`, (err) => {
                            if (err) {
                                this.log('error', `Kramer Video Switcher: Error sending #WIN 1 response: ${err.message}`)
                            }
                        })
                        return
                    }

                    if (command.startsWith('#SRC-VID')) {
                        const match = command.match(/#SRC-VID\s+(\d+),(\d+)/)
                        if (match) {
                            const videoInput = match[2]
                            this.log('info', `Kramer Video Switcher: Setting video input to ${videoInput}`)
                            
                            // Correctly update the variable
                            this.setVariableValues({ kramer_vid_in: videoInput })
                            
                            // Construct a response that mimics the Kramer MV-6 protocol
                            const response = `#SRC-VID ${match[1]},${videoInput}\r\n`
                            this.log('debug', `Kramer Video Switcher: Sending response: ${response.trim()}`)
                            
                            // Ensure the response is sent
                            socket.write(response, (err) => {
                                if (err) {
                                    this.log('error', `Kramer Video Switcher: Error sending response: ${err.message}`)
                                }
                            })
                        } else {
                            this.log('warn', `Kramer Video Switcher: Invalid command format: ${command}`)
                        }
                    } else {
                        this.log('warn', `Kramer Video Switcher: Unrecognized command: ${command}`)
                    }
                })

                socket.on('error', (err) => {
                    this.log('error', `Kramer Video Switcher: Socket error: ${err.message}`)
                })

                socket.on('close', (hadError) => {
                    this.log('info', `Kramer Video Switcher: Client disconnected${hadError ? ' with error' : ''}`)
                })
            })

            this.kramerVideoServer.on('error', (err) => {
                this.log('error', `Kramer Video Switcher Server error: ${err.message}`)
            })

            this.kramerVideoServer.listen(5000, () => {
                this.log('info', 'Kramer Video Switcher Server listening on port 5000')
            })
        } else {
            this.log('info', 'Kramer Video Switcher Server disabled in configuration')
        }

        // TvOne Video Input Server (Port 10001)
        if (this.config.enableTvOne) {
            this.tvOneVideoServer = net.createServer((socket) => {
                this.log('info', `TvOne Video Input Server: New client connected from ${socket.remoteAddress}:${socket.remotePort}`)

                socket.on('data', (data) => {
                    const command = data.toString().trim()
                    this.log('debug', `TvOne Video Input Server: Received command: ${command}`)

                    // Mapping of commands to video inputs
                    const videoInputMap = {
                        'F040041008200005017': '1',
                        'F040041008200005118': '2',
                        'F040041008200005219': '3',
                        'F04004100820000531A': '4',
                        'F04004100820000541B': '5',
                        'F04004100820000551C': '6',
                        'F04004100820000561D': '7',
                        'F04004100820000571E': '8'
                    }

                    const videoInput = videoInputMap[command]
                    if (videoInput) {
                        this.log('info', `TvOne Video Input Server: Setting video input to ${videoInput}`)
                        
                        // Update the TvOne video input variable
                        this.setVariableValues({ TvOne_vid_in: videoInput })
                        
                        // Optional: Send an acknowledgment if needed
                        socket.write(`Input set to ${videoInput}\r\n`, (err) => {
                            if (err) {
                                this.log('error', `TvOne Video Input Server: Error sending response: ${err.message}`)
                            }
                        })
                    } else {
                        this.log('warn', `TvOne Video Input Server: Unrecognized command: ${command}`)
                    }
                })

                socket.on('error', (err) => {
                    this.log('error', `TvOne Video Input Server: Socket error: ${err.message}`)
                })

                socket.on('close', (hadError) => {
                    this.log('info', `TvOne Video Input Server: Client disconnected${hadError ? ' with error' : ''}`)
                })
            })

            this.tvOneVideoServer.on('error', (err) => {
                this.log('error', `TvOne Video Input Server error: ${err.message}`)
            })

            this.tvOneVideoServer.listen(10001, () => {
                this.log('info', 'TvOne Video Input Server listening on port 10001')
            })
        } else {
            this.log('info', 'TvOne Video Input Server disabled in configuration')
        }

        // Camera Preset CGI Server (Port 80)
        if (this.config.enableCameraPreset) {
            this.cameraPresetServer = net.createServer((socket) => {
                this.log('info', `Camera Preset Server: New client connected from ${socket.remoteAddress}:${socket.remotePort}`)

                socket.on('data', (data) => {
                    const request = data.toString()
                    this.log('debug', `Camera Preset Server: Received request: ${request}`)

                    const authMatch = request.match(/Authorization: Basic\s+(.+)\r\n/i)
                    const presetMatch = request.match(/command\/presetposition\.cgi\?PresetCall=(\d+),(\d+)/)

                    if (authMatch && presetMatch) {
                        const username = Buffer.from(authMatch[1], 'base64').toString().split(':')[0]
                        const presetNumber = presetMatch[1] // First number is the preset number we want

                        this.log('info', `Camera Preset Server: Preset request for ${username}, preset ${presetNumber}`)

                        const presetVariableMap = {
                            'cam1': 'cam1_preset',
                            'cam2': 'cam2_preset',
                            'cam3': 'cam3_preset',
                            'cam4': 'cam4_preset',
                            'cam5': 'cam5_preset',
                            'cam6': 'cam6_preset',
                            'cam7': 'cam7_preset',
                            'cam8': 'cam8_preset'
                        }

                        const variableId = presetVariableMap[username]
                        if (variableId) {
                            this.setVariableValues({ [variableId]: presetNumber })
                        } else {
                            this.log('warn', `Camera Preset Server: Unknown username: ${username}`)
                        }

                        // Send a basic HTTP response
                        const response = 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOK'
                        socket.write(response, (err) => {
                            if (err) {
                                this.log('error', `Camera Preset Server: Error sending response: ${err.message}`)
                            }
                        })
                    } else {
                        this.log('warn', `Camera Preset Server: Invalid request format`)
                    }
                })

                socket.on('error', (err) => {
                    this.log('error', `Camera Preset Server: Socket error: ${err.message}`)
                })

                socket.on('close', (hadError) => {
                    this.log('info', `Camera Preset Server: Client disconnected${hadError ? ' with error' : ''}`)
                })
            })

            this.cameraPresetServer.on('error', (err) => {
                this.log('error', `Camera Preset Server error: ${err.message}`)
            })

            this.cameraPresetServer.listen(80, () => {
                this.log('info', 'Camera Preset CGI Server listening on port 80')
            })
        } else {
            this.log('info', 'Camera Preset Server disabled in configuration')
        }
    }

    async destroy() {
        if (this.kramerVideoServer) {
            this.kramerVideoServer.close()
        }
        if (this.cameraPresetServer) {
            this.cameraPresetServer.close()
        }
        if (this.tvOneVideoServer) {
            this.tvOneVideoServer.close()
        }
        this.updateStatus(InstanceStatus.Disconnected)
    }
}

runEntrypoint(BoschHDCameraControlInstance, [])
