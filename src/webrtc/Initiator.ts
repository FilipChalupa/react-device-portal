import { settings } from '../settings'
import { Peer } from './Peer'

export class Initiator extends Peer {
	protected value: { value: string } | null = null
	otherPeer = 'responder' as const

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
		const answer = await this.getRemoteDescription()
		if (!answer) {
			return
		}
		this.connection.setRemoteDescription(answer)

		await this.acquireIceCandidatesLoop()
	}

	public send = (value: string) => {
		if (this.channel?.readyState === 'open') {
			this.channel.send(value)
		}
		this.value = { value }
	}
}
