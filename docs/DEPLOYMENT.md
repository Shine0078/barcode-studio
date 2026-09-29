# Deployment

The app is a static bundle (`dist/`) and is currently deployed to **Cloudflare
Pages**.

- Production: <https://barcode-studio-25b.pages.dev/>
- Every deploy also gets an immutable preview URL:
  `https://<hash>.barcode-studio-25b.pages.dev`

## Cloudflare Pages (CLI)

`wrangler.jsonc` declares the project and the output directory:

```jsonc
{
  "name": "barcode-studio",
  "pages_build_output_dir": "./dist",
  "compatibility_date": "2026-09-29"
}
```

```bash
npx wrangler login            # one-time OAuth in the browser
npm run deploy                # build + publish (production branch: main)
npm run deploy:preview        # build + publish to the preview branch
```

The first deploy creates the project if needed:

```bash
npx wrangler pages project create barcode-studio --production-branch=main
```

## Response headers

`public/_headers` is copied into the build and applied by Pages:

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

Hashed asset filenames make the immutable cache safe; `index.html` is left
uncached so new deploys are picked up immediately.

## Git-connected Pages (alternative)

For automatic deployments on push:

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Select the repository.
3. Build command `npm run build`, build output `dist`.
4. Every push to `main` then deploys automatically; pull requests get preview
   URLs.

## GitHub Actions (alternative)

A minimal workflow that builds and tests on every push:

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

Add `wrangler pages deploy dist --project-name=barcode-studio` at the end with a
`CLOUDFLARE_API_TOKEN` secret to deploy from Actions.

## Any other static host

`npm run build` produces a self-contained `dist/` — upload it to Netlify,
GitHub Pages, S3, nginx, or drag it into a static host. No server-side runtime
is required because all encoding happens in the browser.

## Notes

- Node 20+ is recommended (`node --version`).
- Keep the `compatibility_date` in `wrangler.jsonc` current when upgrading
  tooling.
- The deploy script installs `wrangler` as a dev dependency so `npm run deploy`
  works without a global install.
