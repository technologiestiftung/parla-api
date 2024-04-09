import { FastifyInstance } from "fastify";
import { userRequestSchema } from "../json-schemas.js";
import { registerCors } from "../handle-cors.js";
import supabase from "../supabase.js";
import {
	ProcessedDocumentChunk,
	ProcessedDocumentSummary,
	RegisteredDocument,
	ResponseDocumentMatchReference,
	UserRequest,
} from "../common.js";

export async function registerLoadUserRequestRoute(fastify: FastifyInstance) {
	await fastify.register(
		async (app, options, next) => {
			await registerCors(app);

			app.get("/:requestId", async (request, reply) => {
				const { requestId } = request.params as { requestId: string };

				const { data, error } = await supabase
					.from("user_requests")
					.select("*")
					.eq("id", requestId)
					.single<UserRequest>();

				if (!data) {
					throw new Error(`Request with id ${requestId} not found`);
				}

				const matchingDocumentsReferences = JSON.parse(
					JSON.stringify(data.matching_documents),
				) as Array<ResponseDocumentMatchReference>;

				const matchingDocuments = await Promise.all(
					matchingDocumentsReferences.map(async (matchingDocumentReference) => {
						const { data: registeredDocument, error: registeredDocumentError } =
							await supabase
								.from("registered_documents")
								.select("*")
								.eq("id", matchingDocumentReference.registered_document_id)
								.single<RegisteredDocument>();

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

									return processedDocumentChunk;
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

						const final = {
							registeredDocument: registeredDocument,
							processedDocumentChunks: processedDocumentChunks,
							processedDocumentSummary: processedDocumentSummary,
						};

						return final;
					}),
				);

				console.log(matchingDocuments);

				reply.status(200).send({ data: matchingDocuments });
			});
			next();
		},
		{ prefix: "/requests" },
	);
}
