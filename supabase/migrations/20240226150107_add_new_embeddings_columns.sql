alter table processed_document_chunks add embedding_temp vector(1536);
alter table processed_document_summaries add summary_embedding_temp vector(1536);
