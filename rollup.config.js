import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import path from 'path'
import del from 'rollup-plugin-delete'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import preserveDirectives from 'rollup-plugin-preserve-directives'
import typescript from 'rollup-plugin-typescript2'
import packageJson from './package.json' with { type: 'json' }

const outputDirectory = path.parse(packageJson.main).dir

export default {
	input: './src/index.ts',
	output: {
		dir: outputDirectory,
		format: 'esm',
		sourcemap: true,
		preserveModules: true,
	},
	external: ['react'],
	plugins: [
		del({ targets: outputDirectory + '/*' }),
		peerDepsExternal(),
		postcss({
			extract: true,
			modules: true,
		}),
		resolve(),
		commonjs(),
		typescript(),
		preserveDirectives(),
	],
}
