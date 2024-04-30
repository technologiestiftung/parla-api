import { SwaggerOptions } from "@fastify/swagger";
import {
	FastifyPluginOptions,
	FastifyReply,
	FastifyRequest,
	HookHandlerDoneFunction,
} from "fastify";

export const swaggerOptions: SwaggerOptions = {
	mode: "dynamic",
	openapi: {
		info: {
			title: "Parla",
			description: "Swagger docs for paral",
			version: "1",
		},
	},
};

export const documentationRouteOptions: FastifyPluginOptions = {
	routePrefix: "/documentation",
	initOAuth: {},
	uiConfig: {
		docExpansion: "full",
		deepLinking: false,
	},
	uiHooks: {
		onRequest: function (
			request: FastifyRequest,
			reply: FastifyReply,
			next: HookHandlerDoneFunction,
		) {
			next();
		},
		preHandler: function (
			request: FastifyRequest,
			reply: FastifyReply,
			next: HookHandlerDoneFunction,
		) {
			next();
		},
	},
	staticCSP: true,
	transformStaticCSP: (header: string) => header,
};
