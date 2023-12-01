import anyTest, { TestFn } from "ava";

import { FastifyInstance, InjectOptions } from "fastify";
import { buildTestServer } from "./util/test-server.js";
const test = anyTest as TestFn<{ server: FastifyInstance }>;

test.before(async (t) => {
	const server = await buildTestServer();
	t.context = { server };
});
test.after(async (t) => {
	await t.context.server.close();
});
test("count documents should return 1 doc", async (t) => {
	const opts: InjectOptions = {
		method: "GET",
		url: {
			pathname: "/processed_documents/count",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
	};
	const responseRoot = await t.context.server.inject(opts);

	t.is(responseRoot.statusCode, 200);
	t.deepEqual(
		responseRoot.body,
		JSON.stringify({ processed_documents_count: 1 }),
	);
});
