import { buildServer } from "../../lib/build-server.js";

async function buildTestServer() {
	const server = await buildServer({
		OPENAI_MODEL: "gpt-3.5-turbo",
		OPENAI_KEY: "",
		OPENAI_EMBEDDING_MODEL: 'text-embedding-3-small'
	});
	return server;
}
export { buildTestServer };
