import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { OpenAIError } from "./errors.js";
import { supabase } from "./supabase.js";

/**
 * Custom Error Handler
 * Currently handles OpenAIErrors for us
 */
export async function customErrorHandler(
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

		// Try to update the error in the database, if the user request exists already
		if (error.data.userRequestId) {
			const { error: updateError } = await supabase
				.from("user_requests")
				.update({
					error: statusText,
				})
				.eq("short_id", error.data.userRequestId)
				.select("*");
			console.log(updateError);
		}

		reply.status(error.data.status).send({
			endpoint: error.data.endpoint,
			statusText,
		});
	} else {
		reply.status(500).send(error);
	}
}
