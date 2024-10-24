alter table user_requests add column total_context_token_size integer;
alter table user_requests add column summary_ids_in_context integer[];
alter table user_requests add column chunk_ids_in_context integer[];
