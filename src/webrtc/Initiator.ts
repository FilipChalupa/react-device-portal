import { delay } from '../delay'
import { settings } from '../settings'
import { Peer } from './Peer'

export class Initiator extends Peer {
	protected value: { value: string } | null = null

	constructor(room: string) {
		super(room)
		this.connect()
	}

	protected connect = async () => {
		this.connection = new RTCPeerConnection()
		this.channel = this.connection.createDataChannel(settings.channel)
		this.channel.onopen = () => {
			if (this.value) {
				this.channel?.send(this.value.value)
			}
		}
		this.channel.onmessage = (event) => {
			// @TODO: handle message from responder
		}
		this.connection.onicecandidate = async (event) => {
			if (event.candidate) {
				await fetch(
					`${settings.webrtcSignalingServer}/api/v1/${this.room}/initiator/ice-candidate`,
					{
						method: 'POST',
						body: JSON.stringify(event.candidate.toJSON()),
					},
				)
			}
		}
		const offer = await this.connection.createOffer()
		await this.connection.setLocalDescription(offer)
		await fetch(
			`${settings.webrtcSignalingServer}/api/v1/${this.room}/initiator/local-description`,
			{
				method: 'POST',
				body: JSON.stringify(offer),
			},
		)
		const answer = await (async () => {
			while (!this.isDestroyed) {
				const response = await fetch(
					`${settings.webrtcSignalingServer}/api/v1/${this.room}/responder/local-description`,
				)
				const data = await response.json()
				if (data.data?.payload) {
					return JSON.parse(data.data.payload)
				}
				await delay(1000)
			}
		})()
		this.connection.setRemoteDescription(answer)

		await this.acquireIceCandidatesLoop('responder')
	}

	public send = (value: string) => {
		if (this.channel?.readyState === 'open') {
			this.channel.send(value)
		}
		this.value = { value }
	}
}
