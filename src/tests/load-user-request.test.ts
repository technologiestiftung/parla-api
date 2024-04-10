import anyTest, { TestFn } from "ava";
import { buildTestServer } from "./util/test-server.js";
import { FastifyInstance, InjectOptions } from "fastify";
import {
	testGenAnswerReqBody,
	testUserRequestResponse,
} from "./util/fixtures.js";
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
			pathname: "/requests/wR", // jR is encoded short id for numeric id = 1
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
		headers: {
			"Content-Type": "application/json",
		},
	};
	const response = await t.context.server.inject(opts);
	t.is(response.statusCode, 200);
	const responseJson = JSON.parse(response.body);
	t.deepEqual(responseJson, testUserRequestResponse);
});
