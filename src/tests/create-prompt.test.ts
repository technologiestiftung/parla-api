import anyTest, { TestFn } from "ava";
import { FastifyInstance } from "fastify";
const test = anyTest as TestFn<{ server: FastifyInstance }>;
import { createPrompt, CreatePromptOptions } from "../lib/create-prompt.js";
import { testSearchQuery } from "./util/fixtures.js";
import supabase from "../lib/supabase.js";
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
		.select("*");

	if (
		!procDoc ||
		!regDoc ||
		!procDocSummary ||
		!procDocChunks ||
		procDocChunks?.length === 0
	)
		throw new Error("No documents found");
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
		MAX_CONTENT_TOKEN_LENGTH: 4096,
		OPENAI_MODEL: "gpt-3.5-turbo",
		MAX_TOKENS: 2048,
		temperature: 0,
		includeSummary: true,
	};
	const prompt = await createPrompt(options);
	t.snapshot(prompt);
	t.truthy(Object.hasOwn(prompt, "model"));
	t.truthy(Object.hasOwn(prompt, "stream"));
	t.truthy(Object.hasOwn(prompt, "temperature"));
	t.truthy(Object.hasOwn(prompt, "max_tokens"));
	t.truthy(Object.hasOwn(prompt, "messages"));
	t.truthy(Array.isArray(prompt.messages));
	t.truthy(prompt.messages.length > 0);
	t.truthy(prompt.messages.length === 2);
	t.is(prompt.messages[0].role, "system");
	t.is(prompt.messages[1].role, "user");
	t.is(prompt.messages[1].content, testSearchQuery);
});
