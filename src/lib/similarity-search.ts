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
	match_count: number,
	min_content_length: number,
	num_probes: number,
	sanitizedQuery: string,
	MAX_CONTENT_TOKEN_LENGTH: number,
	OPENAI_MODEL: Model,
	MAX_TOKENS: number,
) {
	const MAX_MATCHES = 3;

	// vector search summaries
	const { error: matchSummaryError, data: similarSummaries } = await supabase
		.rpc("match_summaries", {
			embedding,
			match_threshold,
			match_count,
			min_content_length,
			num_probes,
		})
		.order("similarity", { ascending: false })
		.limit(MAX_MATCHES);

	if (matchSummaryError) {
		throw new ApplicationError("Failed to match summaries", matchSummaryError);
	}

	// find complete summaries
	const {
		error: processedDocumentSummariesError,
		data: processedDocumentSummaries,
	} = await supabase
		.from("processed_document_summaries")
		.select("*")
		.in(
			"id",
			similarSummaries.map((summaryMatch) => summaryMatch.id),
		);
	if (processedDocumentSummariesError) {
		throw new ApplicationError(
			"Failed to find summaries",
			processedDocumentSummariesError,
		);
	}

	// find processed documents
	const { error: processedDocumentsError, data: processedDocuments } =
		await supabase
			.from("processed_documents")
			.select("*")
			.in(
				"id",
				processedDocumentSummaries.map(
					(summary) => summary.processed_document_id,
				),
			);
	if (processedDocumentsError) {
		throw new ApplicationError(
			"Failed to find processed documents",
			processedDocumentsError,
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

	// make the similarity search for documents
	const {
		error: similarProcessedDocumentChunksError,
		data: similarProcessedDocumentChunks,
	} = await supabase
		.rpc("match_document_chunks_for_specific_documents", {
			processed_document_ids: processedDocuments.map((p) => p.id),
			embedding,
			match_threshold,
			// We want to have 3 chunks for each of the relevant documents,
			// however, it can't be guaranteed. By setting match_count to a high number,
			// we increase the chances of getting 3 chunks.
			match_count: 100,
			min_content_length,
			num_probes,
		})
		.order("similarity", { ascending: false });

	if (similarProcessedDocumentChunksError) {
		throw new ApplicationError(
			"Failed to match document chunks",
			similarProcessedDocumentChunksError,
		);
	}

	// find processed document chunks
	const { error: processedDocumentChunksError, data: processedDocumentChunks } =
		await supabase
			.from("processed_document_chunks")
			.select("content,id,processed_document_id,page")
			.in(
				"id",
				similarProcessedDocumentChunks.map((chunk) => chunk.id),
			);

	if (processedDocumentChunksError) {
		throw new ApplicationError(
			"Failed to match pages to pageSections",
			processedDocumentChunksError,
		);
	}

	let responseDetail = {} as ResponseDetail;

	const chunkMatches = processedDocumentChunks.map((chunk) => {
		const similarityFound = similarProcessedDocumentChunks.filter(
			(s) => s.id === chunk.id,
		)[0];
		return {
			processed_document_chunk: chunk,
			similarity: similarityFound.similarity,
		} as ProcessedDocumentChunkMatch;
	});

	const documentMatches = registeredDocuments.map((registeredDocument) => {
		const processedDocument = processedDocuments.filter(
			(pd) => pd.registered_document_id === registeredDocument.id,
		)[0];

		const processedDocumentSummary = processedDocumentSummaries.filter(
			(ps) => ps.processed_document_id === processedDocument.id,
		)[0];

		const processedDocumentSummaryMatch = similarSummaries.filter(
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
