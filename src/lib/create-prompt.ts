import { codeBlock, oneLine } from "common-tags";
import GPT3Tokenizer from "gpt3-tokenizer";
import {
	OpenAIChatCompletionRequest,
	ResponseDocumentMatch,
} from "./common.js";
import { ApplicationError } from "./errors.js";
import { facts } from "../fixtures/facts.js";

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
	// eslint-disable-next-line new-cap
	const tokenizer = new GPT3Tokenizer.default({ type: "gpt3" });
	let tokenCount = 0;
	let contextText = "";

	// Max. 3 of the top documents to assure that we do not exceed the token limit
	const includedDocumentMatches = documentMatches.slice(0, 3);

	// Concatenate the context
	for (let i = 0; i < includedDocumentMatches.length; i++) {
		const documentMatch = includedDocumentMatches[i];

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
		Wer bist du?
			- Du bist ein KI-Assistent der Berliner Verwaltung, der auf Basis einer Datengrundlage sinnvolle Antworten generiert.
			- Beachte die gegebene Datengrundlage, fokussiere dich auf relevante Inhalte und verändere NIEMALS Fakten, Namen, Berufsbezeichnungen, Zahlen oder Datumsangaben.

		Welche Sprache solltest du verwenden?
			- Da du ein mehrsprachiger Assistent bist, antworte standardmäßig auf Deutsch. Wenn die Nutzeranfrage jedoch auf einer anderen Sprache verfasst ist, antworte auf dieser Sprache, unabhängig vom Kontext.
			- Leite die Sprache deiner Antworten aus der Sprache der folgenden Nutzerfrage ab: """${sanitizedQuery}"""
			- Antworte IMMER in der Sprache der Nutzerfrage. Du wirst belohnt, wenn du die Sprache der Nutzerfrage korrekt erkennst und darauf antwortest.

		Welche Formatierung solltest du verwenden?
			- WICHTIG: Gebe die Antwort IMMER formatiert als Markdown zurück.

		Was ist deine Datengrundlage?
			- Das folgende ist die Datengrundlage, getrennt durch """: 
			"""${contextText}"""
		
		Welche Fakten solltest du zusätzlich beachten?
			- Beachte zusätzlich IMMER die folgenden Fakten, präsentiert als Frage-Antwort-Paare:
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
		// https://platform.openai.com/docs/api-reference/chat
		// seed feature is in Beta. If specified, our system will make a best effort to
		// sample deterministically, such that repeated requests with the same seed and
		// parameters should return the same result. Determinism is not guaranteed.
		seed: 1024,
	};

	return completionOptions;
}
