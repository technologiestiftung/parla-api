CREATE OR REPLACE FUNCTION public.find_registered_documents_for_reprocessing()
 RETURNS TABLE(id integer, source_url text, source_type text, registered_at timestamptz, metadata jsonb)
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
$function$
