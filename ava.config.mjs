import { config } from "dotenv";
config({ path: "./.env.test" });

export default {
	require: [],
	files: ["src/tests/**/*", "!src/tests/api_test.ts", "!src/tests/util/**/*"],
	typescript: {
		rewritePaths: {
			"src/": "dist/",
		},
		compile: "tsc",
	},
};
