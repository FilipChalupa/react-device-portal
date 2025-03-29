import { useEffect, useRef, useState } from 'react'
import { Initiator } from './webrtc/Initiator'

// @TODO: warn if one room is used by multiple useDevicePortalInput hooks more than once at the same time

export const useDevicePortalInput = (
	room: string,
	value: string,
	onValueFromOutput?: (value: string) => void,
) => {
	const [initiator, setInitiator] = useState<Initiator | null>(null)
	const onValueFromOutputRef = useRef(onValueFromOutput)
	onValueFromOutputRef.current = onValueFromOutput

	useEffect(() => {
		const initiator = new Initiator(encodeURIComponent(room), (value) => {
			onValueFromOutputRef.current?.(value)
		})
		setInitiator(initiator)

		return () => {
			initiator.destroy()
			setInitiator(null)
		}
	}, [room])

	useEffect(() => {
		initiator?.send(value)
	}, [value, initiator])
}
