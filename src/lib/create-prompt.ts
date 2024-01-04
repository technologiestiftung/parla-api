import { codeBlock, oneLine } from "common-tags";
import GPT3Tokenizer from "gpt3-tokenizer";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { CreateChatCompletionRequest } from "openai";
import { ResponseDocumentMatch } from "./common.js";
import { ApplicationError } from "./errors.js";

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
}: CreatePromptOptions): CreateChatCompletionRequest {
	const contextDivider = "----";

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

		contextText += `${content.trim()}\n${contextDivider}\n`;
	}

	// Build the prompt
	const prompt = codeBlock`
		${oneLine`
			Du bist ein KI-Assistent der Berliner Verwaltung, der in der Lage ist aus Abschnitten von relevanten Dokumenten eine sinnvolle Antwort zu generieren.
			Du antwortest immer auf Deutsch. Du benutzt immer das Sie, niemals das du.
			Du beantwortest die Frage nur mit den vorliegenden Abschnitten aus relevanten Dokumenten.
			Erwähne die Abschnitte nicht nach ihrer Reihenfolge.
			Erstelle eine sinnvolle Antwort aus allen relevanten Informationen.
			Konzentriere dich dabei auf die wichtigsten Inhaltes der vorliegenden Informationen..
			Achte darauf, dass keine Fakten verändert werden.
			Verändere keine Namen und keine Berufsbezeichnungen.
			Verändere keine Zahlen und keine Datumsangaben.
		`}
		${oneLine`Start Abschnitte der relevanten Dokumente getrennt durch ${contextDivider}:`}
		${contextText}
		${oneLine`Ende Abschnitte der relevanten Dokumente.`}
		Das ist die Frage des Benutzers:
	`;

	const completionOptions: CreateChatCompletionRequest = {
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
