import anyTest, { TestFn } from "ava";
import { FastifyInstance, InjectOptions } from "fastify";
import { buildTestServer } from "./util/test-server.js";
import { testSearchQuery, testSearchQueryFlagged } from "./util/fixtures.js";
import { mockServer } from "../mock/node.js";
import {
	AvailableSearchAlgorithms,
	DocumentSearchResponse,
} from "../lib/common.js";
import { checkSearchDocStructure } from "./util/check-search-document-structure.js";
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

test("search document (chunks and summaries) should return a document", async (t) => {
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
			search_algorithm:
				AvailableSearchAlgorithms.ChunksAndSummaries /* this is the default */,
		}),
	};
	const response = await t.context.server.inject(opts);
	const json = JSON.parse(response.payload) as DocumentSearchResponse;
	t.is(response.statusCode, 201);

	checkSearchDocStructure(t, json);
});

test("search document (chunks only) should return a document", async (t) => {
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
			search_algorithm: AvailableSearchAlgorithms.ChunksOnly,
		}),
	};
	const response = await t.context.server.inject(opts);
	const json = JSON.parse(response.payload) as DocumentSearchResponse;
	t.is(response.statusCode, 201);
	checkSearchDocStructure(t, json);
});

test("search document (summary then chunks) should return a document", async (t) => {
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
			search_algorithm: AvailableSearchAlgorithms.SummaryThenChunks,
		}),
	};
	const response = await t.context.server.inject(opts);
	const json = JSON.parse(response.payload) as DocumentSearchResponse;
	t.is(response.statusCode, 201);
	checkSearchDocStructure(t, json);
});
test("search document with flagged moderation should return 500", async (t) => {
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
			query: testSearchQueryFlagged,
		}),
	};
	const response = await t.context.server.inject(opts);
	t.is(response.statusCode, 500);
	t.snapshot(response.json());
});
