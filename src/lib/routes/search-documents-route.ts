import { FastifyInstance } from "fastify";
import {
	AvailableSearchAlgorithms,
	DocumentSearchBody,
	DocumentSearchResponse,
	ResponseDocumentMatch,
	SimilaritySearchConfig,
	responseDocumentMatchToReference,
} from "../common.js";
import { ApplicationError, UserError, OpenAIError } from "../errors.js";
import { registerCors } from "../handle-cors.js";
import {
	documentSearchBodySchema,
	documentSearchResponseSchema,
} from "../json-schemas.js";
import { similaritySearchOnChunksAndSummaries } from "../similarity-search-chunks-and-summaries.js";
import { similaritySearchOnChunksOnly } from "../similarity-search-chunks-only.js";
import { similaritySearchFirstSummariesThenChunks } from "../similarity-search-summaries-then-chunks.js";
import supabase from "../supabase.js";
import { Json } from "../database.js";

export async function registerSearchDocumentsRoute(
	fastify: FastifyInstance,
	OPENAI_KEY: string,
	OPENAI_EMBEDDING_MODEL: string,
	OPENAI_MODEL: string,
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
								"x-test-error": request.headers.hasOwnProperty("x-test-error")
									? (request.headers["x-test-error"] as string)
									: "", // This header is used to test the error handling in the tests
								Authorization: `Bearer ${OPENAI_KEY}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								input: sanitizedQuery,
							}),
						},
					);
					if (!moderationResponse.ok) {
						throw new OpenAIError("Failed to moderate content", {
							endpoint: "moderation",
							status: moderationResponse.status,
							statusText: await moderationResponse.text(),
						});

						// throw new ApplicationError(
						// 	`OpenAI moderation failed with status ${moderationResponse.status}`,
						// );
					}
					const moderationResponseJson = await moderationResponse.json();

					const [results] = moderationResponseJson.results;

					// TODO: Should this really return 500?
					if (results.flagged) {
						throw new UserError("Flagged content", {
							flagged: true,
							categories: results.categories,
						});
					}
					// 3. generate an embedding using openai api
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
								model: OPENAI_EMBEDDING_MODEL,
								input: sanitizedQuery.replaceAll("\n", " "),
							}),
						},
					);

					if (!embeddingResponse.ok) {
						throw new OpenAIError("Failed to create embedding", {
							endpoint: "embeddings",
							status: embeddingResponse.status,
							statusText: await embeddingResponse.text(),
						});
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

					const { data, error } = await supabase
						.from("user_requests")
						.insert({
							created_at: new Date().toISOString(),
							request_payload: request.body as unknown as Json,
							question: sanitizedQuery,
							generated_answer: undefined,
							llm_model: OPENAI_MODEL,
							llm_embedding_model: OPENAI_EMBEDDING_MODEL,
							matching_documents: documentMatches.map((match) => {
								return responseDocumentMatchToReference(
									match,
								) as unknown as Json;
							}),
						})
						.select("*");

					if (!data) {
						throw new Error(
							`Could not save user request to database: ${error.message}`,
						);
					}

					const response = {
						userRequestId: data[0].short_id,
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
