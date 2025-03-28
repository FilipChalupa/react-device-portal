import { settings } from '../settings'
import { Peer } from './Peer'

export class Initiator extends Peer {
	protected value: { value: string } | null = null
	role = 'initiator' as const

	constructor(room: string) {
		super(room)
		this.connect()
	}

	protected connect = async () => {
		this.connection = new RTCPeerConnection()
		this.connection.onicecandidate = this.shareNewIceCandidate
		this.channel = this.connection.createDataChannel(settings.channel)
		this.channel.onopen = () => {
			if (this.value) {
				this.channel?.send(this.value.value)
			}
		}
		this.channel.onmessage = (event) => {
			// @TODO: handle message from responder
		}
		const offer = await this.connection.createOffer()
		await this.setAndShareLocalDescription(offer)
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
