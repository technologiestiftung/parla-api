import GPT3Tokenizer from "gpt3-tokenizer";
import {
	ProcessedDocumentChunkMatch,
	ProcessedDocumentSummaryMatch,
	ResponseDocumentMatch,
	SimilaritySearchConfig,
} from "./common.js";
import { ApplicationError } from "./errors.js";
import supabase from "./supabase.js";

export async function similaritySearchOnChunksAndSummaries(
	config: SimilaritySearchConfig,
): Promise<Array<ResponseDocumentMatch>> {
	const tokenizer = new GPT3Tokenizer.default({ type: "gpt3" });

	// vector search summaries
	const { error: mathSummaryAndChunksError, data: similarSummariesAndChunks } =
		await supabase
			.rpc("match_summaries_and_chunks", {
				embedding: config.embedding,
				match_threshold: 0,
				chunk_limit: config.chunk_limit,
				summary_limit: config.summary_limit,
				num_probes_chunks: config.num_probes_chunks,
				num_probes_summaries: config.num_probes_summaries,
			})
			.gte("similarity", config.match_threshold)
			.order("similarity", { ascending: false })
			.limit(config.document_limit);

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

	// Assure that max context length of ~15000 tokens is not exceeded
	// Assume 1000 tokens per chunk
	// Distribute chunks equally across documents
	const MAX_CONTEXT_SIZE = 15000;
	const TOKENS_PER_CHUNK = 1000;
	const summaryTokens = processedDocumentSummaries
		.map((s) => tokenizer.encode(s.summary).text.length)
		.reduce((l, r) => l + r, 0);
	const MAX_CHUNKS_PER_DOCUMENT = Math.floor(
		(MAX_CONTEXT_SIZE - summaryTokens) /
			TOKENS_PER_CHUNK /
			similarSummariesAndChunks.length,
	);

	const chunkMatches = processedDocumentChunks.map((chunk) => {
		const similarityFound = similarSummariesAndChunks.filter(
			(s) => (s.chunk_ids ?? []).filter((cid) => cid === chunk.id).length > 0,
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
			.slice(0, MAX_CHUNKS_PER_DOCUMENT);

		return {
			registered_document: registeredDocument,
			processed_document: processedDocument,
			processed_document_summary_match: {
				processed_document_summary: processedDocumentSummary,
				similarity: processedDocumentSummaryMatch.summary_similarity,
			} as ProcessedDocumentSummaryMatch,
			processed_document_chunk_matches: chunks,
			similarity: processedDocumentSummaryMatch.similarity,
		} as ResponseDocumentMatch;
	});

	return documentMatches;
}
