import anyTest, { TestFn } from "ava";
import { buildTestServer } from "./util/test-server.js";
import { FastifyInstance, InjectOptions } from "fastify";
import { testGenAnswerReqBody } from "./util/fixtures.js";
import { mockServer } from "../mock/node.js";

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

test("generate answer route should respond with 201", async (t) => {
	const opts: InjectOptions = {
		method: "POST",
		url: {
			pathname: "/generate-answer",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(testGenAnswerReqBody),
	};
	const response = await t.context.server.inject(opts);
	t.is(response.statusCode, 201);
});
test("generate answer route should respond with 500", async (t) => {
	const opts: InjectOptions = {
		method: "POST",
		url: {
			pathname: "/generate-answer",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ ...testGenAnswerReqBody, query: "" }),
	};
	const response = await t.context.server.inject(opts);
	t.is(response.statusCode, 400);
	t.snapshot(JSON.parse(response.body));
});
