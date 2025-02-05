export function getConfigFields() {
    return [
        {
            type: 'static-text',
            id: 'info',
            label: 'Information',
            value: 'This module does not require any configuration. It automatically starts two TCP servers: one on port 5000 for video switching and another on port 80 for camera preset control.'
        }
    ]
}
