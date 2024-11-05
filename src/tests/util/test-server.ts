import { buildServer } from "../../lib/build-server.js";

async function buildTestServer() {
	const server = await buildServer({
		OPENAI_KEY: "sk...",
		OPENAI_MODEL: "gpt-4o-mini",
		OPENAI_EMBEDDING_MODEL: "text-embedding-ada-002",
		CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT: 30000,
		CHAT_COMPLETION_GENERATED_ANSWER_TOKEN_LIMIT: 2048,
		BEST_GUESS_ESTIMATION_TOKEN_FACTOR: 4.5,
		CHAT_COMPLETION_TEMPERATURE: 0,
	});
	return server;
}
export { buildTestServer };
