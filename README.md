> [!WARNING]
> Deprecated in favor of [@device-portal/react](https://www.npmjs.com/package/@device-portal/react).

# React device portal

[![NPM](https://img.shields.io/npm/v/react-device-portal.svg)](https://www.npmjs.com/package/react-device-portal) ![npm type definitions](https://img.shields.io/npm/types/shared-loading-indicator.svg)

See [Storybook example here](https://filipchalupa.cz/react-device-portal).

## Install

```bash
npm install react-device-portal
```

## How to use

It is expected that the package will be used on two different devices. Create for them two separate pages or apps. Let's call them App A and App B. Both apps will be linked by same `room` (e.g. `'my-test-room'`).

### App A

The first app will be a value provider or `Input`.

```jsx
const AppA = () => {
	const [value, setValue] = useState(0)
	useDevicePortalInput('my-test-room', value.toString())

	return (
		<>
			<h1>App A</h1>
			<p>Value: {value}</p>
			<button
				onClick={() => {
					setValue(value + 1)
				}}
			>
				Increment
			</button>
		</>
	)
}
```

### App B

The other app will be a value consumer or `Output`. Every time input value in App A changes, the output in App B will be automatically updated.

```jsx
const AppB = () => {
	const { value } = useDevicePortalOutput('my-test-room')

	return (
		<>
			<h1>App B</h1>
			<p>Value: {value}</p>
		</>
	)
}
```

## Server used for WebRTC signaling

[github.com/FilipChalupa/webrtc-signaling-server](https://github.com/FilipChalupa/webrtc-signaling-server)

## Development

Run

```sh
npm ci
npm run dev
```

and

```sh
npm run storybook
```
