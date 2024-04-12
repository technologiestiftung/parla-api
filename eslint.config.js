import globals from "globals";
import tsbConfig from "@technologiestiftung/eslint-config";
import { plugin as tsbPlugin } from "@technologiestiftung/eslint-plugin";

// eslint-disable-next-line @technologiestiftung/no-default-export
export default [
	...tsbConfig,
	{
		files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				...globals.node,
			},
		},
		rules: {
			"@technologiestiftung/no-default-export": "error",
		},
		plugins: { "@technologiestiftung": tsbPlugin },
	},
];
