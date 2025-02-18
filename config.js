export function getConfigFields() {
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
