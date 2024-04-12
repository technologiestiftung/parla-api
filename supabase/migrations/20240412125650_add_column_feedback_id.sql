ALTER TABLE "public"."user_requests"
	ADD COLUMN "feedback_id" integer;

ALTER TABLE "public"."user_requests"
	ADD CONSTRAINT "user_requests_feedback_id_fkey" FOREIGN KEY (feedback_id) REFERENCES feedbacks(id) NOT valid;

ALTER TABLE "public"."user_requests" validate CONSTRAINT "user_requests_feedback_id_fkey";

