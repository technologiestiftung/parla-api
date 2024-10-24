alter table processed_document_summaries add column summary_llama_parse text;
alter table processed_document_summaries add column summary_embedding_llama_parse vector(1536);

alter table processed_document_chunks add column content_llama_parse text;
alter table processed_document_chunks add column embedding_llama_parse vector(1536);