import { InjectOptions } from "fastify";
import { buildServer } from "../src/lib/build-server.js";
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
	const responseRoot = await app.inject(opts);

	assert.ok(responseRoot.statusCode === 200);
	assert.deepStrictEqual(responseRoot.body, JSON.stringify({ message: "OK" }));

	const responseHealth = await app.inject(opts);

	assert.ok(responseHealth.statusCode === 200);
	assert.deepStrictEqual(
		responseHealth.body,
		JSON.stringify({ message: "OK" }),
	);
};

test();
