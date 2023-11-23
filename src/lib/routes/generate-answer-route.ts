import { FastifyInstance } from "fastify";
import { GenerateAnswerBody, GenerateAnswerResponse } from "../common.js";
import { createPrompt } from "../create-prompt.js";
import { ApplicationError } from "../errors.js";
import { registerCors } from "../handle-cors.js";
import {
	generateAnswerBodySchema,
	generatedAnswerResponseSchema,
} from "../json-schemas.js";

export async function registerGenerateAnswerRoute(
	fastify: FastifyInstance,
	OPENAI_MODEL: string,
	OPENAI_KEY: string,
) {
	await fastify.register(
		async (app, options, next) => {
			await registerCors(app);
			app.post<{
				Body: GenerateAnswerBody;
			}>(
				"/",
				{
					schema: {
						body: generateAnswerBodySchema,
						response: generatedAnswerResponseSchema,
					},
				},
				async (request, reply) => {
					let MAX_CONTENT_TOKEN_LENGTH = 1500;
					const MAX_TOKENS = 2048;
					// set MAX_CONTENT_LENGTH based on the openai model
					// models we use
					// - gpt-4 has max tokens length of 8192
					// - gpt-3.5-turbo has max tokens length of 4096
					// - gpt-3.5-turbo-16k has max tokens length of 16384
					// Reference: https://platform.openai.com/docs/models/overview
					switch (OPENAI_MODEL) {
						case "gpt-4": {
							MAX_CONTENT_TOKEN_LENGTH = 8192;
							break;
						}
						case "gpt-3.5-turbo": {
							MAX_CONTENT_TOKEN_LENGTH = 4096;
							break;
						}
						case "gpt-3.5-turbo-16k": {
							MAX_CONTENT_TOKEN_LENGTH = 16384;
							break;
						}
						default: {
							MAX_CONTENT_TOKEN_LENGTH = 1500;
							break;
						}
					}
					const {
						query,
						include_summary_in_response_generation,
						temperature,
						documentMatches,
					} = request.body;

					const chatCompletionRequest = createPrompt({
						documentMatches,
						MAX_CONTENT_TOKEN_LENGTH,
						OPENAI_MODEL,
						sanitizedQuery: query,
						MAX_TOKENS,
						temperature,
						includeSummary: include_summary_in_response_generation,
					});

					console.log(chatCompletionRequest);

					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					const response = await fetch(
						"https://api.openai.com/v1/chat/completions",
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${OPENAI_KEY}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify(chatCompletionRequest),
						},
					);

					if (response.status !== 200) {
						throw new ApplicationError(
							"Failed to create completion for question",
							{ response },
						);
					}

					let gptAnswer = await response.json();

					const res = { answer: gptAnswer } as GenerateAnswerResponse;

					reply.status(201).send(res);
				},
			);

			next();
		},
		{ prefix: "/generate-answer" },
	);
}
