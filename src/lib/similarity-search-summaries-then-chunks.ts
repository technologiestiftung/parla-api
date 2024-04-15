import {
	ProcessedDocumentChunkMatch,
	ProcessedDocumentSummaryMatch,
	ResponseDocumentMatch,
	SimilaritySearchConfig,
} from "./common.js";
import { ApplicationError } from "./errors.js";
import { supabase } from "./supabase.js";

export async function similaritySearchFirstSummariesThenChunks(
	config: SimilaritySearchConfig,
): Promise<Array<ResponseDocumentMatch>> {
	// vector search summaries
	const { error: matchSummaryError, data: similarSummaries } = await supabase
		.rpc("match_summaries", {
			embedding: config.embedding,
			match_threshold: config.match_threshold,
			match_count: config.summary_limit,
			num_probes: config.num_probes_summaries,
		})
		.gte("similarity", config.match_threshold)
		.order("similarity", { ascending: false })
		.limit(config.document_limit);

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
			embedding: config.embedding,
			match_threshold: config.match_threshold,
			// We want to have 3 chunks for each of the relevant documents,
			// however, it can't be guaranteed. By setting match_count to a high number,
			// we increase the chances of getting 3 chunks.
			match_count: config.chunk_limit,
			num_probes: config.num_probes_chunks,
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
			.slice(0, 3);

		return {
			registered_document: registeredDocument,
			processed_document: processedDocument,
			processed_document_summary_match: {
				processed_document_summary: processedDocumentSummary,
				similarity: processedDocumentSummaryMatch.similarity,
			} as ProcessedDocumentSummaryMatch,
			processed_document_chunk_matches: chunks,
			similarity: processedDocumentSummaryMatch.similarity,
		} as ResponseDocumentMatch;
	});

	return documentMatches;
}
