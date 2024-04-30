/* eslint-disable consistent-return */
import type { FastifyPluginOptions } from "fastify";
import type { OriginFunction } from "@fastify/cors";

interface CorsPluginConfiguration extends FastifyPluginOptions {
	origin: OriginFunction;
}

const originFunction: OriginFunction = (origin, cb) => {
	if (process.env.DANGEROUSLY_ALLOW_CORS_FOR_ALL_ORIGINS === "FOR_REAL_REAL") {
		return cb(null, true);
	}
	if (
		process.env.NODE_ENV === "test" ||
		process.env.NODE_ENV === "development"
	) {
		return cb(null, true);
	}

	// We have to allow requests without origin (especially for /health requests coming from render.com)
	if (!origin) {
		cb(null, true);
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
			/parla-frontend.*?.vercel.app|ki-anfragen-frontend.*?.vercel.app|ki-anfragen.citylab-berlin.org|parla.citylab-berlin.org|parla.berlin/,
		)
	) {
		//  Request from localhost will pass
		cb(null, true);
		return;
	}
	// Generate an error on other origins, disabling access
	cb(new Error("Not allowed"), false);

	return; // Add this line to return a value at the end of the method
};

export const corsConfiguration: CorsPluginConfiguration = {
	origin: originFunction,
};
