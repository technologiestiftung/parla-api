![](https://img.shields.io/badge/Built%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiestiftung%20Berlin-blue)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

# _Parla (api & database)_

This is a the api and database for the explorational project _Parla_. This is not production ready. Currently we explore if we can make the parliamentary documentation provided by the "The Abgeordnetenhaus" of Berlin as open data https://www.parlament-berlin.de/dokumente/open-data more accessible by embedding all the data and do search it using vector similarity search. The project is heavily based on [this example](https://github.com/supabase-community/nextjs-openai-doc-search) from the supabase community. Built with [Fastify](https://fastify.dev/) and deployed to [render.com](https://render.com) using [docker](https://www.docker.com/).

## Prerequisites

- docker
- vercel.com account
- supabase.com account
- running instance of the related frontend https://github.com/technologiestiftung/parla-frontend
- running instance of the database, defined in [./supabase](./supabase)
- populated database. Using these tools https://github.com/technologiestiftung/parla-document-processor

## Needed Environment Variables

See also `.envrc.sample`. (Might be more up to date).

```plain
export SUPABASE_URL=
export SUPABASE_ANON_KEY=
export OPENAI_KEY=
export SUPABASE_SERVICE_ROLE_KEY=
export OPENAI_MODEL=
export PORT=
export OPENAI_EMBEDDING_MODEL=
```

Hint. We use `direnv` for development environment variables. See https://direnv.net/

## Installation

```bash
npm ci
```

## Deployment

Currently we deploy using docker on render.com.

- Go to render.com
- allow render to access your github repository
- create a new web service (type should be docker)
- populate the environment variables
- deploy

## Development

Startup a local database:

```bash
npx supabase start
```

Run the API:

```bash
npm run dev
```

Edit the files in `src`

See also the swagger documentation at http://localhost:8080/documentation/static/index.html

## Periodically regenerate indices

The indices on the `processed_document_chunks` and `processed_document_summaries` tables need be regenerated upon arrival of new data.
This is because the `lists` parameter should be changed accordingly to https://github.com/pgvector/pgvector. To do this, we use the `pg_cron` extension available: https://github.com/citusdata/pg_cron. To schedule the regeneration of indices, we create two jobs which use functions defined in the API and database definition: https://github.com/technologiestiftung/parla-api.

```
select cron.schedule (
    'regenerate_embedding_indices_for_chunks',
    '30 5 * * *',
    $$ SELECT * from regenerate_embedding_indices_for_chunks() $$
);

select cron.schedule (
    'regenerate_embedding_indices_for_summaries',
    '30 5 * * *',
    $$ SELECT * from regenerate_embedding_indices_for_summaries() $$
);
```

## Tests

```bash
npm t
```

## Contributing

Before you create a pull request, write an issue so we can discuss your changes.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://fabianmoronzirfas.me"><img src="https://avatars.githubusercontent.com/u/315106?v=4?s=64" width="64px;" alt="Fabian Morón Zirfas"/><br /><sub><b>Fabian Morón Zirfas</b></sub></a><br /><a href="https://github.com/technologiestiftung/parla-api/commits?author=ff6347" title="Code">💻</a> <a href="#infra-ff6347" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#design-ff6347" title="Design">🎨</a> <a href="https://github.com/technologiestiftung/parla-api/commits?author=ff6347" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Jaszkowic"><img src="https://avatars.githubusercontent.com/u/10830180?v=4?s=64" width="64px;" alt="Jonas Jaszkowic"/><br /><sub><b>Jonas Jaszkowic</b></sub></a><br /><a href="https://github.com/technologiestiftung/parla-api/commits?author=Jaszkowic" title="Code">💻</a> <a href="#ideas-Jaszkowic" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/technologiestiftung/parla-api/commits?author=Jaszkowic" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.awsm.de"><img src="https://avatars.githubusercontent.com/u/434355?v=4?s=64" width="64px;" alt="Ingo Hinterding"/><br /><sub><b>Ingo Hinterding</b></sub></a><br /><a href="#projectManagement-Esshahn" title="Project Management">📆</a> <a href="https://github.com/technologiestiftung/parla-api/commits?author=Esshahn" title="Code">💻</a> <a href="#ideas-Esshahn" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Credits

<table>
  <tr>
    <td>
      Made by <a href="https://citylab-berlin.org/de/start/">
        <br />
        <br />
        <img width="200" src="https://logos.citylab-berlin.org/logo-citylab-berlin.svg" />
      </a>
    </td>
    <td>
      A project by <a href="https://www.technologiestiftung-berlin.de/">
        <br />
        <br />
        <img width="150" src="https://logos.citylab-berlin.org/logo-technologiestiftung-berlin-de.svg" />
      </a>
    </td>
    <td>
      Supported by <a href="https://www.berlin.de/rbmskzl/">
        <br />
        <br />
        <img width="80" src="https://logos.citylab-berlin.org/logo-berlin-senatskanzelei-de.svg" />
      </a>
    </td>
  </tr>
</table>

## Related Projects

- https://github.com/technologiestiftung/parla-frontend
- https://github.com/technologiestiftung/parla-document-processor
- https://github.com/technologiestiftung/oeffentliches-gestalten-gpt-search
- https://github.com/supabase-community/nextjs-openai-doc-search
