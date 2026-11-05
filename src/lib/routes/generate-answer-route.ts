import { FastifyInstance } from "fastify";
import { ParlaConfig } from "../../index.js";
import { GenerateAnswerBody } from "../common.js";
import { createPrompt } from "../create-prompt.js";
import { DatabaseError, LLMError } from "../errors.js";
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
			const {
				query,
				include_summary_in_response_generation,
				documentMatches,
				userRequestId,
			} = request.body;

			// Never replace a stored answer (shared links show it as-is).
			// Check before the LLM call to avoid paying for a discarded answer.
			if (userRequestId) {
				const { data: existingRequest, error: existingRequestError } =
					await supabase
						.from("user_requests")
						.select("generated_answer")
						.eq("short_id", userRequestId)
						.maybeSingle();

				if (existingRequestError) {
					throw new DatabaseError(
						`Could not load user request: ${existingRequestError.message}`,
					);
				}

				if (existingRequest?.generated_answer) {
					return reply.status(409).send({
						message: "An answer for this request has already been generated",
					});
				}
			}

			const createPromptOptions = {
				documentMatches,
				sanitizedQuery: query,
				includeSummary: include_summary_in_response_generation,
			};

			const generatedPrompt = createPrompt(createPromptOptions, parlaConfig);

			const llm = new OpenAIClient(
				parlaConfig.LLM_API_KEY,
				parlaConfig.LLM_BASE_URL,
			);
			let generatedAnswer: string = "";

			const then = new Date();
			try {
				const stream = await llm.requestResponseStream(
					generatedPrompt.chatCompletionRequest,
					(delta) => {
						generatedAnswer += delta;
					},
				);
				await reply.status(201).send(stream);
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new LLMError("Failed to create completion", {
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

			if (!userRequestId) {
				return reply;
			}

			// `is null` guard: on concurrent calls, only the first write wins.
			const { data: updatedRequests, error } = await supabase
				.from("user_requests")
				.update({
					generated_answer: generatedAnswer,
					chat_completion_time_ms: elapsedMs,
					summary_ids_in_context: generatedPrompt.summaryIdsInContext,
					chunk_ids_in_context: generatedPrompt.chunkIdsInContext,
				})
				.eq("short_id", userRequestId)
				.is("generated_answer", null)
				.select("short_id");

			if (error) {
				throw new DatabaseError(
					`Could not save generated answer to database: ${error.message}`,
				);
			}

			if (updatedRequests.length === 0) {
				request.log.warn(
					{ userRequestId },
					"Generated answer not saved: request not found or answer already exists",
				);
			}

			return reply;
		},
	);

	next();
}
