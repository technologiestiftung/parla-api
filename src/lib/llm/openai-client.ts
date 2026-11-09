import { OpenAI } from "openai";
import { Readable } from "stream";
import { CompletionStreamStats, LLMClient } from "./llm-client.js";

type ContentChunk = { type: string; text?: string; thinking?: unknown };

// The parts of a streamed chat completion chunk that the stats are read from
export interface StreamChunk {
	choices: Array<{ delta?: { content?: unknown } }>;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		completion_tokens_details?: { reasoning_tokens?: number };
	} | null;
}

// Reasoning models (e.g. GLM via Mistral) return the content as a list of chunks
// (thinking and text) instead of a string, so only the text chunks are kept
export function getTextContent(content: unknown): string {
	if (typeof content === "string") {
		return content;
	}
	if (Array.isArray(content)) {
		return (content as Array<ContentChunk>)
			.filter(({ type }) => type === "text")
			.map(({ text }) => text ?? "")
			.join("");
	}
	return "";
}

// Mistral nests the thinking text as a string or a list of text chunks
export function getThinkingContent(content: unknown): string {
	if (!Array.isArray(content)) {
		return "";
	}
	return (content as Array<ContentChunk>)
		.filter(({ type }) => type === "thinking")
		.map(({ thinking, text }) => {
			if (typeof thinking === "string") {
				return thinking;
			}
			if (Array.isArray(thinking)) {
				return getTextContent(thinking);
			}
			return text ?? "";
		})
		.join("");
}

export function createEmptyStreamStats(): CompletionStreamStats {
	return {
		firstChunkMs: null,
		firstThinkingMs: null,
		firstTextMs: null,
		thinkingChars: 0,
		inputTokens: null,
		outputTokens: null,
		reasoningTokens: null,
	};
}

export function updateStreamStats(
	stats: CompletionStreamStats,
	chunk: StreamChunk,
	elapsedMs: number,
): void {
	stats.firstChunkMs ??= elapsedMs;

	const content = chunk.choices[0]?.delta?.content;
	const thinking = getThinkingContent(content);
	if (thinking.length > 0) {
		stats.firstThinkingMs ??= elapsedMs;
		stats.thinkingChars += thinking.length;
	}
	if (getTextContent(content).length > 0) {
		stats.firstTextMs ??= elapsedMs;
	}

	// Mistral sends the usage with the last chunk
	if (chunk.usage) {
		stats.inputTokens = chunk.usage.prompt_tokens ?? null;
		stats.outputTokens = chunk.usage.completion_tokens ?? null;
		stats.reasoningTokens =
			chunk.usage.completion_tokens_details?.reasoning_tokens ?? null;
	}
}

export class OpenAIClient implements LLMClient {
	openAi: OpenAI;
	constructor(apiKey: string, baseURL: string) {
		this.openAi = new OpenAI({ apiKey, baseURL });
	}
	async requestResponseStream(
		payload: object,
		deltaCallback: (delta: string) => void,
		statsCallback?: (stats: CompletionStreamStats) => void,
	): Promise<Readable> {
		const startedAt = Date.now();
		const stats = createEmptyStreamStats();

		//@ts-expect-error: @Jaszkowic Why can we expect an error here?
		const answerStream = await this.openAi.chat.completions.create(payload);
		const buffer = new Readable();
		buffer._read = () => {};
		const emit = async () => {
			for await (const chunk of answerStream) {
				updateStreamStats(stats, chunk as StreamChunk, Date.now() - startedAt);
				const delta = getTextContent(chunk.choices[0]?.delta?.content);
				deltaCallback(delta);
				buffer.push(delta);
			}
			statsCallback?.(stats);
			buffer.push(null);
		};
		emit();
		return buffer;
	}
}
