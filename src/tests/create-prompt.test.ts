import anyTest, { TestFn } from "ava";
import { FastifyInstance } from "fastify";
const test = anyTest as TestFn<{ server: FastifyInstance }>;
import { createPrompt, CreatePromptOptions } from "../lib/create-prompt.js";
import { testSearchQuery } from "./util/fixtures.js";
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
		.select("*");

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
	const prompt = await createPrompt(options, {
		OPENAI_KEY: "",
		OPENAI_MODEL: "gpt-3.5-turbo",
		OPENAI_EMBEDDING_MODEL: "text-embedding-ada-002",
		CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT: 30000,
		CHAT_COMPLETION_GENERATED_TOKEN_LIMIT: 2048,
		BEST_GUESS_ESTIMATION_TOKEN_FACTOR: 4.5,
		CHAT_COMPLETION_TEMPERATURE: 0,
	});
	t.snapshot(prompt);
	t.truthy(Object.hasOwn(prompt.openAIChatCompletionRequest, "model"));
	t.truthy(Object.hasOwn(prompt.openAIChatCompletionRequest, "stream"));
	t.truthy(Object.hasOwn(prompt.openAIChatCompletionRequest, "temperature"));
	t.truthy(Object.hasOwn(prompt.openAIChatCompletionRequest, "max_tokens"));
	t.truthy(Object.hasOwn(prompt.openAIChatCompletionRequest, "messages"));
	t.truthy(Array.isArray(prompt.openAIChatCompletionRequest.messages));
	t.truthy(prompt.openAIChatCompletionRequest.messages.length > 0);
	t.truthy(prompt.openAIChatCompletionRequest.messages.length === 2);
	t.is(prompt.openAIChatCompletionRequest.messages[0].role, "system");
	t.is(prompt.openAIChatCompletionRequest.messages[1].role, "user");
	t.is(prompt.openAIChatCompletionRequest.messages[1].content, testSearchQuery);
});
