import { ExecutionContext } from "ava";
import { FastifyInstance } from "fastify";
import { DocumentSearchResponse } from "../../lib/common.js";

export function checkSearchDocStructure(
	t: ExecutionContext<{
		server: FastifyInstance;
	}>,
	json: DocumentSearchResponse,
) {
	t.true(Array.isArray(json.documentMatches));
	t.is(json.documentMatches.length, 1);
	t.true(Object.hasOwn(json, "documentMatches"));
	// structure checks for that matched document
	const [docMatch] = json.documentMatches;

	t.true(Object.hasOwn(docMatch, "registered_document"));
	t.true(Object.hasOwn(docMatch, "processed_document"));
	t.true(Object.hasOwn(docMatch, "processed_document_summary_match"));
	t.true(Object.hasOwn(docMatch, "processed_document_chunk_matches"));
	t.true(Object.hasOwn(docMatch, "similarity"));
	// since we always use the same docs the result should never change
	t.is(typeof docMatch.similarity, "number");
	// structure checks for that registered document
	const regDoc = docMatch.registered_document;
	t.true(Object.hasOwn(regDoc, "id"));
	t.true(Object.hasOwn(regDoc, "source_url"));
	t.true(Object.hasOwn(regDoc, "source_type"));
	t.true(Object.hasOwn(regDoc, "registered_at"));
	t.true(Object.hasOwn(regDoc, "metadata"));
	// structure checks for the document matches
	t.true(Array.isArray(docMatch.processed_document_chunk_matches));
	const chunkMatch = docMatch.processed_document_chunk_matches[0];
	t.true(Object.hasOwn(chunkMatch, "similarity"));
	t.is(typeof chunkMatch.similarity, "number");
	t.true(Object.hasOwn(chunkMatch, "processed_document_chunk"));

	// matched chunks structure
	const chunk = chunkMatch.processed_document_chunk;
	t.true(Object.hasOwn(chunk, "id"));
	t.true(Object.hasOwn(chunk, "content"));
	t.true(Object.hasOwn(chunk, "page"));
	t.true(Object.hasOwn(chunk, "processed_document_id"));

	// processed_document_summary_match structure
	const summaryMatch = docMatch.processed_document_summary_match;
	t.true(Object.hasOwn(summaryMatch, "processed_document_summary"));
	t.true(Object.hasOwn(summaryMatch, "similarity"));
	// document summary
	t.true(Object.hasOwn(summaryMatch.processed_document_summary, "id"));
	t.true(Object.hasOwn(summaryMatch.processed_document_summary, "summary"));
	t.true(Object.hasOwn(summaryMatch.processed_document_summary, "tags"));
	t.true(
		Object.hasOwn(
			summaryMatch.processed_document_summary,
			"processed_document_id",
		),
	);
	t.is(typeof summaryMatch.similarity, "number");
	t.is(typeof json.documentMatches[0].similarity, "number");
}
