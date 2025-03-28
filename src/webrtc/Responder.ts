import { settings } from '../settings'
import { Peer } from './Peer'

export class Responder extends Peer {
	role = 'responder' as const

	constructor(
		protected readonly room: string,
		protected readonly onValue: (value: string) => void,
	) {
		super(room)
		this.connect()
	}

	protected connect = async () => {
		const offer = await this.getRemoteDescription()
		if (!offer) {
			return
		}
		this.connection = new RTCPeerConnection()
		this.connection.onicecandidate = this.shareNewIceCandidate
		this.connection.ondatachannel = (event) => {
			if (event.channel.label !== settings.channel) {
				return
			}
			this.channel = event.channel
			this.channel.onmessage = (event) => {
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

		await this.acquireIceCandidatesLoop()
	}
}
