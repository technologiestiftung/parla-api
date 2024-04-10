create  extension if not exists "pg_hashids";

alter table user_requests add COLUMN short_id text default null;

create sequence user_requests_id_seq start 1;

alter table user_requests add column numeric_id bigint default nextval('user_requests_id_seq');

update user_requests set short_id = id_encode(numeric_id) where short_id is null;

alter table user_requests drop constraint user_requests_pkey;

alter table user_requests add constraint user_requests_pkey UNIQUE (numeric_id);

alter table user_requests drop column id;

alter table user_requests rename column numeric_id to id;

CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.short_id := id_encode(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_on_insert_user_requests
   BEFORE INSERT ON user_requests
   FOR EACH ROW
   EXECUTE FUNCTION generate_short_id();