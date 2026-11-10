-- Per-request stats of the chat completion stream, to find out where the waiting time goes
-- (reasoning vs. provider latency) and whether the configured reasoning effort is sent.
-- Timings in ms from the start of the completion request; NULL for older requests.
ALTER TABLE public.user_requests ADD COLUMN IF NOT EXISTS llm_reasoning_effort text;
ALTER TABLE public.user_requests ADD COLUMN IF NOT EXISTS chat_completion_first_chunk_ms integer;
ALTER TABLE public.user_requests ADD COLUMN IF NOT EXISTS chat_completion_first_thinking_ms integer;
ALTER TABLE public.user_requests ADD COLUMN IF NOT EXISTS chat_completion_first_text_ms integer;
ALTER TABLE public.user_requests ADD COLUMN IF NOT EXISTS chat_completion_thinking_chars integer;
ALTER TABLE public.user_requests ADD COLUMN IF NOT EXISTS chat_completion_input_tokens integer;
ALTER TABLE public.user_requests ADD COLUMN IF NOT EXISTS chat_completion_output_tokens integer;
ALTER TABLE public.user_requests ADD COLUMN IF NOT EXISTS chat_completion_reasoning_tokens integer;
