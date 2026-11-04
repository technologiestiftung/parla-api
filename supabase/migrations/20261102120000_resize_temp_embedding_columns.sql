-- Prepare the *_temp embedding columns for the new embedding model (mistral-embed, 1024 dimensions).
-- run_regenerate_embeddings.ts fills every empty *_temp column; a later migration swaps them with the main columns.

ALTER TABLE processed_document_chunks
  ADD COLUMN IF NOT EXISTS embedding_temp vector(1024);

ALTER TABLE processed_document_summaries
  ADD COLUMN IF NOT EXISTS summary_embedding_temp vector(1024);

-- Change the dimension only if it differs, so a re-run never wipes already regenerated embeddings.
-- For vector columns atttypmod is the dimension; comparing it avoids schema-qualified type names.
-- Values of the previous model cannot be cast to another dimension and are discarded.
DO $$
BEGIN
  IF (
    SELECT atttypmod
    FROM pg_attribute
    WHERE attrelid = 'public.processed_document_chunks'::regclass
      AND attname = 'embedding_temp'
  ) <> 1024 THEN
    ALTER TABLE processed_document_chunks
      ALTER COLUMN embedding_temp TYPE vector(1024) USING NULL::vector(1024);
  END IF;

  IF (
    SELECT atttypmod
    FROM pg_attribute
    WHERE attrelid = 'public.processed_document_summaries'::regclass
      AND attname = 'summary_embedding_temp'
  ) <> 1024 THEN
    ALTER TABLE processed_document_summaries
      ALTER COLUMN summary_embedding_temp TYPE vector(1024) USING NULL::vector(1024);
  END IF;
END;
$$;
