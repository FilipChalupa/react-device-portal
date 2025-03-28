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
				if (data.data?.payload) {
					return JSON.parse(data.data.payload)
				}
				await delay(1000)
			}
		})()
		this.connection = new RTCPeerConnection()
		this.connection.onicecandidate = async (event) => {
			if (event.candidate) {
				await fetch(
					`${settings.webrtcSignalingServer}/api/v1/${this.room}/responder/ice-candidate`,
					{
						method: 'POST',
						body: JSON.stringify(event.candidate.toJSON()),
					},
				)
			}
		}
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

		await this.acquireIceCandidatesLoop('initiator')
	}
}
