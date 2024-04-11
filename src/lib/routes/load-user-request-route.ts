import { FastifyInstance } from "fastify";
import {
	ProcessedDocument,
	ProcessedDocumentChunk,
	ProcessedDocumentSummary,
	RegisteredDocument,
	ResponseDocumentMatchReference,
	UserRequest,
} from "../common.js";
import { registerCors } from "../handle-cors.js";
import supabase from "../supabase.js";
import { getUserRequestSchema } from "../json-schemas.js";

function findSimilarityForChunk(
	chunkId: number,
	matches: Array<ResponseDocumentMatchReference>,
): number {
	const match = matches.find((match) => {
		return match.processed_document_chunk_matches.some((chunkMatch) => {
			return chunkMatch.processed_document_chunk_id === chunkId;
		});
	});

	if (!match) {
		return -1;
	}

	const chunkMatch = match.processed_document_chunk_matches.find(
		(chunkMatch) => {
			return chunkMatch.processed_document_chunk_id === chunkId;
		},
	);

	return chunkMatch?.similarity ?? -1;
}

function findSimilarityForSummary(
	summaryId: number,
	matches: Array<ResponseDocumentMatchReference>,
): number {
	const match = matches.find((match) => {
		return (
			match.processed_document_summary_match.processed_document_summary_id ===
			summaryId
		);
	});

	if (!match) {
		return -1;
	}

	return match.processed_document_summary_match.similarity;
}

export async function registerLoadUserRequestRoute(fastify: FastifyInstance) {
	await fastify.register(
		async (app, options, next) => {
			await registerCors(app);

			app.get(
				"/:requestId",
				{
					schema: {
						response: getUserRequestSchema,
					},
				},
				async (request, reply) => {
					const { requestId } = request.params as { requestId: string };

					const { data, error } = await supabase
						.from("user_requests")
						.select("*")
						.eq("short_id", requestId)
						.single<UserRequest>();

					if (!data) {
						throw new Error(`Request with id ${requestId} not found`);
					}

					const matchingDocumentsReferences = JSON.parse(
						JSON.stringify(data.matching_documents),
					) as Array<ResponseDocumentMatchReference>;

					const matchingDocuments = await Promise.all(
						matchingDocumentsReferences.map(
							async (matchingDocumentReference) => {
								const {
									data: registeredDocument,
									error: registeredDocumentError,
								} = await supabase
									.from("registered_documents")
									.select("*")
									.eq("id", matchingDocumentReference.registered_document_id)
									.single<RegisteredDocument>();

								if (registeredDocumentError) {
									throw new Error("Error fetching registered document");
								}

								const {
									data: processedDocument,
									error: processedDocumentError,
								} = await supabase
									.from("processed_documents")
									.select("*")
									.eq("id", matchingDocumentReference.processed_document_id)
									.single<ProcessedDocument>();

								if (processedDocumentError) {
									throw new Error("Error fetching processed document");
								}

								const processedDocumentChunks = await Promise.all(
									matchingDocumentReference.processed_document_chunk_matches.map(
										async (chunk) => {
											const {
												data: processedDocumentChunk,
												error: processedDocumentChunkError,
											} = await supabase
												.from("processed_document_chunks")
												.select("*")
												.eq("id", chunk.processed_document_chunk_id)
												.single<ProcessedDocumentChunk>();

											if (processedDocumentChunkError) {
												throw new Error(
													"Error fetching processed document chunk",
												);
											}

											const strippedChunk = {
												id: processedDocumentChunk?.id,
												content: processedDocumentChunk?.content,
												page: processedDocumentChunk?.page,
												processed_document_id:
													processedDocumentChunk?.processed_document_id,
											};
											return strippedChunk;
										},
									),
								);

								const {
									data: processedDocumentSummary,
									error: processedDocumentSummaryError,
								} = await supabase
									.from("processed_document_summaries")
									.select("*")
									.eq(
										"id",
										matchingDocumentReference.processed_document_summary_match
											.processed_document_summary_id,
									)
									.single<ProcessedDocumentSummary>();

								if (processedDocumentSummaryError) {
									throw new Error("Error fetching processed document summary");
								}

								const strippedSummary = {
									id: processedDocumentSummary?.id,
									processed_document_id:
										processedDocumentSummary?.processed_document_id,
									summary: processedDocumentSummary?.summary,
									tags: processedDocumentSummary?.tags,
								};

								const final = {
									similarity: matchingDocumentReference.similarity,
									registered_document: registeredDocument,
									processed_document: processedDocument,
									processed_document_summary_match: {
										processed_document_summary: strippedSummary,
										similarity: findSimilarityForSummary(
											strippedSummary.id!,
											matchingDocumentsReferences,
										),
									},
									processed_document_chunk_matches: processedDocumentChunks.map(
										(chunk) => {
											return {
												processed_document_chunk: chunk,
												similarity: findSimilarityForChunk(
													chunk.id!,
													matchingDocumentsReferences,
												),
											};
										},
									),
								};

								return final;
							},
						),
					);

					const finalResponse = {
						id: data.short_id,
						query: data.question,
						answerResponse: data.generated_answer,
						searchResponse: {
							documentMatches: matchingDocuments,
						},
					};

					reply.status(200).send(finalResponse);
				},
			);
			next();
		},
		{ prefix: "/requests" },
	);
}
