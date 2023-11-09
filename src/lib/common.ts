// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { CreateChatCompletionRequest } from "openai";
import { Database } from "./database.js";

type Section = Database["public"]["Tables"]["processed_document_chunks"]["Row"];
type Pdf = Database["public"]["Tables"]["registered_documents"]["Row"];
type Doc = Database["public"]["Tables"]["processed_documents"]["Row"];

// type ReportSection = Database["public"]["Tables"]["parsed_red_number_report_sections"]["Row"];
// type Report = Database["public"]["Tables"]["parsed_red_number_reports"]["Row"];
// type ReportPdf = Database["public"]["Tables"]["red_number_reports"]["Row"];

export type Model = "gpt-4" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k";

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
	parsed_documents?: Doc[];
	similarity?: number;
	pdfs?: Pdf[];
}

// export interface ResponseSectionReport extends Partial<ReportSection> {
// 	parsed_red_number_reports?: Report[];
// 	similarity?: number;
// 	pdfs?: ReportPdf[];
// }

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
