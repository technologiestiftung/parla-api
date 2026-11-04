import anyTest, { TestFn } from "ava";
import { FastifyInstance, InjectOptions } from "fastify";
import { mockServer } from "../mock/node.js";
import { XTestErrorTypes, testLLMApiKeyError } from "./util/fixtures.js";
import { buildTestServer } from "./util/test-server.js";

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

test.only("llm error vector search 401 due to missing or wrong llm api key", async (t) => {
	const opts: InjectOptions = {
		method: "POST",
		headers: {
			"x-test-error": "LLM_API_KEY_ERROR" as XTestErrorTypes,
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
			endpoint: "embeddings",
			statusText: testLLMApiKeyError,
		}),
	);
});
