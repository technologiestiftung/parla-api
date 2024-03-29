-- pgFormatter-ignore
SET check_function_bodies = OFF;

DROP FUNCTION IF EXISTS public.match_summaries(embedding vector, match_threshold double precision, match_count integer, min_content_length integer, num_probes integer);

CREATE OR REPLACE FUNCTION public.match_summaries(embedding vector, match_threshold double precision, match_count integer, min_content_length integer, num_probes integer)
	RETURNS TABLE(
		id integer,
		processed_document_id integer,
		content text,
		similarity double precision)
	LANGUAGE plpgsql
	AS $function$
	# variable_conflict use_variable
BEGIN
	EXECUTE format('SET LOCAL ivfflat.probes = %s', num_probes);
	RETURN query
	SELECT
		processed_document_summaries.id,
		processed_document_summaries.processed_document_id,
		processed_document_summaries.content,
(processed_document_summaries.embedding <#> embedding) * -1 AS similarity
	FROM
		processed_document_summaries
		-- We only care about sections that have a useful amount of content
	WHERE
		length(processed_document_summaries.content) >= min_content_length
		-- The dot product is negative because of a Postgres limitation, so we negate it
		AND(processed_document_summaries.embedding <#> embedding) * -1 > match_threshold
		-- OpenAI embeddings are normalized to length 1, so
		-- cosine similarity and dot product will produce the same results.
		-- Using dot product which can be computed slightly faster.
		--
		-- For the different syntaxes, see https://github.com/pgvector/pgvector
	ORDER BY
		processed_document_summaries.embedding <#> embedding
	LIMIT match_count;
END;
$function$;

