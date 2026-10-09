# Deployment security and workplace access

Free Barcode Studio is a static, client-side barcode generator hosted on Cloudflare Pages.
Data values, CSV contents, generated SVG/PNG files, and ZIP archives are processed by the browser.
There are no app accounts, server-side barcode requests, or analytics.

## Security controls

- Cloudflare Pages serves the published site using HTTPS.
- `public/_headers` adds a restrictive Content Security Policy (CSP), framing protection, HSTS,
  permission restrictions, MIME sniffing protection, and a no-referrer policy.
- CSP only allows scripts from the same origin; inline CSS is necessary for calculated print
  dimensions and the `@page` style. JavaScript execution via inline scripts is not allowed.
- No images, fonts, application data, or scripts are fetched from third-party origins during
  normal barcode generation. The bwip-js and JSZip libraries are bundled locally.
- ZIP processing is loaded only when the user requests a download.
- Dynamic barcodes are generated with the bundled bwip-js encoder; caller-supplied HTML is
  never inserted into a barcode SVG.
- Nonconforming barcode data is rejected with an explanatory error; invalid codes are not
  silently printed or exported.

## Workplace networks

A successful HTTPS response (HTTP 200) does **not** imply that a company's web filter will
allow the site. Cloudflare Pages domains may be blocked by organizational category or
reputation rules that the site owner cannot override.

Do not attempt to bypass corporate content filtering. If an organization blocks the site:

1. Capture the warning page's exact text and the filtering vendor/category (if visible).
2. Ask the organization's IT/security team to review the domain and classify it correctly,
   or request an explicit allowlist exception if appropriate.
3. Consider a dedicated, owned custom domain for recognizable branding; configure it in
   Cloudflare Pages and re-check HTTPS and organization policy. A custom domain is **not**
   a guaranteed workaround or permission to evade policy.
4. Send a reproducible test case to the site maintainer with the browser version,
   public URL and timestamp; never share sensitive barcode data or credentials.

## Release checklist

1. Run `npm ci`, `npm run test`, `npm run lint`, `npm run build`,
   and `npm audit --omit=dev`.
2. Review that only intended tracked changes are committed; remove temporary profiles,
   screenshots and logs before committing.
3. Run a real browser smoke test: Code 128 and QR, captions, CSV, number sequence,
   single-file SVG/PNG, bulk SVG/PNG ZIP, and browser print preview on Letter/A4.
4. Deploy with `npm run deploy`, using the configured Cloudflare account.
5. Confirm a fresh request to `https://barcode-studio-25b.pages.dev/` returns 200
   with the expected CSP and HSTS headers and that the browser loads the new build.
6. On a scanner and target printer, verify physical label size and readability; browser
   tests alone do not certify scanner compatibility.

**Important:** The website cannot promise universal workplace access or zero barcode
scanning errors across every printer, scanner, browser and network.
