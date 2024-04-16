import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { countSchema } from "../json-schemas.js";
import { supabase } from "../supabase.js";

export function countDocumentsRoute(
	app: FastifyInstance,
	_options: FastifyPluginOptions,
	next: (err?: Error | undefined) => void,
) {
	app.get(
		"/count",
		{
			schema: {
				response: countSchema,
			},
		},
		async (_request, reply) => {
			const { error, count } = await supabase
				.from("processed_documents")
				.select("*", { count: "exact", head: true });
			if (!error) {
				reply.status(200).send({ processed_documents_count: count });
			} else {
				reply
					.status(500)
					.send({ error: "Could not count processed_documents" });
			}
		},
	);
	next();
}
