![](https://img.shields.io/badge/Built%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiestiftung%20Berlin-blue)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

# _>ki.anfragen (api)_

This is a the api for the explorational project _>ki.anfragen_. This is not production ready. Currently we explore if we can make the parliamentary documentation provided by the "The Abgeordnetenhaus" of Berlin as open data https://www.parlament-berlin.de/dokumente/open-data more accessible by embedding all the data and do search it using vector similarity search. The project is heavily based on [this example](https://github.com/supabase-community/nextjs-openai-doc-search) from the supabase community. Built with [Fastify](https://fastify.dev/) and deployed to [render.com](https://render.com) using [docker](https://www.docker.com/).

## Prerequisites

- docker
- vercel.com account
- supabase.com account
- running instance of the related frontend https://github.com/technologiestiftung/ki-anfragen-frontend
- running supabase project. Source can be found here https://github.com/technologiestiftung/ki-anfragen-supabase
- Populated database. Using these tools https://github.com/technologiestiftung/ki-anfragen-data-extractor

## Needed Environment Variables

See also `.envrc.sample`. (Might be more up to date).

```plain
SUPABASE_URL="http://localhost:54321"
SUPABASE_SERVICE_ROLE_KEY="ey..."
# Get your key at https://platform.openai.com/account/api-keys
OPENAI_KEY="sk-UY..."
# in dev we can use a lesser version to save some coins
# OPENAI_MODEL="gpt-3.5-turbo-16k"
# OPENAI_MODEL=gpt-4
OPENAI_MODEL=gpt-3.5-turbo
PORT="8080"
NODE_ENV="development"
LOG_LEVEL="info"
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

```bash
npm run dev
```

Edit the files in `src`

See also the swagger documentation at http://localhost:8080/documentation/static/index.html

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
      <td align="center" valign="top" width="14.28%"><a href="https://fabianmoronzirfas.me"><img src="https://avatars.githubusercontent.com/u/315106?v=4?s=64" width="64px;" alt="Fabian Morón Zirfas"/><br /><sub><b>Fabian Morón Zirfas</b></sub></a><br /><a href="https://github.com/technologiestiftung/ki-anfragen-api/commits?author=ff6347" title="Code">💻</a> <a href="#infra-ff6347" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#design-ff6347" title="Design">🎨</a> <a href="https://github.com/technologiestiftung/ki-anfragen-api/commits?author=ff6347" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Jaszkowic"><img src="https://avatars.githubusercontent.com/u/10830180?v=4?s=64" width="64px;" alt="Jonas Jaszkowic"/><br /><sub><b>Jonas Jaszkowic</b></sub></a><br /><a href="https://github.com/technologiestiftung/ki-anfragen-api/commits?author=Jaszkowic" title="Code">💻</a></td>
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

- https://github.com/technologiestiftung/ki-anfragen-frontend
- https://github.com/technologiestiftung/ki-anfragen-data-extractor
- https://github.com/technologiestiftung/ki-anfragen-supabase
- https://github.com/technologiestiftung/oeffentliches-gestalten-gpt-search
- https://github.com/supabase-community/nextjs-openai-doc-search
