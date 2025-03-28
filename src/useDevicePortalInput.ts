import { useEffect, useState } from 'react'
import { Initiator } from './webrtc/Initiator'

// @TODO: warn if one room is used by multiple useDevicePortalInput hooks more than once at the same time

export const useDevicePortalInput = (room: string, value: string) => {
	const [initiator, setInitiator] = useState<Initiator | null>(null)

	useEffect(() => {
		const initiator = new Initiator(encodeURIComponent(room))
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
