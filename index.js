import { InstanceBase, runEntrypoint, InstanceStatus } from '@companion-module/base'
import * as net from 'node:net'
import { getConfigFields } from './config.js'

class BoschHDCameraControlInstance extends InstanceBase {
    constructor(internal) {
        super(internal)
        this.kramerVideoServer = null
        this.cameraPresetServer = null
    }

    getConfigFields() {
        return getConfigFields()
    }

    async init(config) {
        this.config = config
        this.initVariables()
        this.initActions()
        this.initTCPServers()
    }

    initVariables() {
        const variables = [
            { variableId: 'kramer_vid_in', name: 'Kramer Video Input' },
            { variableId: 'cam1_preset', name: 'Camera 1 Preset' },
            { variableId: 'cam2_preset', name: 'Camera 2 Preset' },
            { variableId: 'cam3_preset', name: 'Camera 3 Preset' },
            { variableId: 'cam4_preset', name: 'Camera 4 Preset' },
            { variableId: 'cam5_preset', name: 'Camera 5 Preset' },
            { variableId: 'cam6_preset', name: 'Camera 6 Preset' }
        ]
        this.setVariableDefinitions(variables)

        // Initialize variables with default values
        this.setVariableValues({
            kramer_vid_in: '0',
            cam1_preset: '0',
            cam2_preset: '0',
            cam3_preset: '0',
            cam4_preset: '0',
            cam5_preset: '0',
            cam6_preset: '0'
        })
    }

    initActions() {
        // Define actions if needed
    }

    initTCPServers() {
        // Kramer Video Switcher Emulation Server (Port 5000)
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

        // Camera Preset CGI Server (Port 80)
        this.cameraPresetServer = net.createServer((socket) => {
            this.log('info', `Camera Preset Server: New client connected from ${socket.remoteAddress}:${socket.remotePort}`)

            socket.on('data', (data) => {
                const request = data.toString()
                this.log('debug', `Camera Preset Server: Received request: ${request}`)

                const authMatch = request.match(/Authorization: Basic\s+(.+)\r\n/i)
                const presetMatch = request.match(/command\/presetposition\.cgi\?Parameter=(\d+)/)

                if (authMatch && presetMatch) {
                    const username = Buffer.from(authMatch[1], 'base64').toString().split(':')[0]
                    const presetNumber = presetMatch[1]

                    this.log('info', `Camera Preset Server: Preset request for ${username}, preset ${presetNumber}`)

                    const presetVariableMap = {
                        'cam1': 'cam1_preset',
                        'cam2': 'cam2_preset',
                        'cam3': 'cam3_preset',
                        'cam4': 'cam4_preset',
                        'cam5': 'cam5_preset',
                        'cam6': 'cam6_preset'
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
    }

    async destroy() {
        if (this.kramerVideoServer) {
            this.kramerVideoServer.close()
        }
        if (this.cameraPresetServer) {
            this.cameraPresetServer.close()
        }
    }
}

runEntrypoint(BoschHDCameraControlInstance, [])
