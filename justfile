# see https://just.systems/man/en/
set dotenv-load
default:
  @echo "No default target"
  just --list


docker-build:
	docker build \
		--platform linux/amd64 \
		--tag technologiestiftung/parla-api .

docker-run:
	docker run --env SUPABASE_URL="$SUPABASE_URL" \
		--env SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
		--env LLM_API_KEY="$LLM_API_KEY" \
		--env LLM_BASE_URL="$LLM_BASE_URL" \
		--env LLM_CHAT_MODEL="$LLM_CHAT_MODEL" \
		--env LLM_CHAT_REASONING_EFFORT="$LLM_CHAT_REASONING_EFFORT" \
		--env LLM_EMBEDDING_MODEL="$LLM_EMBEDDING_MODEL" \
		 --platform linux/amd64 \
		--interactive \
		--tty \
		--publish 8080:8080 \
		technologiestiftung/parla-api