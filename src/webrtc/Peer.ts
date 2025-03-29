import { delay } from '../delay'
import { settings } from '../settings'
export abstract class Peer {
	protected isDestroyed = false
	protected connection: RTCPeerConnection | null = null
	protected channel: RTCDataChannel | null = null
	protected abstract role: 'initiator' | 'responder'
	protected value: { value: string } | null = null
	protected readonly onValue: ((value: string) => void) | undefined
	protected readonly sendLastValueOnConnectAndReconnect: boolean

	constructor(
		protected readonly room: string,
		options: {
			onValue?: (value: string) => void
			sendLastValueOnConnectAndReconnect?: boolean
		} = {},
	) {
		this.onValue = options.onValue
		this.sendLastValueOnConnectAndReconnect =
			options.sendLastValueOnConnectAndReconnect ?? true
		this.connect()
	}

	protected abstract connect(): Promise<void>

	public destroy() {
		this.isDestroyed = true
		this.connection?.close()
		this.channel?.close()
	}

	protected getOtherPeerRole() {
		return this.role === 'initiator' ? 'responder' : 'initiator'
	}

	protected async acquireIceCandidatesLoop() {
		let lastPeerIceCandidateCreatedAt = null
		while (!this.isDestroyed) {
			const response = await fetch(
				`${settings.webrtcSignalingServer}/api/v1/${this.room}/${this.getOtherPeerRole()}/ice-candidate`,
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

	protected async getRemoteDescription(): Promise<RTCSessionDescriptionInit | null> {
		while (!this.isDestroyed) {
			const response = await fetch(
				`${settings.webrtcSignalingServer}/api/v1/${this.room}/${this.getOtherPeerRole()}/local-description`,
			)
			const data = await response.json()
			if (data.data?.payload) {
				return JSON.parse(data.data.payload)
			}
			await delay(1000)
		}
		return null
	}

	protected async setAndShareLocalDescription(
		description: RTCSessionDescriptionInit,
	) {
		if (!this.connection) {
			throw new Error('Connection is not initialized')
		}
		await this.connection.setLocalDescription(description)
		await fetch(
			`${settings.webrtcSignalingServer}/api/v1/${this.room}/${this.role}/local-description`,
			{
				method: 'POST',
				body: JSON.stringify(description),
			},
		)
	}

	protected async shareNewIceCandidate(event: RTCPeerConnectionIceEvent) {
		if (event.candidate) {
			await fetch(
				`${settings.webrtcSignalingServer}/api/v1/${this.room}/${this.role}/ice-candidate`,
				{
					method: 'POST',
					body: JSON.stringify(event.candidate.toJSON()),
				},
			)
		}
	}

	public send(value: string) {
		if (this.channel?.readyState === 'open') {
			this.channel.send(value)
		}
		this.value = { value }
	}

	protected initializeConnectionAndChannel() {
		this.connection = new RTCPeerConnection()
		this.connection.onicecandidate = this.shareNewIceCandidate.bind(this)
		this.channel = this.connection.createDataChannel(settings.channel.label, {
			negotiated: true,
			id: settings.channel.id,
		})
		this.channel.onopen = () => {
			if (this.value && this.sendLastValueOnConnectAndReconnect) {
				this.channel?.send(this.value.value)
			}
		}
		this.channel.onmessage = (event) => {
			this.onValue?.(event.data)
		}
	}
}
