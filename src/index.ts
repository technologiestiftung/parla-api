// needs fasitfy
// https://fastify.dev/docs/latest/Guides/Getting-Started
import { buildServer } from "./build-server.js";
import { EnvError } from "./lib/errors.js";

async function main() {
	try {
		const PORT = parseInt(process.env.PORT ?? "8080");
		const OPENAI_MODEL = process.env.OPENAI_MODEL;
		const OPENAI_KEY = process.env.OPENAI_KEY;

		if (!PORT) {
			throw new EnvError("PORT");
		}
		if (!OPENAI_MODEL) {
			throw new EnvError("OPENAI_MODEL");
		}
		if (!OPENAI_KEY) throw new EnvError("OPENAI_KEY");

		const server = await buildServer({ OPENAI_MODEL, OPENAI_KEY });

		server.listen({ port: PORT, host: "0.0.0.0" }, function (err) {
			if (err) {
				server.log.error(err);
				process.exit(1);
			}
			// Server is now listening on ${address}
		});

		// quit on ctrl-c when running docker in terminal
		process.on("SIGINT", async function onSigint() {
			console.info(
				"Got SIGINT (aka ctrl-c in docker). Graceful shutdown ",
				new Date().toISOString(),
			);
			await server.close();
		});

		// quit properly on docker stop
		process.on("SIGTERM", async function onSigterm() {
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
