// needs fasitfy
// https://fastify.dev/docs/latest/Guides/Getting-Started
import { buildServer } from "./lib/build-server.js";
import { Model } from "./lib/common.js";
import { EnvError } from "./lib/errors.js";

async function main() {
	try {
		const PORT = parseInt(process.env.PORT ?? "8080");
		const OPENAI_MODEL = process.env.OPENAI_MODEL as Model;
		const OPENAI_KEY = process.env.OPENAI_KEY;
		const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL;

		if (!PORT) {
			throw new EnvError("PORT");
		}
		if (!OPENAI_MODEL) {
			throw new EnvError("OPENAI_MODEL");
		}
		if (!OPENAI_KEY) {
			throw new EnvError("OPENAI_KEY");
		}
		if (!OPENAI_EMBEDDING_MODEL) {
			throw new EnvError("OPENAI_EMBEDDING_MODEL");
		}

		const server = await buildServer({
			OPENAI_MODEL,
			OPENAI_KEY,
			OPENAI_EMBEDDING_MODEL,
		});
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
