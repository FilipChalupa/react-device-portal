import type { Meta, StoryObj } from '@storybook/react'
import { FunctionComponent, useState } from 'react'
import './Example.stories.css'
import { useDevicePortalInput } from './useDevicePortalInput'
import { useDevicePortalOutput } from './useDevicePortalOutput'

const meta: Meta<FunctionComponent> = {
	title: 'Demo',
} satisfies Meta<FunctionComponent>

export default meta
type Story = StoryObj<typeof meta>

const room =
	localStorage.getItem('room') ??
	`storybook-${Math.random().toString(36).substring(2, 7)}`
localStorage.setItem('room', room)

const InputComponent: FunctionComponent = () => {
	const [value, setState] = useState(1)
	useDevicePortalInput(room, value.toString())

	return (
		<div>
			<p>Providing value:</p>
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
	const value = useDevicePortalOutput(room)
	return (
		<div>
			<p>Value provided by the input is:</p>
			<output>{value}</output>
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
				<OutputComponent />
			</div>
		)
	},
}
