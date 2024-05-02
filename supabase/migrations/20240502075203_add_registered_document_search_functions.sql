
/*
Function: find_registered_documents_with_errors

Description:
This function returns a table of registered documents that have errors during processing.
It performs a full outer join between the 'registered_documents' and 'processed_documents' tables, filtering the results based on the following conditions:
- The 'registered_document_id' is not null
- The 'processing_finished_at' is null or the 'processing_error' is not null or the 'processing_started_at' is null

Parameters:
None

Returns:
Table: The table contains the following columns:
- id: The ID of the registered document
- source_url: The URL of the source document
- source_type: The type of the source document
- registered_at: The timestamp when the document was registered
- metadata: Additional metadata in JSON format

Example Usage:
SELECT * FROM find_registered_documents_with_errors();
*/
CREATE OR REPLACE FUNCTION public.find_registered_documents_with_errors()
 RETURNS TABLE(id integer, source_url text, source_type text, registered_at timestamp without time zone, metadata jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
RETURN query
SELECT registered_documents.* FROM registered_documents FULL OUTER JOIN processed_documents ON registered_documents.id = processed_documents.registered_document_id WHERE registered_document_id IS NOT NULL AND (processed_documents.processing_finished_at IS NULL or processed_documents.processing_error IS NOT NULL or processed_documents.processing_started_at IS NULL);
END;
$function$


/*
Function: find_unprocessed_registered_documents

Description:
This function returns a table of unprocessed registered documents.
It performs a full outer join between the 'registered_documents' and 'processed_documents' tables, and selects the records where the 'registered_document_id' is NULL in the 'processed_documents' table.
The selected columns include 'id', 'source_url', 'source_type', 'registered_at', and 'metadata'.

Returns:
A table with the following columns:
- id (integer): The ID of the registered document.
- source_url (text): The URL of the source document.
- source_type (text): The type of the source document.
- registered_at (timestamp without time zone): The timestamp when the document was registered.
- metadata (jsonb): Additional metadata associated with the document.
*/
CREATE OR REPLACE FUNCTION public.find_unprocessed_registered_documents()
 RETURNS TABLE(id integer, source_url text, source_type text, registered_at timestamp without time zone, metadata jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
RETURN query
SELECT registered_documents.* FROM registered_documents FULL OUTER JOIN processed_documents ON registered_documents.id = processed_documents.registered_document_id WHERE registered_document_id IS NULL;
END;
$function$
