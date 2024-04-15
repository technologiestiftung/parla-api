import { http, HttpResponse } from "msw";
import {
	testAnswer,
	testModerationResponse,
	testSearchQueryFlagged,
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
