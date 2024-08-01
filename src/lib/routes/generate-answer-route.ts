import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { GenerateAnswerBody } from "../common.js";
import { createPrompt } from "../create-prompt.js";
import {
	generateAnswerBodySchema,
	generatedAnswerResponseSchema,
} from "../json-schemas.js";
import { OpenAIClient } from "../llm/openai-client.js";
import { DatabaseError, OpenAIError } from "../errors.js";
import { supabase } from "../supabase.js";

interface GenerateAnswerRoutePluginOptions extends FastifyPluginOptions {
	OPENAI_MODEL: string;
	OPENAI_KEY: string;
}
export function generateAnswerRoute(
	app: FastifyInstance,
	options: GenerateAnswerRoutePluginOptions,
	next: (err?: Error | undefined) => void,
) {
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
			switch (options.OPENAI_MODEL) {
				case "gpt-4o-mini": {
					MAX_CONTENT_TOKEN_LENGTH = 128000;
					break;
				}
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
				OPENAI_MODEL: options.OPENAI_MODEL,
				sanitizedQuery: query,
				MAX_TOKENS,
				temperature,
				includeSummary: include_summary_in_response_generation,
			});

			const llm = new OpenAIClient(options.OPENAI_KEY);
			let generatedAnswer: string = "";

			const then = new Date();
			try {
				const stream = await llm.requestResponseStream(
					chatCompletionRequest,
					(delta) => {
						generatedAnswer += delta;
					},
				);
				await reply.status(201).send(stream);
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new OpenAIError("Failed to create completion", {
						endpoint: "chat/completions",
						status: 500,
						statusText: error.message,
						userRequestId: request.body.userRequestId,
					});
				}
				throw error;
			}

			const now = new Date();
			const elapsedMs = now.getTime() - then.getTime();

			const { error } = await supabase
				.from("user_requests")
				.update({
					generated_answer: generatedAnswer,
					chat_completion_time_ms: elapsedMs,
				})
				.eq("short_id", request.body.userRequestId)
				.select("*");

			if (error) {
				throw new DatabaseError(
					`Could not save generated answer to database: ${error.message}`,
				);
			}

			return reply;
		},
	);

	next();
}
