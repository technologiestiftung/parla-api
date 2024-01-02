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
		--env OPENAI_MODEL="$OPENAI_MODEL" \
		--env OPENAI_KEY="$OPENAI_KEY" \
		 --platform linux/amd64 \
		--interactive \
		--tty \
		--publish 8080:8080 \
		technologiestiftung/parla-api