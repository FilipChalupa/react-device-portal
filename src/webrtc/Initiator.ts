import { Peer } from './Peer'

export class Initiator extends Peer {
	role = 'initiator' as const

	protected async connect() {
		this.initializeConnectionAndChannel()
		if (!this.connection) {
			return
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
}
