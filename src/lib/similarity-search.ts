import {
	Model,
	ProcessedDocumentChunkMatch,
	ProcessedDocumentSummaryMatch,
	ResponseDetail,
	ResponseDocumentMatch,
} from "./common.js";
import { createPrompt } from "./create-prompt.js";
import { ApplicationError } from "./errors.js";
import supabase from "./supabase.js";

export async function similaritySearch(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	embedding: any,
	match_threshold: number,
	chunk_limit: number,
	summary_limit: number,
	num_probes: number,
	sanitizedQuery: string,
	MAX_CONTENT_TOKEN_LENGTH: number,
	OPENAI_MODEL: Model,
	MAX_TOKENS: number,
) {
	const MAX_MATCHES = 5;

	// vector search summaries
	const { error: mathSummaryAndChunksError, data: similarSummariesAndChunks } =
		await supabase
			.rpc("match_summaries_and_chunks", {
				embedding,
				match_threshold: match_threshold,
				chunk_limit: chunk_limit,
				summary_limit: summary_limit,
				num_probes,
			})
			.order("similarity", { ascending: false })
			.limit(MAX_MATCHES);

	if (mathSummaryAndChunksError) {
		throw new ApplicationError(
			"Failed to match_summaries_and_chunks",
			mathSummaryAndChunksError,
		);
	}

	// find processed documents
	const { error: processedDocumentsError, data: processedDocuments } =
		await supabase
			.from("processed_documents")
			.select("*")
			.in(
				"id",
				similarSummariesAndChunks.map(
					(summary) => summary.processed_document_id,
				),
			);
	if (processedDocumentsError) {
		throw new ApplicationError(
			"Failed to find processed documents",
			processedDocumentsError,
		);
	}

	// find complete summaries
	const {
		error: processedDocumentSummariesError,
		data: processedDocumentSummaries,
	} = await supabase
		.from("processed_document_summaries")
		.select("*")
		.in(
			"processed_document_id",
			processedDocuments.map((x) => x.id),
		);

	if (processedDocumentSummariesError) {
		throw new ApplicationError(
			"Failed to find summaries",
			processedDocumentSummariesError,
		);
	}

	// find registered documents
	const { error: registeredDocumentsError, data: registeredDocuments } =
		await supabase
			.from("registered_documents")
			.select("*")
			.in(
				"id",
				processedDocuments.map(
					(processedDocument) => processedDocument.registered_document_id,
				),
			);

	if (registeredDocumentsError) {
		throw new ApplicationError(
			"Failed to find registered documents",
			registeredDocumentsError,
		);
	}

	// find processed document chunks
	const { error: processedDocumentChunksError, data: processedDocumentChunks } =
		await supabase
			.from("processed_document_chunks")
			.select("content,id,processed_document_id,page")
			.in(
				"id",
				similarSummariesAndChunks
					.flatMap((chunk) => chunk.chunk_ids)
					.filter((x) => x !== null),
			);

	if (processedDocumentChunksError) {
		throw new ApplicationError(
			"Failed to match pages to pageSections",
			processedDocumentChunksError,
		);
	}

	let responseDetail = {} as ResponseDetail;

	const chunkMatches = processedDocumentChunks.map((chunk) => {
		const similarityFound = similarSummariesAndChunks.filter(
			(s) => s.chunk_ids.filter((cid) => cid === chunk.id).length > 0,
		)[0];
		const chunkIndex = similarityFound.chunk_ids.indexOf(chunk.id);
		const similarity = similarityFound.chunk_similarities[chunkIndex];
		return {
			processed_document_chunk: chunk,
			similarity: similarity,
		} as ProcessedDocumentChunkMatch;
	});

	const documentMatches = registeredDocuments.map((registeredDocument) => {
		const processedDocument = processedDocuments.filter(
			(pd) => pd.registered_document_id === registeredDocument.id,
		)[0];

		const processedDocumentSummary = processedDocumentSummaries.filter(
			(ps) => ps.processed_document_id === processedDocument.id,
		)[0];

		const processedDocumentSummaryMatch = similarSummariesAndChunks.filter(
			(s) => s.processed_document_id === processedDocument.id,
		)[0];

		const chunks = chunkMatches
			.filter(
				(cm) =>
					cm.processed_document_chunk.processed_document_id ===
					processedDocument.id,
			)
			.sort((l, r) => (l.similarity < r.similarity ? 1 : -1))
			.slice(0, MAX_MATCHES);

		return {
			registered_document: registeredDocument,
			processed_document: processedDocument,
			processed_document_summary_match: {
				processed_document_summary: processedDocumentSummary,
				similarity: processedDocumentSummaryMatch.similarity,
			} as ProcessedDocumentSummaryMatch,
			processed_document_chunk_matches: chunks,
		} as ResponseDocumentMatch;
	});

	responseDetail.documentMatches = documentMatches;

	const completionOptions = createPrompt({
		documentMatches,
		MAX_CONTENT_TOKEN_LENGTH,
		OPENAI_MODEL,
		sanitizedQuery,
		MAX_TOKENS,
	});

	responseDetail.completionOptions = completionOptions;

	return responseDetail;
}
