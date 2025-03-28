import { useState, type Dispatch, type SetStateAction } from 'react'
import { Responder } from './webrtc/Responder'

// @TODO: warn if one room is used by multiple useDevicePortalOutput hooks more than once at the same time

const responders: {
	[room: string]: {
		responder: Responder
		firstValuePromise: Promise<string>
		value: null | { value: string }
		setValueState: Dispatch<
			SetStateAction<{
				room: string
				value: string
			}>
		>
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
		const responder = new Responder(room, (value) => {
			responders[room].value = { value }
			responders[room].setValueState({ room, value })
			firstValueResolve(value)
		})
		responders[room] = {
			responder,
			firstValuePromise,
			value: null,
			setValueState,
		}
	}
	responders[room].setValueState = setValueState

	if (valueState !== null && valueState.room === room) {
		return valueState.value
	}
	if (responders[room].value !== null) {
		return responders[room].value.value
	}

	throw responders[room].firstValuePromise
}
