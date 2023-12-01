import anyTest, { TestFn } from "ava";
import { FastifyInstance, InjectOptions } from "fastify";
import { buildTestServer } from "./util/test-server.js";
import { testSearchQuery } from "./util/fixtures.js";
const test = anyTest as TestFn<{ server: FastifyInstance }>;

test.before(async (t) => {
	const server = await buildTestServer();
	t.context = { server };
});
test.after(async (t) => {
	await t.context.server.close();
});

test.skip("search document", async (t) => {
	const opts: InjectOptions = {
		method: "POST",
		url: {
			pathname: "/vector-search",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			query: testSearchQuery,
		}),
	};
	const responseRoot = await t.context.server.inject(opts);

	t.is(responseRoot.statusCode, 200);
	console.log(responseRoot.body);
	t.deepEqual(
		responseRoot.body,
		JSON.stringify({ processed_documents_count: 1 }),
	);
});
