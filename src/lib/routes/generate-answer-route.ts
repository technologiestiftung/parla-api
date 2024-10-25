import { FastifyInstance } from "fastify";
import { ParlaConfig } from "../../index.js";
import { GenerateAnswerBody } from "../common.js";
import { createPrompt } from "../create-prompt.js";
import { DatabaseError, OpenAIError } from "../errors.js";
import {
	generateAnswerBodySchema,
	generatedAnswerResponseSchema,
} from "../json-schemas.js";
import { OpenAIClient } from "../llm/openai-client.js";
import { supabase } from "../supabase.js";

export function generateAnswerRoute(
	app: FastifyInstance,
	parlaConfig: ParlaConfig,
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
			const { query, include_summary_in_response_generation, documentMatches } =
				request.body;

			const createPromptOptions = {
				documentMatches,
				sanitizedQuery: query,
				includeSummary: include_summary_in_response_generation,
			};

			const generatedPrompt = createPrompt(createPromptOptions, parlaConfig);

			const llm = new OpenAIClient(parlaConfig.OPENAI_KEY);
			let generatedAnswer: string = "";

			const then = new Date();
			try {
				const stream = await llm.requestResponseStream(
					generatedPrompt.openAIChatCompletionRequest,
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
					summary_ids_in_context: generatedPrompt.summaryIdsInContext,
					chunk_ids_in_context: generatedPrompt.chunkIdsInContext,
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
