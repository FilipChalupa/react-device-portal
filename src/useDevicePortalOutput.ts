import { useState } from 'react'
import { Responder } from './webrtc/Responder'

// @TODO: warn if one room is used by multiple useDevicePortalOutput hooks more than once at the same time

const responders: {
	[room: string]: {
		responder: Responder
		firstValuePromise: Promise<string>
		value: null | { value: string }
	}
} = {}

export const useDevicePortalOutput = (room: string) => {
	const [valueState, setValueState] = useState<{
		room: string
		value: string
	} | null>(null)
	if (!responders[room]) {
		const { promise: firstValuePromise, resolve: firstValueResolve } =
			Promise.withResolvers<string>()
		console.log('Create responder')
		const responder = new Responder(room, (value) => {
			console.log('Received value:', value)
			responders[room].value = { value }
			console.log('Will update state')
			console.log(setValueState)
			setValueState((p) => {
				console.log('previous state', p)
				return { room, value }
			})
			firstValueResolve(value)
			console.log('done')
		})
		responders[room] = {
			responder,
			firstValuePromise,
			value: null,
		}
	}
	console.log(
		valueState !== null && valueState.room === room,
		valueState,
		'!==',
		null,
		'&&',
		valueState?.room,
		'===',
		room,
	)
	if (valueState !== null && valueState.room === room) {
		return valueState.value
	}
	if (responders[room].value !== null) {
		return responders[room].value.value
	}

	throw responders[room].firstValuePromise
}
