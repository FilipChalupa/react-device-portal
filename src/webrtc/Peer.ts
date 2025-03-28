import { delay } from '../delay'
import { settings } from '../settings'
export abstract class Peer {
	protected isDestroyed = false
	protected connection: RTCPeerConnection | null = null
	protected channel: RTCDataChannel | null = null

	constructor(protected readonly room: string) {}

	public destroy = () => {
		this.isDestroyed = true
		this.connection?.close()
		this.channel?.close()
	}

	protected acquireIceCandidatesLoop = async (
		otherPeer: 'initiator' | 'responder',
	) => {
		let lastPeerIceCandidateCreatedAt = null
		while (!this.isDestroyed) {
			const response = await fetch(
				`${settings.webrtcSignalingServer}/api/v1/${this.room}/${otherPeer}/ice-candidate`,
			)
			const data = await response.json()
			if (data.data !== null && data.data.length > 0) {
				const newCandidates = data.data
					.filter(
						(item) =>
							lastPeerIceCandidateCreatedAt === null ||
							item.createdAt > lastPeerIceCandidateCreatedAt,
					)
					.map(({ payload }) => new RTCIceCandidate(JSON.parse(payload)))
				for (const candidate of newCandidates) {
					await this.connection?.addIceCandidate(candidate)
				}
				lastPeerIceCandidateCreatedAt = data.data.at(-1).createdAt
			}
			await delay(
				this.connection?.connectionState === 'connected' ? 5000 : 2000,
			)
			if (this.connection?.connectionState === 'closed') {
				return
			}
		}
	}
}
