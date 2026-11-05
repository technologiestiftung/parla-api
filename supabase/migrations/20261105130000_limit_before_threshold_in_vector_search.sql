-- Apply the similarity threshold after the LIMIT instead of before it.
--
-- Before, the threshold was a WHERE condition next to ORDER BY ... LIMIT. When fewer than match_count rows pass
-- the threshold (the usual case), the LIMIT is never reached, so every candidate the ivfflat index returns
-- (~12k for chunks) was fetched from the table, including its TOASTed vector, only to be rejected. On a cold
-- cache or a throttled disk this took 15 s and more.
--
-- Now the index returns the match_count nearest rows, and only those are fetched and filtered. The result is
-- identical: the rows are sorted by similarity, so the rows above the threshold are always a prefix of the
-- match_count nearest ones.
--
-- Signatures and return types are unchanged, so CREATE OR REPLACE keeps all callers (API and processor) working.

CREATE OR REPLACE FUNCTION public.match_document_chunks(embedding extensions.vector,match_threshold double precision, match_count integer, num_probes integer)
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
    nearest.id,
    nearest.processed_document_id,
    nearest.content,
    nearest.similarity
  FROM (
    SELECT
      processed_document_chunks.id,
      processed_document_chunks.processed_document_id,
      processed_document_chunks.content,
      (processed_document_chunks.embedding <#> embedding) * -1 AS similarity
    FROM
      processed_document_chunks
    ORDER BY
      processed_document_chunks.embedding <#> embedding
    LIMIT match_count
  ) AS nearest
  WHERE nearest.similarity > match_threshold
  ORDER BY nearest.similarity DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.match_summaries(embedding extensions.vector,match_threshold double precision, match_count integer, num_probes integer)
  RETURNS TABLE(
    id integer,
    processed_document_id integer,
    summary text,
    similarity double precision)
  LANGUAGE plpgsql
AS $function$
  # variable_conflict use_variable
BEGIN
  EXECUTE format('SET LOCAL ivfflat.probes = %s', num_probes);
  RETURN query
  SELECT
    nearest.id,
    nearest.processed_document_id,
    nearest.summary,
    nearest.similarity
  FROM (
    SELECT
      processed_document_summaries.id,
      processed_document_summaries.processed_document_id,
      processed_document_summaries.summary,
      (processed_document_summaries.summary_embedding <#> embedding) * -1 AS similarity
    FROM
      processed_document_summaries
    ORDER BY
      processed_document_summaries.summary_embedding <#> embedding
    LIMIT match_count
  ) AS nearest
  WHERE nearest.similarity > match_threshold
  ORDER BY nearest.similarity DESC;
END;
$function$;
