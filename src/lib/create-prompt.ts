import GPT3Tokenizer from "gpt3-tokenizer";
import { facts } from "../fixtures/facts.js";
import {
	GeneratedPrompt,
	OpenAIChatCompletionRequest,
	ResponseDocumentMatch,
} from "./common.js";
import { getCleanedMetadata } from "./util.js";

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
}: CreatePromptOptions): GeneratedPrompt {
	// eslint-disable-next-line new-cap
	const tokenizer = new GPT3Tokenizer.default({ type: "gpt3" });

	let context = "";
	let numberOfSummariesInContext = 0;
	let numberOfChunksInContext = 0;

	const orderedDocumentMatches = documentMatches.sort((a, b) => {
		return b.similarity - a.similarity;
	});

	// Build the context:
	// Starting with the best document:
	// - add the summary
	// - add chunks
	// until the context token limit is reached
	for (const documentMatch of orderedDocumentMatches) {
		const metadata = getCleanedMetadata(documentMatch.registered_document);

		if (includeSummary) {
			const summaryContent =
				documentMatch.processed_document_summary_match
					.processed_document_summary.summary;

			const existingContentPlusSummary =
				context +
				`\n\nAus dem Dokument ${metadata.documentName} mit dem Titel "${metadata.title}" vom ${metadata.formattedDate}:\n` +
				summaryContent;

			const tokenSize = tokenizer.encode(existingContentPlusSummary).text
				.length;

			if (tokenSize < MAX_CONTENT_TOKEN_LENGTH) {
				context = existingContentPlusSummary;
				numberOfSummariesInContext++;
			} else {
				// If context full, break
				break;
			}
		}

		const orderedDocumentChunks =
			documentMatch.processed_document_chunk_matches.sort((a, b) => {
				return b.similarity - a.similarity;
			});
		for (const chunk of orderedDocumentChunks) {
			const existingContentPlusChunk =
				context + "\n\n" + chunk.processed_document_chunk.content;
			const tokenSize = tokenizer.encode(existingContentPlusChunk).text.length;
			if (tokenSize < MAX_CONTENT_TOKEN_LENGTH) {
				context = existingContentPlusChunk;
				numberOfChunksInContext++;
			} else {
				// If context full, break
				break;
			}
		}
	}

	const questionAnswerFacts = facts
		.map((fact) => `Frage: ${fact.question} Antwort: ${fact.answer}`)
		.join("\n");

	// Build the prompt
	const prompt = `
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

"""
${context}
"""
		
Welche Fakten solltest du zusätzlich beachten?
	- Beachte zusätzlich IMMER die folgenden Fakten, präsentiert als Frage-Antwort-Paare:
${questionAnswerFacts}
`;

	const allMessages = [
		{
			role: "system",
			content: prompt,
		},
		{ role: "user", content: sanitizedQuery },
	];

	const completionOptions: OpenAIChatCompletionRequest = {
		model: OPENAI_MODEL,
		messages: allMessages,
		max_tokens: MAX_TOKENS,
		temperature: temperature,
		stream: true,
		// https://platform.openai.com/docs/api-reference/chat
		// seed feature is in Beta. If specified, our system will make a best effort to
		// sample deterministically, such that repeated requests with the same seed and
		// parameters should return the same result. Determinism is not guaranteed.
		seed: 1024,
	};

	const totalContextTokenSize = tokenizer.encode(
		allMessages.map((m) => m.content).join(""),
	).text.length;

	const generatedPrompt = {
		openAIChatCompletionRequest: completionOptions,
		totalContextTokenSize: totalContextTokenSize,
		numberOfSummariesInContext: numberOfSummariesInContext,
		numberOfChunksInContext: numberOfChunksInContext,
	};

	return generatedPrompt;
}
