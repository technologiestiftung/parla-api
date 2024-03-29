import { codeBlock, oneLine } from "common-tags";
import GPT3Tokenizer from "gpt3-tokenizer";
import {
	OpenAIChatCompletionRequest,
	ResponseDocumentMatch,
} from "./common.js";
import { ApplicationError } from "./errors.js";
import facts from "../fixtures/facts.js";

export interface CreatePromptOptions {
	sanitizedQuery: string;
	OPENAI_MODEL: string;
	documentMatches: Array<ResponseDocumentMatch>;
	MAX_CONTENT_TOKEN_LENGTH: number;
	MAX_TOKENS: number;
	temperature: number;
	includeSummary: boolean;
}
export function createPrompt({
	documentMatches,
	MAX_CONTENT_TOKEN_LENGTH,
	OPENAI_MODEL,
	sanitizedQuery,
	MAX_TOKENS,
	temperature,
	includeSummary,
}: CreatePromptOptions): OpenAIChatCompletionRequest {
	const tokenizer = new GPT3Tokenizer.default({ type: "gpt3" });
	let tokenCount = 0;
	let contextText = "";

	// Concatenate the context
	for (let i = 0; i < documentMatches.length; i++) {
		const documentMatch = documentMatches[i];

		const chunkContent = documentMatch.processed_document_chunk_matches
			.map((chunk) => chunk.processed_document_chunk.content)
			.join("\n");

		let content = chunkContent;

		if (includeSummary) {
			const summaryContent =
				documentMatch.processed_document_summary_match
					.processed_document_summary.summary;

			content = content + "\n" + summaryContent;
		}

		const encoded = tokenizer.encode(content);
		tokenCount += encoded.text.length;

		if (tokenCount >= MAX_CONTENT_TOKEN_LENGTH) {
			throw new ApplicationError(
				`Reached max token count of ${MAX_CONTENT_TOKEN_LENGTH}.`,
				{
					tokenCount,
				},
			);
		}

		contextText += `${content.trim()}\n\n`;
	}

	// Build the prompt
	const prompt = codeBlock`
		${oneLine`
		Du bist ein KI-Assistent der Berliner Verwaltung, der auf Basis einer Datengrundlage sinnvolle Antworten generiert.
		Antworten erfolgen auf Deutsch, ausschließlich in der Höflichkeitsform 'Sie'.
		Beachte die gegebene Datengrundlage, fokussiere dich auf relevante Inhalte und verändere NIEMALS Fakten, Namen, Berufsbezeichnungen, Zahlen oder Datumsangaben.
		WICHTIG: Gebe die Antwort IMMER formatiert als Markdown zurück.
		`}
		${oneLine`Das ist die Datengrundlage, getrennt durch """:`}
		"""${contextText}"""
		Beachte zusätzlich IMMER die folgenden Fakten, präsentiert als Frage-Antwort-Paare:
		${facts
			.map((fact) => `Frage: ${fact.question} Antwort: ${fact.answer}`)
			.join("\n")}
	`;

	const completionOptions: OpenAIChatCompletionRequest = {
		model: OPENAI_MODEL,
		messages: [
			{
				role: "system",
				content: prompt,
			},
			{ role: "user", content: sanitizedQuery },
		],
		max_tokens: MAX_TOKENS,
		temperature: temperature,
		stream: true,
	};

	return completionOptions;
}
