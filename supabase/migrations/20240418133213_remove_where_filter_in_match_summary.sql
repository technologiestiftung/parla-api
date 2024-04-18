CREATE OR REPLACE FUNCTION public.match_summaries(embedding vector, match_threshold double precision, match_count integer, num_probes integer)
 RETURNS TABLE(id integer, processed_document_id integer, summary text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
	# variable_conflict use_variable
BEGIN
	EXECUTE format('SET LOCAL ivfflat.probes = %s', num_probes);
	RETURN query
	SELECT
		processed_document_summaries.id,
		processed_document_summaries.processed_document_id,
		processed_document_summaries.summary,
(processed_document_summaries.summary_embedding <#> embedding) * -1 AS similarity
	FROM
		processed_document_summaries
ORDER BY
	processed_document_summaries.summary_embedding <#> embedding
LIMIT match_count;
END;
$function$
