// ESM
import fastifySwagger from "@fastify/swagger";
import fastify from "fastify";
import { Model } from "./common.js";
import { ApplicationError, EnvError, UserError } from "./errors.js";
import {
	documentationRouteOptions,
	swaggerOptions,
} from "./routes/documentation-route.js";
import { generateAnswerRoute } from "./routes/generate-answer-route.js";
import { healthRoute } from "./routes/health-route.js";
import { rootRoute } from "./routes/root-route.js";
import { searchDocumentsRoute } from "./routes/search-documents-route.js";
import { countDocumentsRoute } from "./routes/count-documents-route.js";
import { loadUserRequestRoute } from "./routes/load-user-request-route.js";
import { feedbackRoute } from "./routes/feedback-route.js";
import cors from "@fastify/cors";
import { corsConfiguration } from "./handle-cors.js";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { customErrorHandler } from "./error-handler.js";

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

	// Register custom error handler
	fastify.setErrorHandler(customErrorHandler);

	server.register(cors, corsConfiguration);

	server.register(fastifySwagger, swaggerOptions);
	// Set rate limit
	server.register(import("@fastify/rate-limit"), {
		max: 30,
		timeWindow: "1 minute",
	});
	server.register(fastifySwaggerUi, documentationRouteOptions);
	server.register(rootRoute);
	server.register(healthRoute, { prefix: "/health" });
	// FIXME: We register at /processed_documents and add one handler for /count. Why?
	server.register(countDocumentsRoute, {
		prefix: "/processed_documents",
	});
	server.register(feedbackRoute, { prefix: "/feedbacks" });
	server.register(searchDocumentsRoute, {
		prefix: "/vector-search",
		OPENAI_KEY,
		OPENAI_EMBEDDING_MODEL,
		OPENAI_MODEL,
	});
	server.register(generateAnswerRoute, {
		prefix: "/generate-answer",
		OPENAI_MODEL,
		OPENAI_KEY,
	});
	server.register(loadUserRequestRoute, { prefix: "/requests" });

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
