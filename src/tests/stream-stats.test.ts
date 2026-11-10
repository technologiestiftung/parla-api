import test from "ava";
import {
	createEmptyStreamStats,
	getTextContent,
	getThinkingContent,
	updateStreamStats,
} from "../lib/llm/openai-client.js";

const mistralContent = [
	{ type: "thinking", thinking: [{ type: "text", text: "Let me think." }] },
	{ type: "text", text: "Answer" },
];

test("getTextContent keeps plain strings and only the text chunks of a list", (t) => {
	t.is(getTextContent("plain"), "plain");
	t.is(getTextContent(mistralContent), "Answer");
	t.is(getTextContent(null), "");
});

test("getThinkingContent reads nested and plain thinking chunks", (t) => {
	t.is(getThinkingContent(mistralContent), "Let me think.");
	t.is(getThinkingContent([{ type: "thinking", thinking: "plain" }]), "plain");
	t.is(getThinkingContent("no thinking in a string"), "");
});

test("updateStreamStats records first chunk, thinking and text times and the usage", (t) => {
	const stats = createEmptyStreamStats();

	updateStreamStats(stats, { choices: [{ delta: { content: "" } }] }, 100);
	updateStreamStats(
		stats,
		{ choices: [{ delta: { content: [mistralContent[0]] } }] },
		200,
	);
	updateStreamStats(stats, { choices: [{ delta: { content: "Hi" } }] }, 300);
	updateStreamStats(stats, { choices: [{ delta: { content: "!" } }] }, 400);
	updateStreamStats(
		stats,
		{
			choices: [],
			usage: {
				prompt_tokens: 1500,
				completion_tokens: 220,
				completion_tokens_details: { reasoning_tokens: 9 },
			},
		},
		500,
	);

	t.deepEqual(stats, {
		firstChunkMs: 100,
		firstThinkingMs: 200,
		firstTextMs: 300,
		thinkingChars: "Let me think.".length,
		inputTokens: 1500,
		outputTokens: 220,
		reasoningTokens: 9,
	});
});

test("updateStreamStats leaves thinking and usage empty for a model without reasoning", (t) => {
	const stats = createEmptyStreamStats();

	updateStreamStats(stats, { choices: [{ delta: { content: "Hi" } }] }, 50);

	t.is(stats.firstThinkingMs, null);
	t.is(stats.thinkingChars, 0);
	t.is(stats.firstTextMs, 50);
	t.is(stats.inputTokens, null);
});
