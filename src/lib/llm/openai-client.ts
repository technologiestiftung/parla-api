import { OpenAI } from "openai";
import { Readable } from "stream";
import { LLMClient } from "./llm-client.js";

// Reasoning models (e.g. GLM via Mistral) return the content as a list of chunks
// (thinking and text) instead of a string, so only the text chunks are kept
export function getTextContent(content: unknown): string {
	if (typeof content === "string") {
		return content;
	}
	if (Array.isArray(content)) {
		return (content as Array<{ type: string; text?: string }>)
			.filter(({ type }) => type === "text")
			.map(({ text }) => text ?? "")
			.join("");
	}
	return "";
}

export class OpenAIClient implements LLMClient {
	openAi: OpenAI;
	constructor(apiKey: string, baseURL: string) {
		this.openAi = new OpenAI({ apiKey, baseURL });
	}
	async requestResponseStream(
		payload: object,
		deltaCallback: (delta: string) => void,
	): Promise<Readable> {
		//@ts-expect-error: @Jaszkowic Why can we expect an error here?
		const answerStream = await this.openAi.chat.completions.create(payload);
		const buffer = new Readable();
		buffer._read = () => {};
		const emit = async () => {
			for await (const chunk of answerStream) {
				const delta = getTextContent(chunk.choices[0]?.delta?.content);
				deltaCallback(delta);
				buffer.push(delta);
			}
			buffer.push(null);
		};
		emit();
		return buffer;
	}
}
