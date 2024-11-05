import { facts } from "../fixtures/facts.js";
import { ParlaConfig } from "../index.js";
import {
	GeneratedPrompt,
	OpenAIChatCompletionRequest,
	ResponseDocumentMatch,
} from "./common.js";
import { getCleanedMetadata } from "./util.js";

export interface CreatePromptOptions {
	sanitizedQuery: string;
	documentMatches: Array<ResponseDocumentMatch>;
	includeSummary: boolean;
}

export function createPrompt(
	createPromptOptions: CreatePromptOptions,
	parlaConfig: ParlaConfig,
): GeneratedPrompt {
	const LIMIT = parlaConfig.CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT;
	const FACTOR = parlaConfig.BEST_GUESS_ESTIMATION_TOKEN_FACTOR;

	let context = "";
	const summaryIdsInContext = [];
	const chunkIdsInContext = [];

	const orderedDocumentMatches = createPromptOptions.documentMatches.sort(
		(a, b) => {
			return b.similarity - a.similarity;
		},
	);

	// Build the context:
	// Starting with the best document:
	// - add the summary
	// - add chunks
	// until the context token limit is reached
	for (const documentMatch of orderedDocumentMatches) {
		const metadata = getCleanedMetadata(documentMatch.registered_document);

		if (createPromptOptions.includeSummary) {
			const summaryId =
				documentMatch.processed_document_summary_match
					.processed_document_summary.id;

			const summaryContent =
				documentMatch.processed_document_summary_match
					.processed_document_summary.summary;

			const existingContentPlusSummary =
				context +
				`\n\nAus dem Dokument ${metadata.documentName} mit dem Titel "${metadata.title}" vom ${metadata.formattedDate}:\n` +
				summaryContent;

			const estimatedTokenSize = existingContentPlusSummary.length / FACTOR;

			if (estimatedTokenSize < LIMIT) {
				context = existingContentPlusSummary;
				summaryIdsInContext.push(summaryId);
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
			const estimatedChunkTokenSize = existingContentPlusChunk.length / LIMIT;
			if (estimatedChunkTokenSize < LIMIT) {
				context = existingContentPlusChunk;
				chunkIdsInContext.push(chunk.processed_document_chunk.id);
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
	- Leite die Sprache deiner Antworten aus der Sprache dieser Nutzerfrage ab: """${createPromptOptions.sanitizedQuery}"""
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
		{ role: "user", content: createPromptOptions.sanitizedQuery },
	];

	const completionOptions: OpenAIChatCompletionRequest = {
		model: parlaConfig.OPENAI_MODEL,
		messages: allMessages,
		max_tokens: parlaConfig.CHAT_COMPLETION_GENERATED_ANSWER_TOKEN_LIMIT,
		temperature: parlaConfig.CHAT_COMPLETION_TEMPERATURE,
		stream: true,
		// https://platform.openai.com/docs/api-reference/chat
		// seed feature is in Beta. If specified, our system will make a best effort to
		// sample deterministically, such that repeated requests with the same seed and
		// parameters should return the same result. Determinism is not guaranteed.
		seed: 1024,
	};

	const generatedPrompt = {
		openAIChatCompletionRequest: completionOptions,
		summaryIdsInContext: summaryIdsInContext,
		chunkIdsInContext: chunkIdsInContext,
	};

	return generatedPrompt;
}
