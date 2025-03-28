let value: null | { value: string } = null
let promise: null | Promise<string> = null

export const useDevicePortalOutput = (room: string) => {
	console.log('loop')

	if (value !== null) {
		console.log('return value')
		return value.value
	}
	if (promise === null) {
		console.log('initialize promise')
		promise = new Promise((resolve) => {
			console.log('start timer')
			setTimeout(() => {
				console.log('timer')
				value = { value: 'Hello' }
				resolve('Hello')
			}, 2000)
		})
	}
	console.log('throw promise')
	throw promise
}
