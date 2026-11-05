import testEmbeddingResponse from "./embeddings.json" with { type: "json" };
import testGenAnswerReqBody from "./generate-answer-req-body.json" with { type: "json" };
import testAnswer from "./answer.json" with { type: "json" };
import type { ParlaConfig } from "../../index.js";
const testEmbedding: number[] = testEmbeddingResponse.data[0].embedding;

const testSearchQuery = "Wann kommen die Solaranlagen nach Pankow?";
const seededUserRequestShortId = "seeded_short_id_1";
// Placeholder base URL for the LLM API; the mocks in src/mock/handlers.ts intercept it
const testLLMBaseUrl = "https://llm.test/v1";

// All LLM requests are mocked, so key and model names are placeholders
const testParlaConfig: ParlaConfig = {
	LLM_API_KEY: "test-api-key",
	LLM_BASE_URL: testLLMBaseUrl,
	LLM_CHAT_MODEL: "test-chat-model",
	LLM_EMBEDDING_MODEL: "test-embedding-model",
	CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT: 30000,
	CHAT_COMPLETION_GENERATED_ANSWER_TOKEN_LIMIT: 2048,
	BEST_GUESS_ESTIMATION_TOKEN_FACTOR: 4.5,
	CHAT_COMPLETION_TEMPERATURE: 0,
};

export type XTestErrorTypes = "LLM_API_KEY_ERROR";

const testLLMApiKeyError = {
	error: {
		message: "Incorrect API key provided.",
		type: "invalid_request_error",
		param: null,
		code: "invalid_api_key",
	},
};

export {
	testLLMApiKeyError,
	testEmbedding,
	testSearchQuery,
	seededUserRequestShortId,
	testLLMBaseUrl,
	testParlaConfig,
	testEmbeddingResponse,
	testAnswer,
	testGenAnswerReqBody,
};
