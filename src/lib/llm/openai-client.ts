import { OpenAI } from "openai";
import { Readable } from "stream";
import { LLMClient } from "./llm-client.js";

export class OpenAIClient implements LLMClient {
	openAi: OpenAI;
	constructor(apiKey: string) {
		this.openAi = new OpenAI({ apiKey });
	}
	async requestResponseStream(
		payload: object,
		deltaCallback: (delta: string) => void,
	): Promise<Readable> {
		//@ts-ignore
		const answerStream = await this.openAi.chat.completions.create(payload);
		const buffer = new Readable();
		buffer._read = () => {};
		var emit = async () => {
			for await (const chunk of answerStream) {
				const delta = chunk.choices[0]?.delta?.content || "";
				deltaCallback(delta);
				buffer.push(delta);
			}
			buffer.push(null);
		};
		emit();
		return buffer;
	}
}
