import { useEffect } from 'react'
import { delay } from './delay'
import { settings } from './settings'

export const useDevicePortalInput = (room: string, value: string) => {
	useEffect(() => {
		;(async () => {
			const roomSlug = encodeURIComponent(room)
			const connection = new RTCPeerConnection()
			const channel = connection.createDataChannel(settings.channel)
			channel.onopen = () => {
				console.log('Channel opened')

				channel.send('Hello from initiator!')
			}
			channel.onmessage = (event) => {
				console.log('Message received:', event.data)
			}
			connection.onicecandidate = async (event) => {
				if (event.candidate) {
					console.log('ICE candidate:', event.candidate)
					await fetch(
						`${settings.webrtcSignalingServer}/api/v1/${roomSlug}/initiator/ice-candidate`,
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
				channel.onmessage = (event) => {
					console.log('Message received on data channel:', event.data)
				}
			}
			const offer = await connection.createOffer()
			await connection.setLocalDescription(offer)
			await fetch(
				`${settings.webrtcSignalingServer}/api/v1/${roomSlug}/initiator/local-description`,
				{
					method: 'POST',
					body: JSON.stringify(offer),
				},
			)
			console.log('Offer created:', offer)
			console.log(JSON.stringify(connection.localDescription))
			const answer = await (async () => {
				while (true) {
					const response = await fetch(
						`${settings.webrtcSignalingServer}/api/v1/${roomSlug}/responder/local-description`,
					)
					const data = await response.json()
					console.log(data)
					if (data.data?.payload) {
						return JSON.parse(data.data.payload)
					}
					await delay(1000)
				}
			})()
			connection.setRemoteDescription(answer)

			let lastPeerIceCandidateCreatedAt = null
			while (true) {
				const response = await fetch(
					'http://localhost:8080/api/v1/experiment/initiator/ice-candidate',
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
						.map(({ payload }) => new RTCIceCandidate(JSON.parse(payload)))
					console.log({ newCandidates })
					for (const candidate of newCandidates) {
						console.log('Add ICE candidate:', candidate)
						await connection.addIceCandidate(candidate)
					}
					lastPeerIceCandidateCreatedAt = data.data.at(-1).createdAt
				}
				await delay(2000)
			}
		})()

		return () => {
			// @TODO: handle abort
		}
	}, [room])
}
