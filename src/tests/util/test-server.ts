import { buildServer } from "../../lib/build-server.js";
import { testParlaConfig } from "./fixtures.js";

async function buildTestServer() {
	const server = await buildServer(testParlaConfig);
	return server;
}
export { buildTestServer };
