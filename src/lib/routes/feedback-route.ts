import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { supabase } from "../supabase.js";
import { DatabaseError, UserError } from "../errors.js";

export function feedbackRoute(
	app: FastifyInstance,
	_options: FastifyPluginOptions,
	next: (err?: Error | undefined) => void,
) {
	app.route<{
		Querystring: { id?: number };
	}>({
		url: "/",
		schema: {
			querystring: {
				type: "object",
				properties: {
					id: { type: "number" },
				},
				required: [],
			},
		},
		method: ["GET"],
		handler: async (request, reply) => {
			switch (request.method) {
				case "GET":
					{
						const { id } = request.query;
						const supabaseRequest = supabase.from("feedbacks").select("*");
						if (id) {
							supabaseRequest.eq("id", id);
						}
						const { data, error } = await supabaseRequest;
						if (error) {
							throw new DatabaseError("Error fetching feedback from supabase");
						}
						if (!data) {
							throw new DatabaseError("No feedback found");
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
		Body: { feedback_id: number; user_request_id: string; session_id: string };
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
					const { feedback_id, user_request_id, session_id } = request.body;

					const { data: requestData, error: requestError } = await supabase
						.from("user_requests")
						.select("*")
						.eq("short_id", user_request_id);

					if (requestError || requestData.length === 0) {
						throw new DatabaseError("No user request found");
					}

					const { data: feedbackData, error: feedbackError } = await supabase
						.from("feedbacks")
						.select("*")
						.eq("id", feedback_id);

					if (feedbackError || feedbackData.length === 0) {
						throw new DatabaseError("No feedback found");
					}

					const { data: selectData, error: selectError } = await supabase
						.from("user_request_feedbacks")
						.select("*")
						.eq("session_id", session_id);

					if (selectError) {
						throw new DatabaseError("Error finding feedback for session_id");
					}

					if (selectData?.length === 0) {
						const { data: insertData, error: insertError } = await supabase
							.from("user_request_feedbacks")
							.insert({
								feedback_id,
								user_request_id: requestData[0].id,
								session_id,
							})
							.select("*");

						if (insertError) {
							throw new DatabaseError("Error inserting feedback");
						}

						reply.status(201).send(insertData);
					} else {
						const { data: updateData, error: updateError } = await supabase
							.from("user_request_feedbacks")
							.update({
								feedback_id,
								user_request_id: requestData[0].id,
								session_id,
							})
							.eq("session_id", session_id)
							.select("*");

						if (updateError) {
							throw new DatabaseError("Error updating feedback");
						}

						reply.status(201).send(updateData);
					}

					break;
				}
				default:
					throw new UserError("Method not allowed");
			}
		},
	});
	next();
}
