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

test("default health check route should return 200", async (t) => {
	const opts: InjectOptions = {
		method: "GET",
		url: { pathname: "/", hostname: "localhost", port: 8888, protocol: "http" },
	};
	const response = await t.context.server.inject(opts);

	t.is(response.statusCode, 200);
	t.is(response.body, JSON.stringify({ message: "OK" }));
});
