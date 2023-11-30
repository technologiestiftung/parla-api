import { FastifyInstance } from "fastify";
import {
	AvailableSearchAlgorithms,
	DocumentSearchBody,
	DocumentSearchResponse,
	ResponseDocumentMatch,
	SimilaritySearchConfig,
} from "../common.js";
import { ApplicationError, UserError } from "../errors.js";
import { registerCors } from "../handle-cors.js";
import {
	documentSearchBodySchema,
	documentSearchResponseSchema,
} from "../json-schemas.js";
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
				Body: DocumentSearchBody;
			}>(
				"/",
				{
					schema: {
						body: documentSearchBodySchema,
						response: documentSearchResponseSchema,
					},
				},
				async (request, reply) => {
					let MAX_CONTENT_TOKEN_LENGTH = 1500;
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
						match_threshold,
						num_probes_chunks,
						num_probes_summaries,
						chunk_limit,
						summary_limit,
						document_limit,
						search_algorithm,
					} = request.body;

					app.log.info(request.body);

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
						document_limit: document_limit,
						num_probes_chunks: num_probes_chunks,
						num_probes_summaries: num_probes_summaries,
						summary_limit: summary_limit,
						chunk_limit: chunk_limit,
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

					const response = {
						documentMatches: documentMatches,
					} as DocumentSearchResponse;

					reply.status(201).send(response);
				},
			);

			next();
		},
		{ prefix: "/vector-search" },
	);
}
