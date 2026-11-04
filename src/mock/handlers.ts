import { http, HttpResponse } from "msw";
import {
	testAnswer,
	testLLMBaseUrl,
	testLLMApiKeyError,
	XTestErrorTypes,
} from "../tests/util/fixtures.js";
import { testEmbeddingResponse } from "../tests/util/fixtures.js";
export const handlers = [
	http.post(`${testLLMBaseUrl}/chat/completions`, async ({ request }) => {
		const body = (await request.json()) as {
			messages: { role: "system" | "user"; content: string }[];
		};
		if (body?.messages[1].content === "") {
			// fail the request
			const res = new HttpResponse(undefined, { status: 404 });
			return res;
		}
		return HttpResponse.json(testAnswer);
	}),
	http.post(`${testLLMBaseUrl}/embeddings`, ({ request }) => {
		if (
			request.headers.has("x-test-error") &&
			request.headers.get("x-test-error") ===
				("LLM_API_KEY_ERROR" as XTestErrorTypes)
		) {
			return new HttpResponse(JSON.stringify(testLLMApiKeyError), {
				status: 401,
			});
		}
		return HttpResponse.json(testEmbeddingResponse);
	}),
];
