import { FastifyInstance } from "fastify";
import { ParlaConfig } from "../../index.js";
import { GenerateAnswerBody } from "../common.js";
import { createPrompt } from "../create-prompt.js";
import { DatabaseError, LLMError } from "../errors.js";
import {
	generateAnswerBodySchema,
	generatedAnswerResponseSchema,
} from "../json-schemas.js";
import { CompletionStreamStats } from "../llm/llm-client.js";
import { OpenAIClient } from "../llm/openai-client.js";
import { supabase } from "../supabase.js";

async function hasStoredAnswer(userRequestId: string): Promise<boolean> {
	const { data, error } = await supabase
		.from("user_requests")
		.select("generated_answer")
		.eq("short_id", userRequestId)
		.maybeSingle();

	if (error) {
		throw new DatabaseError(`Could not load user request: ${error.message}`);
	}

	return Boolean(data?.generated_answer);
}

// Returns false if nothing was updated (request missing or answer already stored)
async function saveGeneratedAnswer(
	userRequestId: string,
	columns: Record<string, unknown>,
): Promise<boolean> {
	// `is null` guard: on concurrent calls, only the first write wins.
	const { data, error } = await supabase
		.from("user_requests")
		.update(columns)
		.eq("short_id", userRequestId)
		.is("generated_answer", null)
		.select("short_id");

	if (error) {
		throw new DatabaseError(
			`Could not save generated answer to database: ${error.message}`,
		);
	}

	return data.length > 0;
}

function toStreamStatsColumns(stats: CompletionStreamStats | undefined) {
	if (!stats) {
		return {
			chat_completion_first_chunk_ms: null,
			chat_completion_first_thinking_ms: null,
			chat_completion_first_text_ms: null,
			chat_completion_thinking_chars: null,
			chat_completion_input_tokens: null,
			chat_completion_output_tokens: null,
			chat_completion_reasoning_tokens: null,
		};
	}
	return {
		chat_completion_first_chunk_ms: stats.firstChunkMs,
		chat_completion_first_thinking_ms: stats.firstThinkingMs,
		chat_completion_first_text_ms: stats.firstTextMs,
		chat_completion_thinking_chars: stats.thinkingChars,
		chat_completion_input_tokens: stats.inputTokens,
		chat_completion_output_tokens: stats.outputTokens,
		chat_completion_reasoning_tokens: stats.reasoningTokens,
	};
}

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
			if (userRequestId && (await hasStoredAnswer(userRequestId))) {
				return reply.status(409).send({
					message: "An answer for this request has already been generated",
				});
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
			// Assigned in the callback, the cast keeps TS from narrowing it to undefined
			let streamStats = undefined as CompletionStreamStats | undefined;
			// What was actually sent, to verify the env value reaches the provider
			const sentReasoningEffort =
				generatedPrompt.chatCompletionRequest.reasoning_effort ?? null;

			const then = new Date();
			try {
				const stream = await llm.requestResponseStream(
					generatedPrompt.chatCompletionRequest,
					(delta) => {
						generatedAnswer += delta;
					},
					(stats) => {
						streamStats = stats;
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

			request.log.info(
				{
					userRequestId,
					model: generatedPrompt.chatCompletionRequest.model,
					reasoningEffort: sentReasoningEffort,
					totalMs: elapsedMs,
					...streamStats,
				},
				"chat completion stats",
			);

			if (!userRequestId) {
				return reply;
			}

			const saved = await saveGeneratedAnswer(userRequestId, {
				generated_answer: generatedAnswer,
				chat_completion_time_ms: elapsedMs,
				summary_ids_in_context: generatedPrompt.summaryIdsInContext,
				chunk_ids_in_context: generatedPrompt.chunkIdsInContext,
				llm_reasoning_effort: sentReasoningEffort,
				...toStreamStatsColumns(streamStats),
			});

			if (!saved) {
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
