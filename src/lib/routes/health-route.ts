import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { healthSchema } from "../json-schemas.js";

export async function registerHealthRoute(fastify: FastifyInstance) {
	await fastify.register(
		(app, options, next) => {
			app.register(cors, { origin: "*" });

			app.get(
				"/",
				{
					schema: {
						response: healthSchema,
					},
				},
				async (_request, reply) => {
					reply.status(200).send({ message: "OK" });
				},
			);
			next();
		},
		{ prefix: "/health" },
	);
}
