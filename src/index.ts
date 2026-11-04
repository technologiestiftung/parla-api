// needs fasitfy
// https://fastify.dev/docs/latest/Guides/Getting-Started
import { FastifyPluginOptions } from "fastify";
import { buildServer } from "./lib/build-server.js";
import { EnvError } from "./lib/errors.js";

export interface ParlaConfig extends FastifyPluginOptions {
	LLM_API_KEY: string;
	LLM_BASE_URL: string;
	LLM_CHAT_MODEL: string;
	LLM_CHAT_REASONING_EFFORT?: string;
	LLM_EMBEDDING_MODEL: string;
	CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT: number;
	CHAT_COMPLETION_GENERATED_ANSWER_TOKEN_LIMIT: number;
	BEST_GUESS_ESTIMATION_TOKEN_FACTOR: number;
	CHAT_COMPLETION_TEMPERATURE: number;
}

async function main() {
	try {
		const PORT = parseInt(process.env.PORT ?? "8080");
		const LLM_API_KEY = process.env.LLM_API_KEY;
		const LLM_BASE_URL = process.env.LLM_BASE_URL;
		const LLM_CHAT_MODEL = process.env.LLM_CHAT_MODEL;
		// Optional: only set it for reasoning models, other models reject the parameter
		const LLM_CHAT_REASONING_EFFORT = process.env.LLM_CHAT_REASONING_EFFORT;
		const LLM_EMBEDDING_MODEL = process.env.LLM_EMBEDDING_MODEL;
		const CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT =
			process.env.CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT;
		const CHAT_COMPLETION_GENERATED_ANSWER_TOKEN_LIMIT =
			process.env.CHAT_COMPLETION_GENERATED_ANSWER_TOKEN_LIMIT;
		const BEST_GUESS_ESTIMATION_TOKEN_FACTOR =
			process.env.BEST_GUESS_ESTIMATION_TOKEN_FACTOR;
		const CHAT_COMPLETION_TEMPERATURE = process.env.CHAT_COMPLETION_TEMPERATURE;

		if (!PORT) {
			throw new EnvError("PORT");
		}
		if (!LLM_API_KEY) {
			throw new EnvError("LLM_API_KEY");
		}
		if (!LLM_BASE_URL) {
			throw new EnvError("LLM_BASE_URL");
		}
		if (!LLM_CHAT_MODEL) {
			throw new EnvError("LLM_CHAT_MODEL");
		}
		if (!LLM_EMBEDDING_MODEL) {
			throw new EnvError("LLM_EMBEDDING_MODEL");
		}
		if (!CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT) {
			throw new EnvError("CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT");
		}
		if (!CHAT_COMPLETION_GENERATED_ANSWER_TOKEN_LIMIT) {
			throw new EnvError("CHAT_COMPLETION_GENERATED_ANSWER_TOKEN_LIMIT");
		}
		if (
			!CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT ||
			isNaN(parseInt(CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT))
		) {
			throw new EnvError("CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT");
		}
		if (
			!CHAT_COMPLETION_GENERATED_ANSWER_TOKEN_LIMIT ||
			isNaN(parseInt(CHAT_COMPLETION_GENERATED_ANSWER_TOKEN_LIMIT))
		) {
			throw new EnvError("CHAT_COMPLETION_GENERATED_ANSWER_TOKEN_LIMIT");
		}
		if (
			!BEST_GUESS_ESTIMATION_TOKEN_FACTOR ||
			isNaN(parseFloat(BEST_GUESS_ESTIMATION_TOKEN_FACTOR))
		) {
			throw new EnvError("BEST_GUESS_ESTIMATION_TOKEN_FACTOR");
		}
		if (
			!CHAT_COMPLETION_TEMPERATURE ||
			isNaN(parseFloat(CHAT_COMPLETION_TEMPERATURE))
		) {
			throw new EnvError("CHAT_COMPLETION_TEMPERATURE");
		}

		const parlaConfig = {
			LLM_API_KEY: LLM_API_KEY,
			LLM_BASE_URL: LLM_BASE_URL,
			LLM_CHAT_MODEL: LLM_CHAT_MODEL,
			LLM_CHAT_REASONING_EFFORT: LLM_CHAT_REASONING_EFFORT,
			LLM_EMBEDDING_MODEL: LLM_EMBEDDING_MODEL,
			CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT: parseInt(
				CHAT_COMPLETION_CONTEXT_TOKEN_LIMIT,
			),
			CHAT_COMPLETION_GENERATED_ANSWER_TOKEN_LIMIT: parseInt(
				CHAT_COMPLETION_GENERATED_ANSWER_TOKEN_LIMIT,
			),
			BEST_GUESS_ESTIMATION_TOKEN_FACTOR: parseFloat(
				BEST_GUESS_ESTIMATION_TOKEN_FACTOR,
			),
			CHAT_COMPLETION_TEMPERATURE: parseFloat(CHAT_COMPLETION_TEMPERATURE),
		};

		const server = await buildServer(parlaConfig);
		await server.ready();

		server.listen({ port: PORT, host: "0.0.0.0" }, function (err) {
			if (err) {
				server.log.error(err);
				process.exit(1);
			}
			// Server is now listening on ${address}
		});

		// quit on ctrl-c when running docker in terminal
		process.on("SIGINT", async function onSigint() {
			// eslint-disable-next-line no-console
			console.info(
				"Got SIGINT (aka ctrl-c in docker). Graceful shutdown ",
				new Date().toISOString(),
			);
			await server.close();
		});

		// quit properly on docker stop
		process.on("SIGTERM", async function onSigterm() {
			// eslint-disable-next-line no-console
			console.info(
				"Got SIGTERM (docker container stop). Graceful shutdown ",
				new Date().toISOString(),
			);
			await server.close();
		});
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
