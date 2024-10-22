import { OpenAIChatCompletionRequest } from "./common";
import { Database } from "./database.js";

export type RegisteredDocument =
	Database["public"]["Tables"]["registered_documents"]["Row"];

export type ProcessedDocument =
	Database["public"]["Tables"]["processed_documents"]["Row"];

export type ProcessedDocumentSummary =
	Database["public"]["Tables"]["processed_document_summaries"]["Row"];

export type ProcessedDocumentChunk =
	Database["public"]["Tables"]["processed_document_chunks"]["Row"];

export type UserRequest = Database["public"]["Tables"]["user_requests"]["Row"];

export type UserRequestFeedback =
	Database["public"]["Tables"]["user_request_feedbacks"]["Row"];

export type UserRequesWithFeedback = UserRequest & {
	user_request_feedbacks: UserRequestFeedback[];
};

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

export interface ProcessedDocumentSummaryMatchReference {
	processed_document_summary_id: number;
	similarity: number;
}

export interface ProcessedDocumentChunkMatch {
	processed_document_chunk: ProcessedDocumentChunk;
	similarity: number;
}
export interface ProcessedDocumentChunkMatchReference {
	processed_document_chunk_id: number;
	similarity: number;
}

export interface ResponseDocumentMatch {
	registered_document: RegisteredDocument;
	processed_document: ProcessedDocument;
	processed_document_summary_match: ProcessedDocumentSummaryMatch;
	processed_document_chunk_matches: Array<ProcessedDocumentChunkMatch>;
	similarity: number;
}

export interface ResponseDocumentMatchReference {
	registered_document_id: number;
	processed_document_id: number;
	similarity: number;
	processed_document_summary_match: ProcessedDocumentSummaryMatchReference;
	processed_document_chunk_matches: Array<ProcessedDocumentChunkMatchReference>;
}

export interface DocumentSearchResponse {
	userRequestId: string;
	documentMatches: ResponseDocumentMatch[];
}

export interface GenerateAnswerResponse {
	answer: OpenAIChatCompletionRequest;
}

export interface GenerateAnswerBody {
	query: string;
	userRequestId: string;
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	embedding: any;
	match_threshold: number;
	document_limit: number;
	chunk_limit: number;
	summary_limit: number;
	num_probes_summaries: number;
	num_probes_chunks: number;
}

// eslint-disable-next-line no-shadow
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

export interface GeneratedPrompt {
	openAIChatCompletionRequest: OpenAIChatCompletionRequest;
	totalContextTokenSize: number;
	numberOfUsedSummaries: number;
	numberOfUsedChunks: number;
}

export function responseDocumentMatchToReference(
	responseDocumentMatch: ResponseDocumentMatch,
): ResponseDocumentMatchReference {
	return {
		registered_document_id: responseDocumentMatch.registered_document.id,
		processed_document_id: responseDocumentMatch.processed_document.id,
		similarity: responseDocumentMatch.similarity,
		processed_document_summary_match: {
			processed_document_summary_id:
				responseDocumentMatch.processed_document_summary_match
					.processed_document_summary.id,
			similarity:
				responseDocumentMatch.processed_document_summary_match.similarity,
		},
		processed_document_chunk_matches:
			responseDocumentMatch.processed_document_chunk_matches.map(
				(chunkMatch: ProcessedDocumentChunkMatch) => ({
					processed_document_chunk_id: chunkMatch.processed_document_chunk.id,
					similarity: chunkMatch.similarity,
				}),
			),
	};
}
