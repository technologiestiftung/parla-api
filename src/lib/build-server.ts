/* eslint-disable indent */
// ESM
import Fastify from "fastify";
import cors from "@fastify/cors";
import { Model, ResponseDetail } from "./common.js";
import { createPrompt } from "./create-prompt.js";
import { ApplicationError, EnvError, UserError } from "./errors.js";
import supabase from "./supabase.js";
import { bodySchema } from "./json-schemas.js";

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
	fastify.register((app, options, next) => {
		app.register(cors, { origin: "*" });
		app.get("/", async (_request, reply) => {
			reply.status(200).send("OK");
		});
		next();
	});
	fastify.register(
		(app, options, next) => {
			app.register(cors, { origin: "*" });
			app.get("/", async (_request, reply) => {
				reply.status(200).send("OK");
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
						console.info("DANGEROUSLY_ALLOW_CORS_FOR_ALL_ORIGINS");
						app.log.info("DANGEROUSLY_ALLOW_CORS_FOR_ALL_ORIGINS");
						return cb(null, true);
					}
					if (
						process.env.NODE_ENV === "test" ||
						process.env.NODE_ENV === "development"
					) {
						return cb(null, true);
					}
					if (!origin) {
						app.log.warn("No origin");
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
				Body: {
					query: string;
					temperature: number;
					match_threshold: number;
					num_probes: number;
					match_count: number;
					min_content_length: number;
					openai_model: Model;
				};
			}>("/", { schema: { body: bodySchema } }, async (request, reply) => {
				let MAX_CONTENT_TOKEN_LENGTH = 1500;
				const MAX_TOKENS = 2048;
				// set MAX_CONTENT_LENGTH based on the openai model
				// models we use
				// - gpt-4 has max tokens length of 8192
				// - gpt-3.5-turbo has max tokens length of 4096
				// - gpt-3.5-turbo-16k has max tokens length of 16384
				switch (OPENAI_MODEL) {
					case "gpt-4": {
						MAX_CONTENT_TOKEN_LENGTH = 8192;
						// MAX_TOKENS = 8192;
						break;
					}
					case "gpt-3.5-turbo": {
						MAX_CONTENT_TOKEN_LENGTH = 2048;
						// MAX_TOKENS = 2048;
						break;
					}
					case "gpt-3.5-turbo-16k": {
						MAX_CONTENT_TOKEN_LENGTH = 8192;
						// MAX_TOKENS = 16384;
						break;
					}
					default: {
						MAX_CONTENT_TOKEN_LENGTH = 1500;
						// MAX_TOKENS = 2048;
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
				} = request.body;

				console.log("query", query);

				console.log("temperature", temperature);
				console.log("match_threshold", match_threshold);
				console.log("num_probes", num_probes);
				console.log("match_count", match_count);
				console.log("min_content_length", min_content_length);
				console.log("openai_model", openai_model);
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
						embeddingResponse,
					);
				}

				const {
					data: [{ embedding }],
				} = await embeddingResponse.json();

				// 4. make the similarity search
				const { error: matchSectionError, data: docSections } =
					await supabase.rpc("match_parsed_dokument_sections", {
						embedding,
						match_threshold,
						match_count,
						min_content_length,
						num_probes,
					});
				if (matchSectionError) {
					throw new ApplicationError(
						"Failed to match page sections",
						matchSectionError,
					);
				}
				console.log("embedding", embedding);
				console.log("docSections", docSections);

				const { error: sectionsError, data: sections } = await supabase
					.from("parsed_document_sections")
					.select("content,id,parsed_document_id")
					.in(
						"id",
						docSections.map((section) => section.id),
					);

				if (sectionsError) {
					throw new ApplicationError(
						"Failed to match pages to pageSections",
						sectionsError,
					);
				}
				const responseDetail: ResponseDetail = {
					sections: sections.map((section) => {
						const docSection = docSections.find((sec) => section.id === sec.id);
						return {
							similarity: docSection?.similarity ?? 0,
							...section,
						};
					}),
				};

				// match documents to pdfs
				const { error: docsError, data: docs } = await supabase
					.from("parsed_documents")
					.select("*")
					.in(
						"id",
						sections.map((section) => section.parsed_document_id),
					);
				if (docsError) {
					throw new ApplicationError("Failed to match docsSections to docs");
				}
				responseDetail.sections.forEach((section) => {
					section.parsed_documents = docs.filter(
						(doc) => doc.id === section.parsed_document_id,
					);
				});
				const { error: pdfError, data: pdfs } = await supabase
					.from("dokument")
					.select("*")
					.in(
						"id",
						docs.map((doc) => doc.dokument_id),
					);
				if (pdfError) {
					throw new ApplicationError("Failed to match docs to pdfs");
				}
				responseDetail.sections.forEach((section) => {
					section.pdfs = pdfs.filter(
						(pdf) =>
							section.parsed_documents
								?.map((doc) => doc.dokument_id)
								.includes(pdf.id),
					);
				});
				const completionOptions = createPrompt({
					sections,
					MAX_CONTENT_TOKEN_LENGTH,
					OPENAI_MODEL,
					sanitizedQuery,
					MAX_TOKENS,
				});

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
						body: JSON.stringify(completionOptions),
					},
				);

				if (response.status !== 200) {
					throw new ApplicationError(
						"Failed to create completion for question",
						response,
					);
				}
				const json = await response.json();
				responseDetail.gpt = json;

				reply.status(201).send([responseDetail] as ResponseDetail[]);
			});

			next();
		},
		{ prefix: "/vector-search" },
	);

	fastify.setErrorHandler(function (error, request, reply) {
		if (error instanceof EnvError) {
			this.log.error(error);
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
