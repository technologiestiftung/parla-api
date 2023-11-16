/* eslint-disable indent */
// ESM
import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import {
	Body,
	Model,
	ResponseDetail,
	ResponseDocumentMatch,
	SimilaritySearchConfig,
} from "./common.js";
import { ApplicationError, EnvError, UserError } from "./errors.js";
import { bodySchema, healthSchema, responseSchema } from "./json-schemas.js";
import { similaritySearchOnChunksAndSummaries } from "./similarity-search-chunks-and-summaries.js";
import { similaritySearchOnChunksOnly } from "./similarity-search-chunks-only.js";
import { createPrompt } from "./create-prompt.js";

export async function buildServer({
	OPENAI_MODEL,
	OPENAI_KEY,
}: {
	OPENAI_MODEL: Model;
	OPENAI_KEY: string;
}) {
	const NODE_ENV = process.env.NODE_ENV ?? "none";
	const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
	const fastify = Fastify({
		logger: {
			level: LOG_LEVEL,
		},
		disableRequestLogging: NODE_ENV === "development" ? false : true,
	});
	const defaultOptions = {
		schema: {
			response: healthSchema,
		},
	};

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	await fastify.register(fastifySwagger, {
		mode: "dynamic",
		openapi: {
			info: {
				title: String,
				description: String,
				version: String,
			},
			externalDocs: Object,

			components: Object,
		},
	});
	await fastify.register(fastifySwaggerUi, {
		routePrefix: "/documentation",
		initOAuth: {},
		uiConfig: {
			docExpansion: "full",
			deepLinking: false,
		},
		uiHooks: {
			onRequest: function (request, reply, next) {
				next();
			},
			preHandler: function (request, reply, next) {
				next();
			},
		},
		staticCSP: true,
		transformStaticCSP: (header) => header,
	});
	fastify.register((app, options, next) => {
		app.register(cors, { origin: "*" });
		app.get("/", defaultOptions, async (_request, reply) => {
			reply.status(200).send({ message: "OK" });
		});
		next();
	});
	fastify.register(
		(app, options, next) => {
			app.register(cors, { origin: "*" });

			app.get("/", defaultOptions, async (_request, reply) => {
				reply.status(200).send({ message: "OK" });
			});
			next();
		},
		{ prefix: "/health" },
	);
	fastify.register(
		(app, options, next) => {
			app.register(cors, {
				origin: (origin, cb) => {
					if (
						process.env.DANGEROUSLY_ALLOW_CORS_FOR_ALL_ORIGINS ===
						"FOR_REAL_REAL"
					) {
						console.warn("DANGEROUSLY_ALLOW_CORS_FOR_ALL_ORIGINS");
						app.log.warn("DANGEROUSLY_ALLOW_CORS_FOR_ALL_ORIGINS");
						return cb(null, true);
					}
					if (
						process.env.NODE_ENV === "test" ||
						process.env.NODE_ENV === "development"
					) {
						return cb(null, true);
					}
					if (!origin) {
						app.log.warn("No origin in request");
						cb(new Error("Not allowed"), false);
						return;
					}
					const hostname = new URL(origin as string).hostname;
					if (
						(hostname.includes("localhost") ||
							hostname.includes("127.0.0.1")) &&
						process.env.NODE_ENV === "development"
					) {
						//  Request from localhost will pass if node_env is development
						cb(null, true);
						return;
					}
					// match hosstname based on regex
					if (
						hostname.match(
							/cors-requester.vercel.app|ki-anfragen-frontend.*?.vercel.app|ki-anfragen.citylab-berlin.org/,
						)
					) {
						//  Request from localhost will pass
						cb(null, true);
						return;
					}
					// Generate an error on other origins, disabling access
					cb(new Error("Not allowed"), false);
				},
			});
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
						MAX_CONTENT_TOKEN_LENGTH,
						OPENAI_MODEL,
						MAX_TOKENS,
					} as SimilaritySearchConfig;

					let documentMatches: Array<ResponseDocumentMatch> = [];
					if (search_algorithm === "chunks-only") {
						documentMatches = await similaritySearchOnChunksOnly(config);
					} else {
						documentMatches =
							await similaritySearchOnChunksAndSummaries(config);
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

					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					//@ts-ignore
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
					const json = await response.json();
					responseDetail.gpt = json;
					responseDetail.requestBody = request.body;
					reply.status(201).send(responseDetail);
				},
			);

			next();
		},
		{ prefix: "/vector-search" },
	);

	fastify.setErrorHandler(function (error, request, reply) {
		if (error instanceof EnvError) {
			this.log.error(error, "Env variable is not defined");
			reply.status(500).send("Env variable is not defined");
		} else if (error instanceof ApplicationError) {
			// Log error
			this.log.error(error);
			// Send error response
			reply.status(500).send({ message: error.message, data: error.data });
		} else if (error instanceof UserError) {
			// Log error
			this.log.error(error);
			// Send error response
			reply.status(400).send({ message: error.message, data: error.data });
		} else {
			this.log.error(error);

			// fastify will use parent error handler to handle this
			reply.send(error);
		}
	});
	return fastify;
}

// Run the server!
