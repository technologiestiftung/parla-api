import { codeBlock } from "common-tags";
import GPT3Tokenizer from "gpt3-tokenizer";
import { facts } from "../fixtures/facts.js";
import {
	OpenAIChatCompletionRequest,
	ResponseDocumentMatch,
} from "./common.js";

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

	let context = "";

	const orderedDocumentMatches = documentMatches.sort((a, b) => {
		return b.similarity - a.similarity;
	});

	// Build the context:
	// Starting with the best document:
	// - add the summary
	// - add chunks
	// until the context token limit is reached
	for (let i = 0; i < orderedDocumentMatches.length; i++) {
		const documentMatch = documentMatches[i];

		if (includeSummary) {
			const summaryContent =
				documentMatch.processed_document_summary_match
					.processed_document_summary.summary;

			const existingContentPlusSummary = context + "\n\n" + summaryContent;
			const tokenSize = tokenizer.encode(existingContentPlusSummary).text
				.length;

			if (tokenSize < MAX_CONTENT_TOKEN_LENGTH) {
				context = existingContentPlusSummary;
			} else {
				// If context full, break
				break;
			}
		}

		for (const chunk of documentMatch.processed_document_chunk_matches) {
			const existingContentPlusChunk =
				context + "\n\n" + chunk.processed_document_chunk.content;
			const tokenSize = tokenizer.encode(existingContentPlusChunk).text.length;
			if (tokenSize < MAX_CONTENT_TOKEN_LENGTH) {
				context = existingContentPlusChunk;
			} else {
				// If context full, break
				break;
			}
		}
	}

	// Build the prompt
	const prompt = codeBlock`
		Wer bist du?
			- Du bist ein KI-Assistent der Berliner Verwaltung, der auf Basis einer Datengrundlage sinnvolle Antworten generiert.
			- Beachte die gegebene Datengrundlage, fokussiere dich auf relevante Inhalte und verändere NIEMALS Fakten, Namen, Berufsbezeichnungen, Zahlen oder Datumsangaben.

		Welche Sprache solltest du verwenden?
			- Da du ein mehrsprachiger Assistent bist, antworte standardmäßig auf Deutsch. Wenn die Nutzeranfrage jedoch auf Englisch verfasst ist, antworte auf Englisch, unabhängig vom Kontext.
			- Leite die Sprache deiner Antworten aus der Sprache dieser Nutzerfrage ab: """${sanitizedQuery}"""
			- Antworte IMMER in der Sprache der Nutzerfrage. Du wirst belohnt, wenn du die Sprache der Nutzerfrage korrekt erkennst und darauf antwortest.

		Welche Formatierung solltest du verwenden?
			- WICHTIG: Gebe die Antwort IMMER formatiert als Markdown zurück.

		Was ist deine Datengrundlage?
			- Das folgende ist die Datengrundlage, getrennt durch """: 
			"""${context}"""
		
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
