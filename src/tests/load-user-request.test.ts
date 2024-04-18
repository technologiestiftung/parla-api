import anyTest, { TestFn } from "ava";
import { buildTestServer } from "./util/test-server.js";
import { FastifyInstance, InjectOptions } from "fastify";
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

test("load user request should return reconstructed request/response object", async (t) => {
	const opts: InjectOptions = {
		method: "GET",
		url: {
			pathname: "/requests/jR", // jR is encoded short id for numeric id = 1
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
		headers: {
			"Content-Type": "application/json",
		},
	};
	const response = await t.context.server.inject(opts);
	let responseJson = response.json();
	const feedbacks = responseJson.feedbacks.map((f: any) => {
		const reduced = f;
		delete reduced.created_at;
		return reduced;
	});
	responseJson.feedbacks = feedbacks;
	t.is(response.statusCode, 200);
	t.snapshot(responseJson);
});
