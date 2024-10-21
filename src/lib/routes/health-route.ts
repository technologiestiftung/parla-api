import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { healthSchema } from "../json-schemas.js";

export function healthRoute(
	app: FastifyInstance,
	_: FastifyPluginOptions,
	next: (err?: Error | undefined) => void,
) {
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
}
