import type { Meta, StoryObj } from '@storybook/react'
import { FunctionComponent } from 'react'
import './Example.stories.css'

const Demo: FunctionComponent = () => {
	return '@TODO'
}

const meta: Meta<typeof Demo> = {
	title: 'Demo',
} satisfies Meta<typeof Demo>

export default meta
type Story = StoryObj<typeof meta>

export const Main: Story = {
	render: () => {
		return (
			<div className="wrapper">
				<h1>Demo</h1>
				<Demo />
			</div>
		)
	},
}
