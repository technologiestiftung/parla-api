import { buildServer } from "./build-server.js";
import assert from "node:assert/strict";

const test = async () => {
	const app = buildServer({ OPENAI_MODEL: "gpt-3.5-turbo", OPENAI_KEY: "" });

	const response = await app.inject({
		method: "GET",
		url: "/",
	});

	assert.ok(response.statusCode === 200);
	assert.deepStrictEqual(response.body, "OK");
};
test();
