import { S } from "fluent-json-schema";
import { Model } from "./common.js";

export const MODELS: Record<string, Model> = {
	GPT_4: "gpt-4",
	GPT_3_5_TURBO: "gpt-3.5-turbo",
	GPT_3_5_TURBO_16K: "gpt-3.5-turbo-16k",
};
export const bodySchema = S.object()
	.prop("query", S.string())
	.prop("temperature", S.number().minimum(0).maximum(2).default(0.5))
	.prop("match_threshold", S.number().minimum(0).maximum(1).default(0.85))
	.prop("num_probes", S.number().minimum(1).maximum(49).default(7))
	.prop("match_count", S.number().minimum(1).maximum(10).default(5))
	.prop("min_content_length", S.number().minimum(0).maximum(10000).default(50))
	.prop(
		"openai_model",
		S.string().enum(Object.values(MODELS)).default(MODELS.GPT_3_5_TURBO),
	)
	.required(["query"]);

export const healthSchema = {
	200: S.object().prop("message", S.string().default("OK")),
};

const createChatCompletionRequestSchema = S.object()
	.prop("model", S.string())
	.prop("messages", S.array().items(S.object()))
	.prop("functions", S.array().items(S.object()))
	.prop("function_call", S.object())
	.prop("temperature", S.number())
	.prop("top_p", S.number())
	.prop("n", S.number())
	.prop("stream", S.boolean())
	.prop("stop", S.object())
	.prop("max_tokens", S.number())
	.prop("presence_penalty", S.number())
	.prop("frequency_penalty", S.number())
	.prop("logit_bias", S.object())
	.prop("user", S.string());

const choices = S.array().items(
	S.object()
		.prop("index", S.number())
		.prop(
			"message",
			S.object().prop("role", S.string()).prop("content", S.string()),
		)
		.prop("finsh_reason", S.string()),
);

const pdf = S.object()
	.prop("abstract", S.string())
	.prop("desk", S.string())
	.prop("dherk", S.string())
	.prop("dherkl", S.string())
	.prop("dokart", S.string())
	.prop("dokartl", S.string())
	.prop("dokdat", S.string())
	.prop("doknr", S.string())
	.prop("doktyp", S.string())
	.prop("doktypl", S.string())
	.prop("hnr", S.string())
	.prop("id", S.number())
	.prop("jg", S.string())
	.prop("lokurl", S.string())
	.prop("nrintyp", S.string())
	.prop("reihnr", S.string())
	.prop("sb", S.string())
	.prop("titel", S.string())
	.prop("urheber", S.string())
	.prop("vkdat", S.string())
	.prop("vorgang_id", S.number())
	.prop("wp", S.string());
const sections = S.object()
	.prop(
		"parsed_documents",
		S.array().items(
			S.object()
				.prop("checksum", S.string())
				.prop("dokument_id", S.number())
				.prop("filename", S.string())
				.prop("id", S.number())
				.prop("meta", S.object()),
		),
	)
	.prop("similarity", S.number())
	.prop("pdfs", S.array().items(pdf));

const usage = S.object()
	.prop("prompt_tokens", S.number())
	.prop("completion_tokens", S.number())
	.prop("total_tokens", S.number());
const gpt = S.object()
	.prop("id", S.string())
	.prop("created", S.number())
	.prop("model", S.string())
	.prop("object", S.string())
	.prop("usage", usage)
	.prop("choices", choices);
export const responseSchema = {
	201: S.array().items(
		S.object()
			.prop("gpt", gpt)
			.prop("requestBody", bodySchema)
			.prop("completionOptions", createChatCompletionRequestSchema)
			.prop("sections", S.array().items(sections)),
	),
};
