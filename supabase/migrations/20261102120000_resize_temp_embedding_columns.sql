-- Prepare the *_temp embedding columns for the new embedding model (mistral-embed, 1024 dimensions).
-- run_regenerate_embeddings.ts fills every empty *_temp column; a later migration swaps them with the main columns.
--
-- A column is dropped and re-added (empty) only if it does not have 1024 dimensions yet, so a re-run never wipes
-- already regenerated embeddings. Drop + add only changes the catalog, unlike ALTER COLUMN ... TYPE, which would
-- rewrite the whole table and rebuild all its indexes under an exclusive lock.
-- For vector columns atttypmod is the dimension. IS DISTINCT FROM also covers a missing column (NULL).
-- pgvector is installed in the "extensions" schema, which is not on the search_path of the migration runner,
-- so the type is schema-qualified.
DO $$
BEGIN
  IF (
    SELECT atttypmod
    FROM pg_attribute
    WHERE attrelid = 'public.processed_document_chunks'::regclass
      AND attname = 'embedding_temp'
      AND NOT attisdropped
  ) IS DISTINCT FROM 1024 THEN
    ALTER TABLE public.processed_document_chunks DROP COLUMN IF EXISTS embedding_temp;
    ALTER TABLE public.processed_document_chunks ADD COLUMN embedding_temp extensions.vector(1024);
  END IF;

  IF (
    SELECT atttypmod
    FROM pg_attribute
    WHERE attrelid = 'public.processed_document_summaries'::regclass
      AND attname = 'summary_embedding_temp'
      AND NOT attisdropped
  ) IS DISTINCT FROM 1024 THEN
    ALTER TABLE public.processed_document_summaries DROP COLUMN IF EXISTS summary_embedding_temp;
    ALTER TABLE public.processed_document_summaries ADD COLUMN summary_embedding_temp extensions.vector(1024);
  END IF;
END;
$$;
