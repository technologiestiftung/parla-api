import { http, HttpResponse } from "msw";
import {
	testAnswer,
	testOpenAIApiKeyError,
	testModerationResponse,
	testSearchQueryFlagged,
	XTestErrorTypes,
} from "../tests/util/fixtures.js";
import { testEmbeddingResponse } from "../tests/util/fixtures.js";
export const handlers = [
	http.post(
		"https://api.openai.com/v1/chat/completions",
		async ({ request }) => {
			const body = (await request.json()) as {
				messages: { role: "system" | "user"; content: string }[];
			};
			if (body?.messages[1].content === "") {
				// fail the request
				const res = new HttpResponse(undefined, { status: 404 });
				return res;
			}
			return HttpResponse.json(testAnswer);
		},
	),
	http.post("https://api.openai.com/v1/moderations", async ({ request }) => {
		if (
			request.headers.has("x-test-error") &&
			request.headers.get("x-test-error") ===
				("OPENAI_API_KEY_ERROR" as XTestErrorTypes)
		) {
			return new HttpResponse(JSON.stringify(testOpenAIApiKeyError), {
				status: 401,
			});
		}

		const body = (await request.json()) as { input: string };
		if (body.input.includes(testSearchQueryFlagged)) {
			return HttpResponse.json({
				results: [{ flagged: true }],
			});
		}
		return HttpResponse.json(testModerationResponse);
	}),
	http.post("https://api.openai.com/v1/embeddings", () => {
		return HttpResponse.json(testEmbeddingResponse);
	}),
];
