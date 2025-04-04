import type { Meta, StoryObj } from '@storybook/react'
import { FunctionComponent, Suspense, useRef, useState } from 'react'
import './Example.stories.css'
import { useDevicePortalInput } from './useDevicePortalInput'
import { useDevicePortalOutput } from './useDevicePortalOutput'

const meta: Meta<FunctionComponent> = {
	title: 'Demo',
} satisfies Meta<FunctionComponent>

export default meta
type Story = StoryObj<typeof meta>

const room =
	localStorage.getItem('room') ||
	prompt('Enter room name', localStorage.getItem('room') || 'storybook') ||
	'storybook'
localStorage.setItem('room', room)

const InputComponent: FunctionComponent = () => {
	const ref = useRef<HTMLDivElement>(null)
	const [value, setState] = useState(1)
	useDevicePortalInput(room, value.toString(), (value) => {
		if (value === 'roll') {
			ref.current?.animate(
				[
					{
						transform: 'rotate(1turn)',
					},
				],
				{
					duration: 1000,
				},
			)
		}
	})

	return (
		<div ref={ref} style={{ display: 'inline-block' }}>
			<p>
				Providing value for room "<b>{room}</b>":
			</p>
			<output>{value}</output>
			<div>
				<button
					type="button"
					onClick={() => {
						setState((x) => x - 1)
					}}
				>
					decrease
				</button>{' '}
				<button
					type="button"
					onClick={() => {
						setState((x) => x + 1)
					}}
				>
					increase
				</button>
			</div>
		</div>
	)
}

const OutputComponent: FunctionComponent = () => {
	const { value, sendValueToInput } = useDevicePortalOutput(room)
	return (
		<div>
			<p>
				Value provided by the input in room "<b>{room}</b>" is:
			</p>
			<output>{value}</output>
			<div>
				<button
					type="button"
					onClick={() => {
						sendValueToInput('roll')
					}}
				>
					Do barrel roll
				</button>
			</div>
		</div>
	)
}

export const Input: Story = {
	render: () => {
		return (
			<div className="wrapper">
				<h1>Demo input</h1>
				<InputComponent />
			</div>
		)
	},
}

export const Output: Story = {
	render: () => {
		return (
			<div className="wrapper">
				<h1>Demo output</h1>
				<Suspense fallback={<p>Connecting…</p>}>
					<OutputComponent />
				</Suspense>
			</div>
		)
	},
}
