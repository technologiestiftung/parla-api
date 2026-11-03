import testEmbeddingResponse from "./embeddings.json" assert { type: "json" };
import testGenAnswerReqBody from "./generate-answer-req-body.json" assert { type: "json" };
import testAnswer from "./answer.json" assert { type: "json" };
const testEmbedding: number[] = testEmbeddingResponse.data[0].embedding;

const testSearchQuery = "Wann kommen die Solaranlagen nach Pankow?";
const seededUserRequestShortId = "seeded_short_id_1";

export type XTestErrorTypes = "OPENAI_API_KEY_ERROR";

const testOpenAIApiKeyError = {
	error: {
		message:
			"Incorrect API key provided: $OPENAI_***_KEY. You can find your API key at https://platform.openai.com/account/api-keys.",
		type: "invalid_request_error",
		param: null,
		code: "invalid_api_key",
	},
};

export {
	testOpenAIApiKeyError,
	testEmbedding,
	testSearchQuery,
	seededUserRequestShortId,
	testEmbeddingResponse,
	testAnswer,
	testGenAnswerReqBody,
};
