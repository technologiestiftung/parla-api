// needs fasitfy
// https://fastify.dev/docs/latest/Guides/Getting-Started
import { buildServer } from "./build-server.js";

const PORT = parseInt(process.env.PORT ?? "3000");

const server = buildServer();
server.listen({ port: PORT }, function (err, address) {
	if (err) {
		server.log.error(err);
		process.exit(1);
	}
	// Server is now listening on ${address}
});
