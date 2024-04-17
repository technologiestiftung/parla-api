// ESM
import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastify from "fastify";
import { Model } from "./common.js";
import { customErrorHandler } from "./error-handler.js";
import { corsConfiguration } from "./handle-cors.js";
import { countDocumentsRoute } from "./routes/count-documents-route.js";
import {
	documentationRouteOptions,
	swaggerOptions,
} from "./routes/documentation-route.js";
import { feedbackRoute } from "./routes/feedback-route.js";
import { generateAnswerRoute } from "./routes/generate-answer-route.js";
import { healthRoute } from "./routes/health-route.js";
import { loadUserRequestRoute } from "./routes/load-user-request-route.js";
import { rootRoute } from "./routes/root-route.js";
import { searchDocumentsRoute } from "./routes/search-documents-route.js";

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
	server.setErrorHandler(customErrorHandler);

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
	return server;
}

// Run the server!
