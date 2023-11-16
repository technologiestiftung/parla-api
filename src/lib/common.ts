// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { CreateChatCompletionRequest } from "openai";
import { Database } from "./database.js";

type RegisteredDocument =
	Database["public"]["Tables"]["registered_documents"]["Row"];

type ProcessedDocument =
	Database["public"]["Tables"]["processed_documents"]["Row"];

type ProcessedDocumentSummary =
	Database["public"]["Tables"]["processed_document_summaries"]["Row"];

type ProcessedDocumentChunk =
	Database["public"]["Tables"]["processed_document_chunks"]["Row"];

// https://platform.openai.com/docs/models/gpt-3-5
// https://platform.openai.com/docs/models/gpt-4-and-gpt-4-turbo
export type Model =
	| "gpt-4"
	| "gpt-3.5-turbo"
	| "gpt-3.5-turbo-1106" // will be default turbo 2023 12 11
	| "gpt-3.5-turbo-16k"; // 16k will be depreacted 2023 12 11

interface Gpt {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: Choice[];
	usage: Usage;
}

interface Choice {
	index: number;
	message: {
		role: string;
		content: string;
	};
	finish_reason: string;
}

interface Usage {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
}

export interface ProcessedDocumentSummaryMatch {
	processed_document_summary: ProcessedDocumentSummary;
	similarity: number;
}

export interface ProcessedDocumentChunkMatch {
	processed_document_chunk: ProcessedDocumentChunk;
	similarity: number;
}

export interface ResponseDocumentMatch {
	registered_document: RegisteredDocument;
	processed_document: ProcessedDocument;
	processed_document_summary_match: ProcessedDocumentSummaryMatch;
	processed_document_chunk_matches: Array<ProcessedDocumentChunkMatch>;
	similarity: number;
}

export interface ResponseDetail {
	documentMatches: ResponseDocumentMatch[];
	gpt?: Gpt;
	requestBody?: Body;
	completionOptions?: CreateChatCompletionRequest;
}

export interface Body {
	query: string;
	temperature: number;
	match_threshold: number;
	num_probes: number;
	match_count: number;
	min_content_length: number;
	openai_model: Model;
	chunk_limit: number;
	summary_limit: number;
	document_limit: number;
	search_algorithm: string;
	include_summary_in_response_generation: boolean;
}

export interface SimilaritySearchConfig {
	embedding: any;
	match_threshold: number;
	match_count: number;
	document_limit: number;
	num_probes: number;
	sanitizedQuery: string;
	MAX_CONTENT_TOKEN_LENGTH: number;
	OPENAI_MODEL: Model;
	MAX_TOKENS: number;
}
