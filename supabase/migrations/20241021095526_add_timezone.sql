ALTER TABLE registered_documents ALTER COLUMN registered_at SET DATA TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE processed_documents ALTER COLUMN processing_started_at SET DATA TYPE TIMESTAMP WITH TIME ZONE;
ALTER TABLE processed_documents ALTER COLUMN processing_finished_at SET DATA TYPE TIMESTAMP WITH TIME ZONE;