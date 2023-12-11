import { config } from "dotenv";
config({ path: "./.env.test" });

export default {
	require: [],
	timeout: "20s",
	files: ["src/tests/**/*", "!src/tests/api_test.ts", "!src/tests/util/**/*"],
	// "no-worker-threads": false,
	typescript: {
		rewritePaths: {
			"src/": "dist/",
		},
		compile: "tsc",
	},
};
