import { OpenAIError } from "./errors.js";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

/**
 * Custom Error Handler
 * Currently handles OpenAIErrors for us
 */
export function customErrorHandler(
	error: FastifyError,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	if (error instanceof OpenAIError) {
		// test if the statusText is parseable as JSON
		let statusText;
		try {
			statusText = JSON.parse(error.data.statusText);
		} catch (e) {
			statusText = error.data.statusText;
		}

		reply.status(error.data.status).send({
			endpoint: error.data.endpoint,
			statusText,
		});
	} else {
		reply.send(error);
	}
}
