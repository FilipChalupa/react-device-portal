import { Peer } from './Peer'

export class Responder extends Peer {
	role = 'responder' as const

	protected async connect() {
		const offer = await this.getRemoteDescription()
		if (!offer) {
			return
		}
		this.initializeConnectionAndChannel()
		if (!this.connection) {
			return
		}

		this.connection.setRemoteDescription(offer)
		const answer = await this.connection.createAnswer()
		await this.setAndShareLocalDescription(answer)

		await this.acquireIceCandidatesLoop()
	}
}
