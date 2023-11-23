import { FastifyInstance } from "fastify";
import {
	AvailableSearchAlgorithms,
	Body,
	ResponseDetail,
	ResponseDocumentMatch,
	SimilaritySearchConfig,
} from "../common.js";
import { createPrompt } from "../create-prompt.js";
import { ApplicationError, UserError } from "../errors.js";
import { registerCors } from "../handle-cors.js";
import { bodySchema, responseSchema } from "../json-schemas.js";
import { similaritySearchOnChunksAndSummaries } from "../similarity-search-chunks-and-summaries.js";
import { similaritySearchOnChunksOnly } from "../similarity-search-chunks-only.js";
import { similaritySearchFirstSummariesThenChunks } from "../similarity-search-summaries-then-chunks.js";

export async function registerSearchDocumentsRoute(
	fastify: FastifyInstance,
	OPENAI_MODEL: string,
	OPENAI_KEY: string,
) {
	await fastify.register(
		async (app, options, next) => {
			await registerCors(app);
			app.post<{
				Body: Body;
			}>(
				"/",
				{ schema: { body: bodySchema, response: responseSchema } },
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
						temperature,
						match_threshold,
						num_probes,
						match_count,
						min_content_length,
						openai_model,
						chunk_limit,
						summary_limit,
						document_limit,
						search_algorithm,
						include_summary_in_response_generation,
						generate_answer,
					} = request.body;

					app.log.info({ query });
					app.log.info({ temperature });
					app.log.info({ match_threshold });
					app.log.info({ num_probes });
					app.log.info({ match_count });
					app.log.info({ min_content_length });
					app.log.info({ openai_model });
					app.log.info({ chunk_limit });
					app.log.info({ summary_limit });
					app.log.info({ document_limit });
					app.log.info({ search_algorithm });
					app.log.info({ include_summary_in_response_generation });
					app.log.info({ generate_answer });

					// 2. moderate content
					// Moderate the content to comply with OpenAI T&C
					const sanitizedQuery = query.trim();
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					//@ts-ignore
					const moderationResponse = await fetch(
						"https://api.openai.com/v1/moderations",
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${OPENAI_KEY}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								input: sanitizedQuery,
							}),
						},
					);

					if (!moderationResponse.ok) {
						throw new ApplicationError(
							`OpenAI moderation failed with status ${moderationResponse.status}`,
						);
					}
					const moderationResponseJson = await moderationResponse.json();

					const [results] = moderationResponseJson.results;

					if (results.flagged) {
						throw new UserError("Flagged content", {
							flagged: true,
							categories: results.categories,
						});
					}
					// 3. generate an embeedding using openai api
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					const embeddingResponse = await fetch(
						"https://api.openai.com/v1/embeddings",
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${OPENAI_KEY}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								model: "text-embedding-ada-002",
								input: sanitizedQuery.replaceAll("\n", " "),
							}),
						},
					);

					if (embeddingResponse.status !== 200) {
						throw new ApplicationError(
							"Failed to create embedding for question",
							{ embeddingResponse },
						);
					}

					const {
						data: [{ embedding }],
					} = await embeddingResponse.json();

					const config = {
						embedding: embedding,
						match_threshold: match_threshold,
						match_count: match_count,
						document_limit: document_limit,
						num_probes: num_probes,
						sanitizedQuery: sanitizedQuery,
						chunk_limit: chunk_limit,
						summary_limit: summary_limit,
						MAX_CONTENT_TOKEN_LENGTH,
						OPENAI_MODEL,
						MAX_TOKENS,
					} as SimilaritySearchConfig;

					let documentMatches: Array<ResponseDocumentMatch> = [];
					if (search_algorithm === AvailableSearchAlgorithms.ChunksOnly) {
						documentMatches = await similaritySearchOnChunksOnly(config);
					} else if (
						search_algorithm === AvailableSearchAlgorithms.ChunksAndSummaries
					) {
						documentMatches =
							await similaritySearchOnChunksAndSummaries(config);
					} else if (
						search_algorithm === AvailableSearchAlgorithms.SummaryThenChunks
					) {
						documentMatches =
							await similaritySearchFirstSummariesThenChunks(config);
					} else {
						throw new Error(`Algorithm ${search_algorithm} not supported.`);
					}

					const chatCompletionRequest = createPrompt({
						documentMatches,
						MAX_CONTENT_TOKEN_LENGTH,
						OPENAI_MODEL,
						sanitizedQuery,
						MAX_TOKENS,
						temperature,
						includeSummary: include_summary_in_response_generation,
					});

					let responseDetail = {
						documentMatches: documentMatches,
						completionOptions: chatCompletionRequest,
						requestBody: request.body,
					} as ResponseDetail;

					let answer = undefined;
					if (generate_answer) {
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
								body: JSON.stringify(responseDetail.completionOptions),
							},
						);

						if (response.status !== 200) {
							throw new ApplicationError(
								"Failed to create completion for question",
								{ response },
							);
						}
						answer = await response.json();
					}

					responseDetail.gpt = answer;
					responseDetail.requestBody = request.body;
					reply.status(201).send(responseDetail);
				},
			);

			next();
		},
		{ prefix: "/vector-search" },
	);
}
