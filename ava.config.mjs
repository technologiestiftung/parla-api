import { config } from "dotenv";
config({ path: "./.env.test" });

export default {
	require: [],
	files: ["src/tests/**/*", "!src/tests/api_test.ts", "!src/tests/util/**/*"],
	"no-worker-threads": true,
	typescript: {
		rewritePaths: {
			"src/": "dist/",
		},
		compile: "tsc",
	},
};
