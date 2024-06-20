CREATE OR REPLACE FUNCTION public.match_document_chunks(embedding vector, match_threshold double precision, match_count integer, num_probes integer)
 RETURNS TABLE(id integer, processed_document_id integer, content text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
	# variable_conflict use_variable
BEGIN
	EXECUTE format('SET LOCAL ivfflat.probes = %s', num_probes);
	RETURN query
	SELECT
		processed_document_chunks.id,
		processed_document_chunks.processed_document_id,
		processed_document_chunks.content,
(processed_document_chunks.embedding <#> embedding) * -1 AS similarity
	FROM
		processed_document_chunks
ORDER BY
	processed_document_chunks.embedding <#> embedding
LIMIT match_count;
END;
$function$