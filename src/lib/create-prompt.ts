import { codeBlock, oneLine } from "common-tags";
import GPT3Tokenizer from "gpt3-tokenizer";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { CreateChatCompletionRequest } from "openai";
import { ResponseDocumentMatch } from "./common.js";
import { ApplicationError } from "./errors.js";

export function createPrompt({
	documentMatches,
	MAX_CONTENT_TOKEN_LENGTH,
	OPENAI_MODEL,
	sanitizedQuery,
	MAX_TOKENS,
}: {
	sanitizedQuery: string;
	OPENAI_MODEL: string;
	documentMatches: Array<ResponseDocumentMatch>;
	MAX_CONTENT_TOKEN_LENGTH: number;
	MAX_TOKENS: number;
}): CreateChatCompletionRequest {
	// 4. create a prompt with the
	const tokenizer = new GPT3Tokenizer.default({ type: "gpt3" });
	let tokenCount = 0;
	let contextText = "";
	for (let i = 0; i < documentMatches.length; i++) {
		const documentMatch = documentMatches[i];

		const content = documentMatch.processed_document_chunk_matches
			.map((chunk) => chunk.processed_document_chunk.content)
			.join("\n");

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

		contextText += `${content.trim()}\n---\n`;
	}
	const prompt = codeBlock`
		${oneLine`
			Du bist ein KI Assistent des Verwaltung. Du antwortest immer in Deutsch. Du benutzt immer das Sie nie das du.
			Mit den folgenden Abschnitte aus das den schriftlichen Anfragen, beantwortest du die Frage nur mit diesen Informationen. ERWÄHNE DIE ABSCHNITTE NICHT NACH IHRER REINHENFOLGE. Erstelle eine sinnvolle Antowort aus allen relevanten Informationen.
		`}
		${oneLine`Start Abschnitte der schriftlichen Anfragen getrennt durch "---":`}
		${contextText}
		${oneLine`Ende Abschnitte der schriftlichen Anfragen`}
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
		// max tokens only applies to the reponse length
		max_tokens: MAX_TOKENS,
		temperature: 0.5,
		stream: false,
	};
	return completionOptions;
}
