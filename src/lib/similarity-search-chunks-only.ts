import {
	ProcessedDocumentChunkMatch,
	ProcessedDocumentSummaryMatch,
	ResponseDocumentMatch,
	SimilaritySearchConfig,
} from "./common.js";
import { ApplicationError } from "./errors.js";
import { supabase } from "./supabase.js";

export async function similaritySearchOnChunksOnly(
	config: SimilaritySearchConfig,
): Promise<Array<ResponseDocumentMatch>> {
	// vector search in chunks
	const { error: matchChunksError, data: matchChunks } = await supabase
		.rpc("match_document_chunks", {
			embedding: config.embedding,
			match_threshold: config.match_threshold,
			match_count: config.chunk_limit,
			num_probes: config.num_probes_chunks,
		})
		.gte("similarity", config.match_threshold)
		.order("similarity", { ascending: false });

	if (matchChunksError) {
		throw new ApplicationError(
			"Failed to match_document_chunks",
			matchChunksError,
		);
	}

	// find processed document chunks
	const { error: processedDocumentChunksError, data: processedDocumentChunks } =
		await supabase
			.from("processed_document_chunks")
			.select("content,id,processed_document_id,page")
			.in(
				"id",
				matchChunks.map((chunk) => chunk.id),
			);

	if (processedDocumentChunksError) {
		throw new ApplicationError(
			"Failed to match similar chunks to chunks",
			processedDocumentChunksError,
		);
	}

	const chunkMatches = processedDocumentChunks.map((chunk) => {
		const similarityFound = matchChunks.filter((s) => s.id === chunk.id)[0];
		return {
			processed_document_chunk: chunk,
			similarity: similarityFound.similarity,
		} as ProcessedDocumentChunkMatch;
	});

	// find processed documents
	const { error: processedDocumentsError, data: processedDocuments } =
		await supabase
			.from("processed_documents")
			.select("*")
			.in(
				"id",
				chunkMatches.map(
					(chunk) => chunk.processed_document_chunk.processed_document_id,
				),
			);

	if (processedDocumentsError) {
		throw new ApplicationError(
			"Failed to find processed documents",
			processedDocumentsError,
		);
	}

	// documents with matches, capped to keep the best N documents
	const processedDocumentsWithMatches = processedDocuments
		.map((pd) => {
			const matches = matchChunks.filter(
				(mc) => mc.processed_document_id === pd.id,
			);
			return {
				processedDocument: pd,
				matches: matches,
				averageBestPagesSimilarity:
					matches.map((m) => m.similarity).reduce((l, r) => l + r, 0) /
					matches.length,
			};
		})
		.sort((l, r) =>
			l.averageBestPagesSimilarity < r.averageBestPagesSimilarity ? 1 : -1,
		)
		.slice(0, config.document_limit);

	// find summaries
	const {
		error: processedDocumentSummariesError,
		data: processedDocumentSummaries,
	} = await supabase
		.from("processed_document_summaries")
		.select("*")
		.in(
			"processed_document_id",
			processedDocumentsWithMatches.map(
				(document) => document.processedDocument.id,
			),
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
				processedDocumentsWithMatches.map(
					(processedDocument) =>
						processedDocument.processedDocument.registered_document_id,
				),
			);
	if (registeredDocumentsError) {
		throw new ApplicationError(
			"Failed to find registered documents",
			registeredDocumentsError,
		);
	}

	// Assure that max context length of ~15000 tokens is not exceeded
	// Assume 1000 tokens per chunk
	// Distribute chunks equally across documents
	const MAX_CONTEXT_SIZE = 15000;
	const TOKENS_PER_CHUNK = 1000;
	const MAX_CHUNKS_PER_DOCUMENT = Math.floor(
		MAX_CONTEXT_SIZE / TOKENS_PER_CHUNK / registeredDocuments.length,
	);

	const documentMatches = registeredDocuments.map((registeredDocument) => {
		const processedDocument = processedDocuments.filter(
			(pd) => pd.registered_document_id === registeredDocument.id,
		)[0];

		const processedDocumentSummary = processedDocumentSummaries.filter(
			(ps) => ps.processed_document_id === processedDocument.id,
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
				similarity: 0, // We don't calculate summary similarity
			} as ProcessedDocumentSummaryMatch,
			processed_document_chunk_matches: chunks,
			similarity:
				chunks.map((c) => c.similarity).reduce((l, r) => l + r, 0) /
				chunks.length,
		} as ResponseDocumentMatch;
	});

	// TODO: Refactor to not shadow variable names
	documentMatches.sort((l, r) => {
		const leftAverage = l.processed_document_chunk_matches
			.map((c) => c.similarity)
			// eslint-disable-next-line no-shadow
			.reduce((l, r) => l + r, 0);
		const rightAverage = r.processed_document_chunk_matches
			.map((c) => c.similarity)
			// eslint-disable-next-line no-shadow
			.reduce((l, r) => l + r, 0);
		return leftAverage < rightAverage ? 1 : -1;
	});

	return documentMatches;
}
