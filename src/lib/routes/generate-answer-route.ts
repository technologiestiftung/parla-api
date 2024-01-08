import { FastifyInstance } from "fastify";
import stream from "stream";
import { GenerateAnswerBody } from "../common.js";
import { createPrompt } from "../create-prompt.js";
import { registerCors } from "../handle-cors.js";
import {
	generateAnswerBodySchema,
	generatedAnswerResponseSchema,
} from "../json-schemas.js";
import { OpenAIStream } from "../openai-utils.js";

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

					if (!query || query === "") {
						reply
							.status(400)
							.send({ error: "Query must be defined and must not be empty." });
						return reply;
					}

					const chatCompletionRequest = createPrompt({
						documentMatches,
						MAX_CONTENT_TOKEN_LENGTH,
						OPENAI_MODEL,
						sanitizedQuery: query,
						MAX_TOKENS,
						temperature,
						includeSummary: include_summary_in_response_generation,
					});

					const answerStream = await OpenAIStream(
						chatCompletionRequest,
						OPENAI_KEY,
					);

					const buffer = new stream.Readable();
					buffer._read = () => {};
					const emit = async () => {
						// @ts-ignore
						for await (const chunk of answerStream) {
							buffer.push(chunk);
						}
						buffer.push(null);
					};
					emit();

					reply.status(201).send(buffer);

					return reply;
				},
			);

			next();
		},
		{ prefix: "/generate-answer" },
	);
}
