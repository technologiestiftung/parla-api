// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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

export interface DocumentSearchResponse {
	documentMatches: ResponseDocumentMatch[];
}

export interface GenerateAnswerResponse {
	answer: OpenAIChatCompletionRequest;
}

export interface GenerateAnswerBody {
	query: string;
	include_summary_in_response_generation: boolean;
	temperature: number;
	documentMatches: Array<ResponseDocumentMatch>;
}

export interface DocumentSearchBody {
	query: string;
	match_threshold: number;
	num_probes_summaries: number;
	num_probes_chunks: number;
	chunk_limit: number;
	summary_limit: number;
	document_limit: number;
	search_algorithm: string;
}

export interface SimilaritySearchConfig {
	embedding: any;
	match_threshold: number;
	document_limit: number;
	chunk_limit: number;
	summary_limit: number;
	num_probes_summaries: number;
	num_probes_chunks: number;
}

export enum AvailableSearchAlgorithms {
	ChunksOnly = "chunks-only",
	ChunksAndSummaries = "chunks-and-summaries",
	SummaryThenChunks = "summaries-then-chunks",
}

export interface OpenAIMessage {
	role: string;
	content: string;
}
export interface OpenAIChatCompletionRequest {
	model: string;
	messages: Array<OpenAIMessage>;
	max_tokens: number;
	temperature: number;
	stream: boolean;
	seed: number;
}
