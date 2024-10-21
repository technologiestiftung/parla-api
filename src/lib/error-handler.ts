import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import {
	ApplicationError,
	EnvError,
	OpenAIError,
	UserError,
} from "./errors.js";
import { supabase } from "./supabase.js";

/**
 * Custom Error Handler
 * Currently handles OpenAIErrors for us
 */
export async function customErrorHandler(
	error: FastifyError,
	_: FastifyRequest,
	reply: FastifyReply,
) {
	if (error instanceof OpenAIError) {
		// test if the statusText is parseable as JSON
		let statusText;
		try {
			statusText = JSON.parse(error.data.statusText);
		} catch {
			statusText = error.data.statusText;
		}

		// Try to update the error in the database, if the user request exists already
		if (error.data.userRequestId) {
			const { error: updateError } = await supabase
				.from("user_requests")
				.update({
					error: statusText,
				})
				.eq("short_id", error.data.userRequestId)
				.select("*");
			if (updateError) {
				reply.status(500).send({
					endpoint: error.data.endpoint,
					statusText: "Could not save error to database",
				});
				return;
			}
		}

		reply.status(error.data.status).send({
			endpoint: error.data.endpoint,
			statusText,
		});
	} else if (error instanceof EnvError) {
		reply.status(500).send({ message: "Env variable is not defined" });
	} else if (error instanceof ApplicationError) {
		reply.status(500).send({ message: error.message, data: error.data });
	} else if (error instanceof UserError) {
		reply.status(400).send({ message: error.message, data: error.data });
	} else {
		reply.status(500).send(error);
	}
}
