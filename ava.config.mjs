import { config } from "dotenv";
config({ path: "./.env.test" });

// eslint-disable-next-line @technologiestiftung/no-default-export
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
