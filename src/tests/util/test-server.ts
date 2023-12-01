import { buildServer } from "../../lib/build-server.js";

const server = await buildServer({
	OPENAI_MODEL: "gpt-3.5-turbo",
	OPENAI_KEY: "",
});

export { server };
