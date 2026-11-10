import { Readable } from "stream";

// Timings are measured from the start of the completion request
export interface CompletionStreamStats {
	firstChunkMs: number | null;
	firstThinkingMs: number | null;
	firstTextMs: number | null;
	thinkingChars: number;
	inputTokens: number | null;
	outputTokens: number | null;
	reasoningTokens: number | null;
}

export interface LLMClient {
	requestResponseStream: (
		payload: object,
		deltaCallback: (delta: string) => void,
		statsCallback?: (stats: CompletionStreamStats) => void,
	) => Promise<Readable>;
}
