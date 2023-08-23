// ESM
import Fastify from "fastify";

export function buildServer() {
	const fastify = Fastify({
		logger: true,
	});

	// Declare a route
	fastify.get("/", async (request, reply) => {
		reply.send({ hello: "world" });
	});
	return fastify;
}

// Run the server!
