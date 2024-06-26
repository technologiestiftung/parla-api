CREATE TYPE "public"."feedback_type" AS enum(
	'positive',
	'negative'
);

CREATE TABLE "public"."feedbacks"(
	"id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
	"tag" text,
	"kind" feedback_type NOT NULL
);

CREATE UNIQUE INDEX feedbacks_pkey ON public.feedbacks USING btree(id);

ALTER TABLE "public"."feedbacks"
	ADD CONSTRAINT "feedbacks_pkey" PRIMARY KEY USING INDEX "feedbacks_pkey";

GRANT DELETE ON TABLE "public"."feedbacks" TO "anon";

GRANT INSERT ON TABLE "public"."feedbacks" TO "anon";

GRANT REFERENCES ON TABLE "public"."feedbacks" TO "anon";

GRANT SELECT ON TABLE "public"."feedbacks" TO "anon";

GRANT TRIGGER ON TABLE "public"."feedbacks" TO "anon";

GRANT TRUNCATE ON TABLE "public"."feedbacks" TO "anon";

GRANT UPDATE ON TABLE "public"."feedbacks" TO "anon";

GRANT DELETE ON TABLE "public"."feedbacks" TO "authenticated";

GRANT INSERT ON TABLE "public"."feedbacks" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."feedbacks" TO "authenticated";

GRANT SELECT ON TABLE "public"."feedbacks" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."feedbacks" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."feedbacks" TO "authenticated";

GRANT UPDATE ON TABLE "public"."feedbacks" TO "authenticated";

GRANT DELETE ON TABLE "public"."feedbacks" TO "service_role";

GRANT INSERT ON TABLE "public"."feedbacks" TO "service_role";

GRANT REFERENCES ON TABLE "public"."feedbacks" TO "service_role";

GRANT SELECT ON TABLE "public"."feedbacks" TO "service_role";

GRANT TRIGGER ON TABLE "public"."feedbacks" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."feedbacks" TO "service_role";

GRANT UPDATE ON TABLE "public"."feedbacks" TO "service_role";

