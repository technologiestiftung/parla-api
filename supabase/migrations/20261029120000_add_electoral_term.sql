-- Store the electoral term (Wahlperiode) per document. Backfills existing rows; new rows are written by the importers.

ALTER TABLE registered_documents
  ADD COLUMN IF NOT EXISTS electoral_term smallint;

-- Backfill written questions from PARDOK metadata, skipping non-numeric values
UPDATE registered_documents
SET electoral_term = (metadata -> 'Wp' ->> 0)::smallint
WHERE source_type = 'Schriftliche Anfrage'
  AND electoral_term IS NULL
  AND metadata -> 'Wp' ->> 0 ~ '^\d+$';

-- Backfill red numbers from the source URL
UPDATE registered_documents
SET electoral_term = substring(source_url from '/adosservice/(\d+)/')::smallint
WHERE source_type = 'Hauptausschussprotokoll'
  AND electoral_term IS NULL;

-- Return SETOF registered_documents so the return type follows the table and no longer breaks on new columns
DROP FUNCTION IF EXISTS public.find_unprocessed_registered_documents();

CREATE OR REPLACE FUNCTION public.find_unprocessed_registered_documents()
 RETURNS SETOF registered_documents
 LANGUAGE plpgsql
AS $function$
BEGIN
RETURN query
SELECT registered_documents.* FROM registered_documents FULL OUTER JOIN processed_documents ON registered_documents.id = processed_documents.registered_document_id WHERE registered_document_id IS NULL;
END;
$function$;

DROP FUNCTION IF EXISTS public.find_registered_documents_for_reprocessing();

CREATE OR REPLACE FUNCTION public.find_registered_documents_for_reprocessing()
 RETURNS SETOF registered_documents
 LANGUAGE plpgsql
AS $function$
BEGIN
RETURN query
SELECT rd.*
FROM registered_documents rd
LEFT JOIN processed_documents pd ON pd.registered_document_id = rd.id
LEFT JOIN processed_document_chunks pdc ON pdc.processed_document_id = pd.id
LEFT JOIN processed_document_summaries pds ON pds.processed_document_id = pd.id
WHERE
    (pdc.embedding_temp IS NULL OR pdc.content_temp IS NULL)
    OR (pds.summary_embedding_temp IS NULL OR pds.summary_temp IS NULL OR pds.tags_temp IS NULL)
GROUP BY rd.id;
END;
$function$;

DROP FUNCTION IF EXISTS public.find_registered_documents_with_errors();

CREATE OR REPLACE FUNCTION public.find_registered_documents_with_errors()
 RETURNS SETOF registered_documents
 LANGUAGE plpgsql
AS $function$
BEGIN
RETURN query
SELECT registered_documents.* FROM registered_documents FULL OUTER JOIN processed_documents ON registered_documents.id = processed_documents.registered_document_id WHERE registered_document_id IS NOT NULL AND (processed_documents.processing_finished_at IS NULL or processed_documents.processing_error IS NOT NULL or processed_documents.processing_started_at IS NULL);
END;
$function$;
