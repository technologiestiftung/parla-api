import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";

export async function registerCors(app: FastifyInstance) {
	await app.register(cors, {
		origin: (origin, cb) => {
			if (
				process.env.DANGEROUSLY_ALLOW_CORS_FOR_ALL_ORIGINS === "FOR_REAL_REAL"
			) {
				app.log.warn("DANGEROUSLY_ALLOW_CORS_FOR_ALL_ORIGINS");
				return cb(null, true);
			}
			if (
				process.env.NODE_ENV === "test" ||
				process.env.NODE_ENV === "development"
			) {
				return cb(null, true);
			}
			if (!origin) {
				app.log.warn("No origin in request");
				cb(new Error("Not allowed"), false);
				return;
			}
			const hostname = new URL(origin as string).hostname;
			if (
				(hostname.includes("localhost") || hostname.includes("127.0.0.1")) &&
				process.env.NODE_ENV === "development"
			) {
				//  Request from localhost will pass if node_env is development
				cb(null, true);
				return;
			}
			// match hosstname based on regex
			if (
				hostname.match(
					/cors-requester.vercel.app|parla-frontend.*?.vercel.app|ki-anfragen-frontend.*?.vercel.app|ki-anfragen.citylab-berlin.org|parla.citylab-berlin.org/,
				)
			) {
				//  Request from localhost will pass
				cb(null, true);
				return;
			}
			// Generate an error on other origins, disabling access
			cb(new Error("Not allowed"), false);
		},
	});
}
