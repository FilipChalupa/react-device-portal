import { settings } from '../settings'
import { Peer } from './Peer'

export class Responder extends Peer {
	role = 'responder' as const

	protected async connect() {
		const offer = await this.getRemoteDescription()
		if (!offer) {
			return
		}
		this.connection = new RTCPeerConnection()
		this.connection.onicecandidate = this.shareNewIceCandidate.bind(this)
		this.connection.ondatachannel = (event) => {
			if (event.channel.label !== settings.channel) {
				return
			}
			this.channel = event.channel
			this.channel.onmessage = (event) => {
				this.onValue?.(event.data)
			}
		}

		this.connection.setRemoteDescription(offer)
		const answer = await this.connection.createAnswer()
		await this.setAndShareLocalDescription(answer)

		await this.acquireIceCandidatesLoop()
	}
}
