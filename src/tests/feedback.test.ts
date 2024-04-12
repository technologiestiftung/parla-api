import anyTest, { TestFn } from "ava";
import { FastifyInstance, InjectOptions } from "fastify";
import { buildTestServer } from "./util/test-server.js";
const test = anyTest as TestFn<{ server: FastifyInstance }>;

test.beforeEach(async (t) => {
	const server = await buildTestServer();
	t.context = { server };
});
test.afterEach(async (t) => {
	await t.context.server.close();
});

test("feedbacks route should return all feedbacks and 200", async (t) => {
	const opts: InjectOptions = {
		method: "GET",
		url: {
			pathname: "/feedbacks",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
	};
	const response = await t.context.server.inject(opts);

	t.is(response.statusCode, 200);
	t.is(
		response.body,
		JSON.stringify([
			{ id: 1, tag: null, kind: "positive" },
			{
				id: 2,
				tag: "Antwort inhaltlich falsch oder missverständlich",
				kind: "negative",
			},
			{ id: 3, tag: "Es gab einen Fehler", kind: "negative" },
			{ id: 4, tag: "Antwort nicht ausführlich genug", kind: "negative" },
			{ id: 5, tag: "Dokumente unpassend", kind: "negative" },
		]),
	);
});

test("feedbacks route with querystring should return only one response and 200", async (t) => {
	const opts: InjectOptions = {
		method: "GET",
		url: {
			pathname: "/feedbacks",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
			query: { id: "1" },
		},
	};
	const response = await t.context.server.inject(opts);
	t.is(response.statusCode, 200);
	t.is(response.body, JSON.stringify([{ id: 1, tag: null, kind: "positive" }]));
});

test("feedbacks route with wrong querystring should return 404", async (t) => {
	const opts: InjectOptions = {
		method: "GET",
		url: {
			pathname: "/feedbacks",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
			query: { id: "999" },
		},
	};
	const response = await t.context.server.inject(opts);
	t.is(response.statusCode, 404);
});

test("feedbacks route options should return 200", async (t) => {
	const opts: InjectOptions = {
		method: "OPTIONS",
		url: {
			pathname: "/feedbacks",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
	};
	const response = await t.context.server.inject(opts);
	t.is(response.statusCode, 200);
});

test("feedbacks route head should return 200", async (t) => {
	const opts: InjectOptions = {
		method: "HEAD",
		url: {
			pathname: "/feedbacks",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
	};
	const response = await t.context.server.inject(opts);
	t.is(response.statusCode, 200);
});

test("feedbacks route POST should return 400 due to missing body", async (t) => {
	const opts: InjectOptions = {
		method: "POST",
		url: {
			pathname: "/feedbacks",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
	};
	const response = await t.context.server.inject(opts);
	t.is(response.statusCode, 400);
});

test("feedbacks route POST should return 415 due to missing header of content type", async (t) => {
	const opts: InjectOptions = {
		method: "POST",
		url: {
			pathname: "/feedbacks",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
		body: JSON.stringify({}),
	};
	const response = await t.context.server.inject(opts);
	t.is(response.statusCode, 415);
});

test("feedbacks route POST should return 400 due to missing properties in body ", async (t) => {
	const opts: InjectOptions = {
		method: "POST",
		url: {
			pathname: "/feedbacks",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({}),
	};
	const response = await t.context.server.inject(opts);
	t.is(response.statusCode, 400);
});

test("feedbacks route POST should return 400 due to missing property feedback_id in body ", async (t) => {
	const opts: InjectOptions = {
		method: "POST",
		url: {
			pathname: "/feedbacks",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({ user_request_id: 1 }),
	};
	const response = await t.context.server.inject(opts);

	t.is(response.statusCode, 400);
	t.is(
		response.body,
		JSON.stringify({
			statusCode: 400,
			code: "FST_ERR_VALIDATION",
			error: "Bad Request",
			message: "body must have required property 'feedback_id'",
		}),
	);
});

test("feedbacks route POST should return 400 due to missing property user_request_id in body ", async (t) => {
	const opts: InjectOptions = {
		method: "POST",
		url: {
			pathname: "/feedbacks",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({ feedback_id: 1 }),
	};
	const response = await t.context.server.inject(opts);

	t.is(response.statusCode, 400);
	t.is(
		response.body,
		JSON.stringify({
			statusCode: 400,
			code: "FST_ERR_VALIDATION",
			error: "Bad Request",
			message: "body must have required property 'user_request_id'",
		}),
	);
});

test("feedbacks route POST should return 400 due to wrong property user_request_id in body", async (t) => {
	const opts: InjectOptions = {
		method: "POST",
		url: {
			pathname: "/feedbacks",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({ feedback_id: 1, user_request_id: 100000 }),
	};
	const response = await t.context.server.inject(opts);
	// FIXME: This will change with PR https://github.com/technologiestiftung/parla-api/pull/87
	t.is(response.statusCode, 500);

	t.is(
		response.body,
		JSON.stringify({ message: "No user request found", data: {} }),
	);
});

test("feedbacks route POST should return 400 due to wrong property feedback_id in body", async (t) => {
	const opts: InjectOptions = {
		method: "POST",
		url: {
			pathname: "/feedbacks",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({ feedback_id: 999999, user_request_id: "jR" }),
	};
	const response = await t.context.server.inject(opts);
	// FIXME: This will change with PR https://github.com/technologiestiftung/parla-api/pull/87
	t.is(response.statusCode, 500);

	t.is(
		response.body,
		JSON.stringify({ message: "No feedback found", data: {} }),
	);
});

test("feedbacks route POST should return 201", async (t) => {
	const feedback_id = 1;
	const opts: InjectOptions = {
		method: "POST",
		url: {
			pathname: "/feedbacks",
			hostname: "localhost",
			port: 8888,
			protocol: "http",
		},
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({ feedback_id, user_request_id: "jR" }),
	};
	const response = await t.context.server.inject(opts);
	t.is(response.statusCode, 201);

	const alteredBody = JSON.stringify(
		JSON.parse(response.body).map((item: Record<string, unknown>) => ({
			...item,
			created_at: undefined,
		})),
	);
	// we remove the created_at field because it is dynamic
	t.snapshot(alteredBody);
	t.is(JSON.parse(response.body)[0].feedback_id, feedback_id);
});
