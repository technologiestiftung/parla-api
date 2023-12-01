import test from "ava";
import { InjectOptions } from "fastify";
import { server } from "./util/test-server.js";

test.after(async () => {
	await server.close();
});

test("default health check route", async (t) => {
	const opts: InjectOptions = {
		method: "GET",
		url: { pathname: "/", hostname: "localhost", port: 8888, protocol: "http" },
	};
	const responseRoot = await server.inject(opts);

	t.is(responseRoot.statusCode, 200);
	t.is(responseRoot.body, JSON.stringify({ message: "OK" }));

	const responseHealth = await server.inject(opts);

	t.is(responseHealth.statusCode, 200);
	t.is(responseHealth.body, JSON.stringify({ message: "OK" }));
});
