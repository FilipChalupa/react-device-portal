import { delay } from './delay'
import { settings } from './settings'

let value: null | { value: string } = null
let promise: null | Promise<string> = null

export const useDevicePortalOutput = (room: string) => {
	if (value !== null) {
		return value.value
	}
	if (promise === null) {
		console.log('initialize promise')
		promise = new Promise(async (resolve) => {
			const roomSlug = encodeURIComponent(room)
			const offer = await (async () => {
				while (true) {
					const response = await fetch(
						`${settings.webrtcSignalingServer}/api/v1/${roomSlug}/initiator/local-description`,
					)
					const data = await response.json()
					console.log(data)
					if (data.data?.payload) {
						return JSON.parse(data.data.payload)
					}
					await delay(1000)
				}
			})()
			const connection = new RTCPeerConnection()
			// const channel = connection.createDataChannel('data')
			// channel.onopen = () => {
			// 	console.log('Channel opened')
			// }
			// channel.onmessage = (event) => {
			// 	console.log('Message received:', event.data)
			// }
			connection.onicecandidate = async (event) => {
				if (event.candidate) {
					console.log('ICE candidate:', event.candidate)
					await fetch(
						`${settings.webrtcSignalingServer}/api/v1/${roomSlug}/responder/ice-candidate`,
						{
							method: 'POST',
							body: JSON.stringify(event.candidate.toJSON()),
						},
					)
				}
			}
			connection.oniceconnectionstatechange = () => {
				console.log('ICE connection state:', connection.iceConnectionState)
			}
			connection.onconnectionstatechange = () => {
				console.log('Connection state:', connection.connectionState)
			}
			connection.ondatachannel = (event) => {
				const { channel } = event
				channel.onopen = (event) => {
					console.log('Channel opened', event)
				}
				channel.onmessage = (event) => {
					console.log('Message received on data channel:', event.data)
					value = { value: event.data }
					resolve(event.data) // @TODO: handle more data
				}
			}

			connection.setRemoteDescription(offer)
			const answer = await connection.createAnswer()
			await connection.setLocalDescription(answer)
			await fetch(
				`${settings.webrtcSignalingServer}/api/v1/${roomSlug}/responder/local-description`,
				{
					method: 'POST',
					body: JSON.stringify(answer),
				},
			)
			console.log('Answer created:', answer)
			console.log(JSON.stringify(connection.localDescription))

			let lastPeerIceCandidateCreatedAt = null
			while (true) {
				const response = await fetch(
					`${settings.webrtcSignalingServer}/api/v1/${roomSlug}/initiator/ice-candidate`,
				)
				const data = await response.json()
				console.log(data)
				if (data.data.length > 0) {
					const newCandidates = data.data
						.filter(
							(item) =>
								lastPeerIceCandidateCreatedAt === null ||
								item.createdAt > lastPeerIceCandidateCreatedAt,
						)
						.map(({ payload }) => {
							console.log(payload)
							return new RTCIceCandidate(JSON.parse(payload))
						})
					console.log({ newCandidates })
					for (const candidate of newCandidates) {
						console.log('Add ICE candidate:', candidate)
						await connection.addIceCandidate(candidate)
					}
					lastPeerIceCandidateCreatedAt = data.data.at(-1).createdAt
				}
				await delay(2000)
			}
		})
	}
	throw promise
}
