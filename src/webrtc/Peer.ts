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
}
