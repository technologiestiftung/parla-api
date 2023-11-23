/* eslint-disable indent */
// ESM
import fastifySwagger from "@fastify/swagger";
import Fastify from "fastify";
import { Model } from "./common.js";
import { ApplicationError, EnvError, UserError } from "./errors.js";
import { registerDocumentationRoute } from "./routes/documentation-route.js";
import { registerGenerateAnswerRoute } from "./routes/generate-answer-route.js";
import { registerHealthRoute } from "./routes/health-route.js";
import { registerRootRoute } from "./routes/root-route.js";
import { registerSearchDocumentsRoute } from "./routes/search-documents-route.js";
import { registerCountDocumentsRoute } from "./routes/count-documents-route.js";

export async function buildServer({
	OPENAI_MODEL,
	OPENAI_KEY,
}: {
	OPENAI_MODEL: Model;
	OPENAI_KEY: string;
}) {
	const NODE_ENV = process.env.NODE_ENV ?? "none";
	const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
	const fastify = Fastify({
		logger: {
			level: LOG_LEVEL,
		},
		disableRequestLogging: NODE_ENV === "development" ? false : true,
	});
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	await fastify.register(fastifySwagger, {
		mode: "dynamic",
		openapi: {
			info: {
				title: String,
				description: String,
				version: String,
			},
			externalDocs: Object,

			components: Object,
		},
	});

	// Register routes
	registerDocumentationRoute(fastify);
	registerRootRoute(fastify);
	registerHealthRoute(fastify);
	registerCountDocumentsRoute(fastify);
	registerSearchDocumentsRoute(fastify, OPENAI_MODEL, OPENAI_KEY);
	registerGenerateAnswerRoute(fastify, OPENAI_MODEL, OPENAI_KEY);

	fastify.setErrorHandler(function (error, request, reply) {
		if (error instanceof EnvError) {
			this.log.error(error, "Env variable is not defined");
			reply.status(500).send("Env variable is not defined");
		} else if (error instanceof ApplicationError) {
			// Log error
			this.log.error(error);
			// Send error response
			reply.status(500).send({ message: error.message, data: error.data });
		} else if (error instanceof UserError) {
			// Log error
			this.log.error(error);
			// Send error response
			reply.status(400).send({ message: error.message, data: error.data });
		} else {
			this.log.error(error);

			// fastify will use parent error handler to handle this
			reply.send(error);
		}
	});
	return fastify;
}

// Run the server!
