CREATE TABLE public.external_sources(
    id int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    source_url text not null,
    title text not null,
    added_at timestamp not null
);