-- Security fix: replace enumerable predictable hashids short_ids with unguessable random tokens.

-- 1. Helper that returns a random, URL-safe 12-char token.
--    The uuid's 16 random bytes are base64-encoded, trimmed to 12 chars. Marked
--    VOLATILE so it is evaluated fresh per row (not cached), giving each row a distinct id.
CREATE OR REPLACE FUNCTION generate_random_short_id()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT translate(
    left(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), 12),
    '+/', '-_'
  );
$$;

-- 2. Generate new ids via a column default instead of the old trigger. Drop the now-redundant trigger + function.
DROP TRIGGER IF EXISTS trigger_on_insert_user_requests ON user_requests;
DROP FUNCTION IF EXISTS generate_short_id();
ALTER TABLE user_requests ALTER COLUMN short_id SET DEFAULT generate_random_short_id();

-- 3. Rotate every existing short_id so historical rows are no longer enumerable.
UPDATE user_requests
SET short_id = generate_random_short_id()
WHERE short_id IS NULL OR short_id !~ '^[A-Za-z0-9_-]{12}$';

-- 4. Enforce presence and uniqueness of short_id at the database level.
ALTER TABLE user_requests ALTER COLUMN short_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_requests_short_id_key ON user_requests (short_id);

-- 5. Drop pg_hashids.
DROP EXTENSION IF EXISTS pg_hashids;
