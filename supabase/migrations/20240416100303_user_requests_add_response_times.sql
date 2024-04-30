alter table user_requests add column moderation_time_ms integer;
alter table user_requests add column embedding_time_ms integer;
alter table user_requests add column database_search_time_ms integer;
alter table user_requests add column chat_completion_time_ms integer;