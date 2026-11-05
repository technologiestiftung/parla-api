import anyTest, { TestFn } from "ava";
import { FastifyInstance } from "fastify";
const test = anyTest as TestFn<{ server: FastifyInstance }>;
import { createPrompt, CreatePromptOptions } from "../lib/create-prompt.js";
import { testParlaConfig, testSearchQuery } from "./util/fixtures.js";
import { supabase } from "../lib/supabase.js";
test("create prompt", async (t) => {
	const { data: regDoc } = await supabase
		.from("registered_documents")
		.select("*")
		.single();
	const { data: procDoc } = await supabase
		.from("processed_documents")
		.select("*")
		.single();
	const { data: procDocSummary } = await supabase
		.from("processed_document_summaries")
		.select("*")
		.single();
	const { data: procDocChunks } = await supabase
		.from("processed_document_chunks")
		.select("*")
		// All chunks share the same similarity, so the snapshot depends on this order
		.order("id");

	if (
		!procDoc ||
		!regDoc ||
		!procDocSummary ||
		!procDocChunks ||
		procDocChunks?.length === 0
	) {
		throw new Error("No documents found");
	}
	const options: CreatePromptOptions = {
		documentMatches: [
			{
				registered_document: regDoc,
				processed_document: procDoc,
				processed_document_summary_match: {
					processed_document_summary: procDocSummary,
					similarity: 1,
				},
				processed_document_chunk_matches: procDocChunks.map((doc) => ({
					processed_document_chunk: doc,
					similarity: 1,
				})),
				similarity: 1,
			},
		],
		sanitizedQuery: testSearchQuery,
		includeSummary: true,
	};
	const prompt = await createPrompt(options, testParlaConfig);
	t.snapshot(prompt);
	t.truthy(Object.hasOwn(prompt.chatCompletionRequest, "model"));
	t.truthy(Object.hasOwn(prompt.chatCompletionRequest, "stream"));
	t.truthy(Object.hasOwn(prompt.chatCompletionRequest, "temperature"));
	t.truthy(Object.hasOwn(prompt.chatCompletionRequest, "max_tokens"));
	t.truthy(Object.hasOwn(prompt.chatCompletionRequest, "messages"));
	t.truthy(Array.isArray(prompt.chatCompletionRequest.messages));
	t.truthy(prompt.chatCompletionRequest.messages.length > 0);
	t.truthy(prompt.chatCompletionRequest.messages.length === 2);
	t.is(prompt.chatCompletionRequest.messages[0].role, "system");
	t.is(prompt.chatCompletionRequest.messages[1].role, "user");
	t.is(prompt.chatCompletionRequest.messages[1].content, testSearchQuery);
});
