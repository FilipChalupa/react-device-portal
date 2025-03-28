import { delay } from '../delay'
import { settings } from '../settings'
import { Peer } from './Peer'

export class Responder extends Peer {
	constructor(
		protected readonly room: string,
		protected readonly onValue: (value: string) => void,
	) {
		super(room)
		this.connect()
	}

	protected connect = async () => {
		const offer = await (async () => {
			while (!this.isDestroyed) {
				const response = await fetch(
					`${settings.webrtcSignalingServer}/api/v1/${this.room}/initiator/local-description`,
				)
				const data = await response.json()
				console.log(data)
				if (data.data?.payload) {
					return JSON.parse(data.data.payload)
				}
				await delay(1000)
			}
		})()
		console.log('Offer received:', offer)
		this.connection = new RTCPeerConnection()
		this.connection.onicecandidate = async (event) => {
			if (event.candidate) {
				console.log('ICE candidate:', event.candidate)
				await fetch(
					`${settings.webrtcSignalingServer}/api/v1/${this.room}/responder/ice-candidate`,
					{
						method: 'POST',
						body: JSON.stringify(event.candidate.toJSON()),
					},
				)
			}
		}
		this.connection.oniceconnectionstatechange = () => {
			console.log('ICE connection state:', this.connection?.iceConnectionState)
		}
		this.connection.onconnectionstatechange = () => {
			console.log('Connection state:', this.connection?.connectionState)
		}
		this.connection.ondatachannel = (event) => {
			this.channel = event.channel
			this.channel.onopen = (event) => {
				console.log('Channel opened', event)
			}
			this.channel.onmessage = (event) => {
				console.log('Message received on data channel:', event.data)
				this.onValue(event.data)
			}
		}

		this.connection.setRemoteDescription(offer)
		const answer = await this.connection.createAnswer()
		await this.connection.setLocalDescription(answer)
		await fetch(
			`${settings.webrtcSignalingServer}/api/v1/${this.room}/responder/local-description`,
			{
				method: 'POST',
				body: JSON.stringify(answer),
			},
		)
		console.log('Answer created:', answer)
		console.log(JSON.stringify(this.connection.localDescription))

		let lastPeerIceCandidateCreatedAt = null
		while (!this.isDestroyed) {
			const response = await fetch(
				`${settings.webrtcSignalingServer}/api/v1/${this.room}/initiator/ice-candidate`,
			)
			const data = await response.json()
			console.log(data)
			if (data.data !== null && data.data.length > 0) {
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
					await this.connection.addIceCandidate(candidate)
				}
				lastPeerIceCandidateCreatedAt = data.data.at(-1).createdAt
			}
			await delay(
				this.connection?.connectionState === 'connected' ? 5000 : 2000,
			)
			if (this.connection.connectionState === 'closed') {
				return
			}
		}
	}
}
