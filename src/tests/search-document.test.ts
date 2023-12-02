import anyTest, { TestFn } from "ava";
import { FastifyInstance, InjectOptions } from "fastify";
import { buildTestServer } from "./util/test-server.js";
import { testSearchQuery, testSearchQueryFlagged } from "./util/fixtures.js";
import { mockServer } from "../mock/node.js";
import {
	AvailableSearchAlgorithms,
	DocumentSearchResponse,
} from "../lib/common.js";
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
	t.snapshot(json);

	t.true(Array.isArray(json.documentMatches));
	t.is(json.documentMatches.length, 1);
	t.true(Object.hasOwn(json, "documentMatches"));
	// structure checks for that matched document
	const [docMatch] = json.documentMatches;

	t.true(Object.hasOwn(docMatch, "registered_document"));
	t.true(Object.hasOwn(docMatch, "processed_document"));
	t.true(Object.hasOwn(docMatch, "processed_document_summary_match"));
	t.true(Object.hasOwn(docMatch, "processed_document_chunk_matches"));
	t.true(Object.hasOwn(docMatch, "similarity"));
	// since we always use the same docs the result should never change
	t.is(docMatch.similarity, 0.882449746131897);
	// structure checks for that registered document
	const regDoc = docMatch.registered_document;
	t.true(Object.hasOwn(regDoc, "id"));
	t.true(Object.hasOwn(regDoc, "source_url"));
	t.true(Object.hasOwn(regDoc, "source_type"));
	t.true(Object.hasOwn(regDoc, "registered_at"));
	t.true(Object.hasOwn(regDoc, "metadata"));
	// structure checks for the document matches
	t.true(Array.isArray(docMatch.processed_document_chunk_matches));
	t.true(docMatch.processed_document_chunk_matches.length === 2);
	const chunkMatch = docMatch.processed_document_chunk_matches[0];
	t.true(Object.hasOwn(chunkMatch, "similarity"));
	t.is(chunkMatch.similarity, 0.865424394607544);
	t.true(Object.hasOwn(chunkMatch, "processed_document_chunk"));
	// matched chunks structure
	const chunk = chunkMatch.processed_document_chunk;
	t.true(Object.hasOwn(chunk, "id"));
	t.true(Object.hasOwn(chunk, "content"));
	t.true(Object.hasOwn(chunk, "page"));
	t.true(Object.hasOwn(chunk, "processed_document_id"));

	// processed_document_summary_match structure
	const summaryMatch = docMatch.processed_document_summary_match;
	t.true(Object.hasOwn(summaryMatch, "processed_document_summary"));
	t.true(Object.hasOwn(summaryMatch, "similarity"));
	// document summary
	t.true(Object.hasOwn(summaryMatch.processed_document_summary, "id"));
	t.true(Object.hasOwn(summaryMatch.processed_document_summary, "summary"));
	t.true(Object.hasOwn(summaryMatch.processed_document_summary, "tags"));
	t.true(
		Object.hasOwn(
			summaryMatch.processed_document_summary,
			"processed_document_id",
		),
	);
	t.is(summaryMatch.similarity, 0.900568902492523);
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

	t.snapshot(json);
	// since we always use the same docs the result should never change
	t.is(json.documentMatches[0].similarity, 0.864330589771271);
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

	t.snapshot(json);
	// since we always use the same docs the result should never change
	t.is(json.documentMatches[0].similarity, 0.900568902492523);
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
	// since we always use the same docs the result should never change
});
