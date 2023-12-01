import test from "ava";
import { InjectOptions } from "fastify";
import { server } from "./util/test-server.js";

test.after(async () => {
	await server.close();
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
	const responseRoot = await server.inject(opts);

	t.is(responseRoot.statusCode, 200);
	t.deepEqual(
		responseRoot.body,
		JSON.stringify({ processed_documents_count: 1 }),
	);
});
