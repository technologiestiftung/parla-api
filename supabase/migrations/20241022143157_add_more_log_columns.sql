alter table user_requests add column total_context_token_size integer;
alter table user_requests add column number_of_summaries_in_context integer;
alter table user_requests add column number_of_chunks_in_context integer;
