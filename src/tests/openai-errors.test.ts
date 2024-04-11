import anyTest, { TestFn } from "ava";
import { FastifyInstance, InjectOptions } from "fastify";
import { buildTestServer } from "./util/test-server.js";
import { mockServer } from "../mock/node.js";
import {
	XTestErrorTypes,
	testOpenAIApiKeyError,
	testSearchQueryFlagged,
} from "./util/fixtures.js";

const test = anyTest as TestFn<{ server: FastifyInstance }>;

test.before(async (t) => {
	mockServer.listen();
	const server = await buildTestServer();
	t.context = { server };
});

test.afterEach(async () => {
	mockServer.resetHandlers();
});

test.after(async (t) => {
	await t.context.server.close();
	mockServer.close();
});

test.only("openai error vector search 401 due to missing or wrong openai api key", async (t) => {
	const opts: InjectOptions = {
		method: "POST",
		headers: {
			"x-test-error": "OPENAI_API_KEY_ERROR" as XTestErrorTypes,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query: "errrr" }),
		url: {
			pathname: "/vector-search/",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
	};
	const response = await t.context.server.inject(opts);

	t.is(response.statusCode, 401);
	t.is(
		response.body,
		JSON.stringify({
			endpoint: "moderation",
			statusText: testOpenAIApiKeyError,
		}),
	);
});
