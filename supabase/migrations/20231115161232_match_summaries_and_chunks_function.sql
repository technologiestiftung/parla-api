SET check_function_bodies = OFF;

DROP FUNCTION IF EXISTS public.match_summaries_and_chunks(embedding vector, match_threshold double precision, chunk_limit integer, summary_limit integer, num_probes integer);

CREATE OR REPLACE FUNCTION public.match_summaries_and_chunks(embedding vector, match_threshold double precision, chunk_limit integer, summary_limit integer, num_probes integer)
	RETURNS TABLE(
		processed_document_id integer,
		chunk_ids integer[],
		chunk_similarities double precision[],
		avg_chunk_similarity double precision,
		summary_ids integer[],
		summary_similarity double precision,
		similarity double precision)
	LANGUAGE plpgsql
	AS $function$
	# variable_conflict use_variable
BEGIN
	RETURN query WITH chunk_winners AS(
		SELECT
			cw.id AS chunk_id,
			NULL AS summary_id,
			cw.processed_document_id,
			cw.similarity
		FROM
			match_document_chunks(embedding, match_threshold, chunk_limit, 0, num_probes) AS cw
),
summary_winners AS(
	SELECT
		NULL AS chunk_id,
		sw.id AS summary_id,
		sw.processed_document_id,
		sw.similarity
	FROM
		match_summaries(embedding, match_threshold, summary_limit, 0, num_probes) AS sw
),
all_winners AS(
	SELECT
		chunk_winners.chunk_id,
		NULL AS summary_id,
		chunk_winners.processed_document_id,
		chunk_winners.similarity
	FROM
		chunk_winners
	UNION ALL
	SELECT
		NULL AS chunk_id,
		summary_winners.summary_id,
		summary_winners.processed_document_id,
		summary_winners.similarity
	FROM
		summary_winners
)
SELECT
	winners.processed_document_id,
	ARRAY_AGG(winners.chunk_id) FILTER(WHERE winners.chunk_id IS NOT NULL) AS chunk_ids,
	ARRAY_AGG(winners.similarity) FILTER(WHERE winners.chunk_id IS NOT NULL) AS chunk_similarities,
	AVG(winners.similarity) FILTER(WHERE winners.chunk_id IS NOT NULL) AS avg_chunk_similarity,
	ARRAY_AGG(winners.summary_id) FILTER(WHERE winners.summary_id IS NOT NULL) AS summary_ids,
	AVG(winners.similarity) FILTER(WHERE winners.summary_id IS NOT NULL) AS summary_similarity,
	CASE WHEN ARRAY_LENGTH(ARRAY_AGG(winners.chunk_id) FILTER(WHERE winners.chunk_id IS NOT NULL), 1) IS NULL THEN
		coalesce(AVG(winners.similarity) FILTER(WHERE winners.summary_id IS NOT NULL), 0)
	WHEN ARRAY_LENGTH(ARRAY_AGG(winners.summary_id) FILTER(WHERE winners.summary_id IS NOT NULL), 1) IS NULL THEN
		coalesce(AVG(winners.similarity) FILTER(WHERE winners.chunk_id IS NOT NULL), 0)
	ELSE
(coalesce(AVG(winners.similarity) FILTER(WHERE winners.chunk_id IS NOT NULL), 0) + coalesce(AVG(winners.similarity) FILTER(WHERE winners.summary_id IS NOT NULL), 0)) / 2.0
	END similarity
FROM
	all_winners AS winners
GROUP BY
	winners.processed_document_id
ORDER BY
	similarity DESC;
END;
$function$
