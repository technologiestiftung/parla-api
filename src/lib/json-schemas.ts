import { S } from "fluent-json-schema";
import { Model } from "./common.js";

export const MODELS: Record<string, Model> = {
	GPT_4: "gpt-4",
	GPT_3_5_TURBO: "gpt-3.5-turbo",
	GPT_3_5_TURBO_16K: "gpt-3.5-turbo-16k",
};

export const documentSearchBodySchema = S.object()
	.prop("query", S.string())
	.prop("match_threshold", S.number().minimum(0).maximum(1).default(0.85))
	.prop("num_probes_chunks", S.number().minimum(1).maximum(85).default(9))
	.prop("num_probes_summaries", S.number().minimum(1).maximum(9).default(3))
	.prop("chunk_limit", S.number().minimum(1).maximum(128).default(64))
	.prop("summary_limit", S.number().minimum(1).maximum(64).default(16))
	.prop("document_limit", S.number().minimum(1).maximum(10).default(3))
	.prop("search_algorithm", S.string().default("chunks-and-summaries"))
	.required(["query"]);

export const healthSchema = {
	200: S.object().prop("message", S.string().default("OK")),
};

const choices = S.array().items(
	S.object()
		.prop("index", S.number())
		.prop(
			"message",
			S.object().prop("role", S.string()).prop("content", S.string()),
		)
		.prop("finsh_reason", S.string()),
);

const registeredDocument = S.object()
	.prop("id", S.number())
	.prop("source_url", S.string().required())
	.prop("source_type", S.string().required())
	.prop("registered_at", S.string().format("date-time").required())
	.prop("metadata", S.object().additionalProperties(true));

const processedDocument = S.object()
	.prop("id", S.number())
	.prop("file_checksum", S.string().required())
	.prop("file_size", S.number().required())
	.prop("num_pages", S.number().required())
	.prop("processing_started_at", S.string().format("date-time"))
	.prop("processing_finished_at", S.string().format("date-time"))
	.prop("processing_error", S.string())
	.prop("registered_document_id", S.number());

const processedDocumentSummary = S.object()
	.prop("id", S.number())
	.prop("summary", S.string())
	.prop("tags", S.array().items(S.string()))
	.prop("processed_document_id", S.number())
	.prop("similarity", S.number());

const processedDocumentSummaryMatch = S.object()
	.prop("processed_document_summary", processedDocumentSummary)
	.prop("similarity", S.number());

const processedDocumentChunk = S.object()
	.prop("id", S.number())
	.prop("content", S.string())
	.prop("page", S.number())
	.prop("chunk_index", S.number())
	.prop("processed_document_id", S.number())
	.prop("similarity", S.number());

const processedDocumentChunkMatch = S.object()
	.prop("processed_document_chunk", processedDocumentChunk)
	.prop("similarity", S.number());

const documentMatch = S.object()
	.prop("registered_document", registeredDocument)
	.prop("processed_document", processedDocument)
	.prop("processed_document_summary_match", processedDocumentSummaryMatch)
	.prop(
		"processed_document_chunk_matches",
		S.array().items(processedDocumentChunkMatch),
	)
	.prop("similarity", S.number());

const usage = S.object()
	.prop("prompt_tokens", S.number())
	.prop("completion_tokens", S.number())
	.prop("total_tokens", S.number());

const gpt = S.object()
	.prop("id", S.string())
	.prop("created", S.number())
	.prop("model", S.string())
	.prop("object", S.string())
	.prop("usage", usage)
	.prop("choices", choices);

export const documentSearchResponseSchema = {
	201: S.object().prop("documentMatches", S.array().items(documentMatch)),
};

export const generatedAnswerResponseSchema = {
	201: S.object().prop("answer", gpt),
};

export const generateAnswerBodySchema = S.object()
	.prop("query", S.string())
	.prop("include_summary_in_response_generation", S.boolean().default(true))
	.prop("temperature", S.number().minimum(0).maximum(2).default(0))
	.prop("documentMatches", S.array().items(documentMatch));

export const countSchema = {
	200: S.object().prop("processed_documents_count", S.number()),
};
