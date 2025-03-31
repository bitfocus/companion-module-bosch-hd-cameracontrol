// variables.js

module.exports = {
	updateVariableDefinitions(instance) {
		const variables = [
			{ variableId: 'kramer_vid_in', name: 'Kramer Video Input' },
			{ variableId: 'cam1_preset', name: 'Camera 1 Preset' },
			{ variableId: 'cam2_preset', name: 'Camera 2 Preset' },
			{ variableId: 'cam3_preset', name: 'Camera 3 Preset' },
			{ variableId: 'cam4_preset', name: 'Camera 4 Preset' },
			{ variableId: 'cam5_preset', name: 'Camera 5 Preset' },
			{ variableId: 'cam6_preset', name: 'Camera 6 Preset' },
			{ variableId: 'cam7_preset', name: 'Camera 7 Preset' },
			{ variableId: 'cam8_preset', name: 'Camera 8 Preset' },
			{ variableId: 'TvOne_vid_in', name: 'TvOne Video Input' },
		]
		instance.setVariableDefinitions(variables)
	},

	initializeVariables(instance) {
		// Initialize variables with default values
		instance.setVariableValues({
			kramer_vid_in: '0',
			cam1_preset: '0',
			cam2_preset: '0',
			cam3_preset: '0',
			cam4_preset: '0',
			cam5_preset: '0',
			cam6_preset: '0',
			cam7_preset: '0',
			cam8_preset: '0',
			TvOne_vid_in: '0',
		})
	},
}