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
