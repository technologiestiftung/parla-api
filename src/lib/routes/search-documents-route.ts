import { FastifyInstance } from "fastify";
import {
	DocumentSearchBody,
	DocumentSearchResponse,
	ResponseDocumentMatch,
	SimilaritySearchConfig,
	responseDocumentMatchToReference,
} from "../common.js";
import { Json } from "../database.js";
import { DatabaseError, OpenAIError, UserError } from "../errors.js";
import {
	documentSearchBodySchema,
	documentSearchResponseSchema,
} from "../json-schemas.js";
import { similaritySearchOnChunksAndSummaries } from "../similarity-search-chunks-and-summaries.js";
import { supabase } from "../supabase.js";
import { ParlaConfig } from "../../index.js";

export function searchDocumentsRoute(
	app: FastifyInstance,
	parlaConfig: ParlaConfig,
	next: (err?: Error | undefined) => void,
) {
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
			} = request.body;

			// 2. moderate content
			// Moderate the content to comply with OpenAI T&C
			const sanitizedQuery = query.trim();
			let then = new Date();
			const moderationResponse = await fetch(
				"https://api.openai.com/v1/moderations",
				{
					method: "POST",
					headers: {
						"x-test-error": request.headers["x-test-error"]
							? (request.headers["x-test-error"] as string)
							: "", // This header is used to test the error handling in the tests
						Authorization: `Bearer ${parlaConfig.OPENAI_KEY}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						input: sanitizedQuery,
					}),
				},
			);
			let now = new Date();
			const moderationElapsedMs = now.getTime() - then.getTime();

			if (!moderationResponse.ok) {
				throw new OpenAIError("Failed to moderate content", {
					endpoint: "moderation",
					status: moderationResponse.status,
					statusText: await moderationResponse.text(),
				});
			}

			const moderationResponseJson = await moderationResponse.json();

			//@ts-expect-error 'moderationResponseJson' is of type 'unknown'
			const [results] = moderationResponseJson.results;

			// TODO: Should this really return 500?
			if (results.flagged) {
				throw new UserError("Flagged content", {
					flagged: true,
					categories: results.categories,
				});
			}

			then = new Date();
			// 3. generate an embedding using openai api
			const embeddingResponse = await fetch(
				"https://api.openai.com/v1/embeddings",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${parlaConfig.OPENAI_KEY}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						model: parlaConfig.OPENAI_EMBEDDING_MODEL,
						input: sanitizedQuery.replaceAll("\n", " "),
					}),
				},
			);
			now = new Date();
			const embeddingElapsedMs = now.getTime() - then.getTime();

			if (embeddingResponse.status !== 200) {
				throw new OpenAIError("Failed to create embedding", {
					endpoint: "embeddings",
					status: embeddingResponse.status,
					statusText: await embeddingResponse.text(),
				});
			}

			const {
				//@ts-expect-error 'embedding' is of type 'unknown'
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

			then = new Date();
			const documentMatches: Array<ResponseDocumentMatch> =
				await similaritySearchOnChunksAndSummaries(config);

			now = new Date();
			const databaseSearchElapsedMs = now.getTime() - then.getTime();

			const { data, error } = await supabase
				.from("user_requests")
				.insert({
					created_at: new Date().toISOString(),
					request_payload: request.body as unknown as Json,
					question: sanitizedQuery,
					generated_answer: undefined,
					llm_model: parlaConfig.OPENAI_MODEL,
					llm_embedding_model: parlaConfig.OPENAI_EMBEDDING_MODEL,
					matching_documents: documentMatches.map((match) => {
						return responseDocumentMatchToReference(match) as unknown as Json;
					}),
					moderation_time_ms: moderationElapsedMs,
					embedding_time_ms: embeddingElapsedMs,
					database_search_time_ms: databaseSearchElapsedMs,
				})
				.select("*");

			if (error) {
				throw new DatabaseError(
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
}
