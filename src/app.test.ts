import { InjectOptions } from "fastify";
import { buildServer } from "./lib/build-server.js";
import assert from "node:assert/strict";

const test = async () => {
	const app = await buildServer({
		OPENAI_MODEL: "gpt-3.5-turbo",
		OPENAI_KEY: "",
	});

	const opts: InjectOptions = {
		method: "GET",
		url: { pathname: "/", hostname: "localhost", port: 8888, protocol: "http" },
	};
	const response = await app.inject(opts);

	assert.ok(response.statusCode === 200);
	assert.deepStrictEqual(response.body, "OK");
};
test();
