// ESM
import fastifySwagger from "@fastify/swagger";
import fastify from "fastify";
import { Model } from "./common.js";
import { ApplicationError, EnvError, UserError } from "./errors.js";
import { registerDocumentationRoute } from "./routes/documentation-route.js";
import { registerGenerateAnswerRoute } from "./routes/generate-answer-route.js";
import { registerHealthRoute } from "./routes/health-route.js";
import { registerRootRoute } from "./routes/root-route.js";
import { registerSearchDocumentsRoute } from "./routes/search-documents-route.js";
import { registerCountDocumentsRoute } from "./routes/count-documents-route.js";
import { registerLoadUserRequestRoute } from "./routes/load-user-request-route.js";
import { feedbackRoute } from "./routes/feedback-route.js";

export async function buildServer({
	OPENAI_MODEL,
	OPENAI_KEY,
	OPENAI_EMBEDDING_MODEL,
}: {
	OPENAI_MODEL: Model;
	OPENAI_KEY: string;
	OPENAI_EMBEDDING_MODEL: string;
}) {
	const NODE_ENV = process.env.NODE_ENV ?? "none";
	const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
	const envToLogger: Record<string, unknown> = {
		development: {
			level: LOG_LEVEL,
			transport: {
				target: "pino-pretty",
				options: {
					translateTime: "HH:MM:ss Z",
					ignore: "pid,hostname",
				},
			},
		},
		production: true,
		test: false,
	};

	const server = fastify({
		logger: envToLogger[NODE_ENV] ?? true,
		disableRequestLogging: !(NODE_ENV === "development" || NODE_ENV === "test"),
	});
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	await server.register(fastifySwagger, {
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

	// Set rate limit
	await server.register(import("@fastify/rate-limit"), {
		max: 30,
		timeWindow: "1 minute",
	});

	registerDocumentationRoute(fastify);
	registerRootRoute(fastify);
	registerHealthRoute(fastify);
	registerCountDocumentsRoute(fastify);
	fastify.register(feedbackRoute, { prefix: "/feedbacks" });

	registerSearchDocumentsRoute(
		server,
		OPENAI_KEY,
		OPENAI_EMBEDDING_MODEL,
		OPENAI_MODEL,
	);
	registerGenerateAnswerRoute(server, OPENAI_MODEL, OPENAI_KEY);
	registerLoadUserRequestRoute(server);

	server.setErrorHandler(function (error, request, reply) {
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
	return server;
}

// Run the server!
