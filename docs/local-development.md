# Local Development Guide

## Prerequisites

- Node.js installed
- Dependencies installed: `npm install`

## Running a client locally

The build is gated by a `CLIENT_ID` environment variable. Set it to the client's folder name under `config/clients/`.

```bash
CLIENT_ID=portfolio-francisco npm run dev
```

Then open `http://localhost:3000`.

## Available pages

Each page corresponds to a `slug` defined in the client's JSON config. An empty slug (`""`) is the home page.

| Slug | URL |
|------|-----|
| `` (home) | `http://localhost:3000/` |
| `menu` | `http://localhost:3000/menu` |
| `nosotros` | `http://localhost:3000/nosotros` |
| `contacto` | `http://localhost:3000/contacto` |

> Slugs are defined in `config/clients/{clientId}.json` under the `pages` array.

## Switching clients

Stop the dev server and restart with a different `CLIENT_ID`:

```bash
CLIENT_ID=peluqueria-ana npm run dev
```

## Running tests

```bash
npm test          # run all tests once
npm run test:watch  # watch mode
```

## Adding a new client

1. Create `config/clients/{clientId}.json` following the structure of an existing config.
2. Run `CLIENT_ID={clientId} npm run dev` to preview it locally.
3. Run `CLIENT_ID={clientId} npm run build` to verify the static build produces no errors.
