// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { CreateChatCompletionRequest } from "openai";
import { Database } from "./database.js";

type Section = Database["public"]["Tables"]["processed_document_chunks"]["Row"];
type RegisteredDocument =
	Database["public"]["Tables"]["registered_documents"]["Row"];
type ProcessedDocument =
	Database["public"]["Tables"]["processed_documents"]["Row"];

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

export interface ResponseSectionDocument extends Partial<Section> {
	processed_documents?: ProcessedDocument[];
	similarity?: number;
	registered_documents?: RegisteredDocument[];
}

export interface ResponseDetail {
	gpt?: Gpt;
	requestBody?: Body;
	sections: ResponseSectionDocument[];
	// reportSections:  ResponseSectionReport[];
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
}
