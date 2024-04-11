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
		reply
			.status(error.data.status)
			.send({
				endpoint: error.data.endpoint,
				statusText: error.data.statusText,
			});
	} else {
		reply.send(error);
	}
}
