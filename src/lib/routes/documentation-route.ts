import { FastifyInstance } from "fastify";
import fastifySwaggerUi from "@fastify/swagger-ui";

export async function registerDocumentationRoute(fastify: FastifyInstance) {
	await fastify.register(fastifySwaggerUi, {
		routePrefix: "/documentation",
		initOAuth: {},
		uiConfig: {
			docExpansion: "full",
			deepLinking: false,
		},
		uiHooks: {
			onRequest: function (request, reply, next) {
				next();
			},
			preHandler: function (request, reply, next) {
				next();
			},
		},
		staticCSP: true,
		transformStaticCSP: (header) => header,
	});
}
