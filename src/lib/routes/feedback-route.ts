import { FastifyInstance } from "fastify";
import { supabase } from "../supabase.js";
import { UserError } from "../errors.js";

export function feedbackRoute(
	app: FastifyInstance,
	_options: unknown,
	next: (err?: Error | undefined) => void,
) {
	// app.get("/", (req, res) => {

	app.route<{
		Querystring: { id?: number };
	}>({
		url: "/",
		schema: {
			querystring: { id: { type: "number" } },
		},
		method: ["GET", "HEAD", "OPTIONS"],
		handler: async (request, reply) => {
			switch (request.method) {
				case "HEAD":
					reply.send();
					break;
				case "OPTIONS":
					reply.send();
					break;
				case "GET":
					{
						const { id } = request.query;
						const supabaseRequest = supabase.from("feedbacks").select("*");
						if (id) {
							supabaseRequest.eq("id", id);
						}
						const { data, error } = await supabaseRequest;
						if (error) {
							//TODO: Replace with SupabaseError from PR: https://github.com/technologiestiftung/parla-api/pull/87
							throw new Error("Error fetching feedback from supabase");
						}
						if (!data) {
							throw new Error("No feedback found");
						}
						if (data.length === 0) {
							reply.status(404).send();
						}
						reply.send(data);
					}
					break;
				default:
					throw new UserError("Method not allowed");
			}
		},
	});

	app.route<{
		Body: { feedback_id: number; user_request_id: string };
	}>({
		schema: {
			body: {
				type: "object",
				properties: {
					feedback_id: { type: "number" },
					user_request_id: { type: "string" },
				},
				required: ["feedback_id", "user_request_id"],
			},
		},
		url: "/",
		method: ["POST"],
		handler: async (request, reply) => {
			switch (request.method) {
				case "POST": {
					const { feedback_id, user_request_id } = request.body;

					// 1. look into feedbacks table and check if the feedback_id matches one id
					const { data: feedbackData, error: feedbackError } = await supabase
						.from("feedbacks")
						.select("*")
						.eq("id", feedback_id);

					if (feedbackError) {
						console.error(feedbackData, feedbackError);
						// TODO: replace with SupabaseError from PR: https://github.com/technologiestiftung/parla-api/pull/87
						throw new Error(
							`Error fetching feedback from supabase ${feedbackError.message}`,
						);
					}
					if (!feedbackData || feedbackData.length === 0) {
						// triggering a user error should give a 404 here
						throw new UserError("No feedback found");
					}
					// Now we know that there is a feedback with the feedback_id provided by the user
					// 2. check if there is a entry in the user_requests table with the user_request_id
					const { data: userRequestData, error: userRequestError } =
						await supabase
							.from("user_requests")
							.select("*")
							.eq("short_id", user_request_id);

					if (userRequestError) {
						// TODO: replace with SupabaseError from PR: https://github.com/technologiestiftung/parla-api/pull/87
						throw new Error("Error fetching user request from supabase");
					}
					if (!userRequestData || userRequestData.length === 0) {
						// this should be a 404
						throw new UserError("No user request found");
					}
					// Now we know that there is a user request with the user_request_id provided by the user
					// 3. update the user_request with the feedback_id
					const { data: updateData, error: updateError } = await supabase
						.from("user_requests")
						.update({ feedback_id: feedback_id })
						.eq("short_id", user_request_id)
						.select("*");
					if (updateError) {
						// TODO: replace with SupabaseError from PR: https://github.com/technologiestiftung/parla-api/pull/87
						throw new Error("Error updating user request with feedback id");
					}
					if (!updateData) {
						// TODO: This should be a SupabaseError since we need to select the newly updated column
						throw new Error("No data returned after updating user request");
					}
					reply.status(201).send(updateData);
					break;
				}
				default:
					throw new UserError("Method not allowed");
			}
		},
	});
	next();
}
