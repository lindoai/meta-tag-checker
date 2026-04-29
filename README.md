# Meta Tag Checker

Audit page titles, descriptions, canonicals, Open Graph tags, and Twitter tags.

## Deploy to Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lindoai/meta-tag-checker)

## Features

- title and meta description checks
- canonical URL detection
- Open Graph field extraction
- Twitter card field extraction
- issue list for missing or weak metadata

## Local development

```bash
npm install
npm run dev
npm run typecheck
```

## Deploy

```bash
npm run deploy
```

## Production env

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## API

### GET `/api/check?url=https://example.com`

Returns JSON metadata and issues.
