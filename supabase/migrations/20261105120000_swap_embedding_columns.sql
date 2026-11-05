-- Swap the regenerated 1024-dimension embeddings (*_temp) with the current 1536-dimension ones.
-- Guarded by the dimensions, so a re-run does not swap back.
-- The old embeddings stay in the *_temp columns as a fallback until they are no longer needed.
-- SET NOT NULL fails (and rolls back everything) if the regeneration left any row empty.
DO $$
BEGIN
  IF (
    SELECT atttypmod FROM pg_attribute
    WHERE attrelid = 'public.processed_document_chunks'::regclass AND attname = 'embedding'
  ) = 1536 AND (
    SELECT atttypmod FROM pg_attribute
    WHERE attrelid = 'public.processed_document_chunks'::regclass AND attname = 'embedding_temp'
  ) = 1024 THEN
    ALTER TABLE public.processed_document_chunks RENAME COLUMN embedding TO embedding_old;
    ALTER TABLE public.processed_document_chunks RENAME COLUMN embedding_temp TO embedding;
    ALTER TABLE public.processed_document_chunks RENAME COLUMN embedding_old TO embedding_temp;
    ALTER TABLE public.processed_document_chunks ALTER COLUMN embedding_temp DROP NOT NULL;
    ALTER TABLE public.processed_document_chunks ALTER COLUMN embedding SET NOT NULL;
  END IF;

  IF (
    SELECT atttypmod FROM pg_attribute
    WHERE attrelid = 'public.processed_document_summaries'::regclass AND attname = 'summary_embedding'
  ) = 1536 AND (
    SELECT atttypmod FROM pg_attribute
    WHERE attrelid = 'public.processed_document_summaries'::regclass AND attname = 'summary_embedding_temp'
  ) = 1024 THEN
    ALTER TABLE public.processed_document_summaries RENAME COLUMN summary_embedding TO summary_embedding_old;
    ALTER TABLE public.processed_document_summaries RENAME COLUMN summary_embedding_temp TO summary_embedding;
    ALTER TABLE public.processed_document_summaries RENAME COLUMN summary_embedding_old TO summary_embedding_temp;
    ALTER TABLE public.processed_document_summaries ALTER COLUMN summary_embedding_temp DROP NOT NULL;
    ALTER TABLE public.processed_document_summaries ALTER COLUMN summary_embedding SET NOT NULL;
  END IF;
END;
$$;

-- The ivfflat indices moved with the renamed columns; rebuild them on the new columns.
-- The index functions use vector_ip_ops unqualified, so the extensions schema must be on the search_path.
-- Plain SET (not SET LOCAL) also works if the migration runner does not wrap the file in a transaction.
SET search_path = public, extensions;
SELECT public.regenerate_embedding_indices_for_chunks();
SELECT public.regenerate_embedding_indices_for_summaries();
