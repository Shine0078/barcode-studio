# Free Barcode Studio


A completely free, browser-based barcode generator. Create barcodes in 11 symbologies, customize their appearance, arrange them on printable sheets, and print or download — all without an account, backend, or upload. Barcode data never leaves your browser.

Built with React, TypeScript, and Vite. Barcode rendering is powered by [bwip-js](https://github.com/metafloor/bwip-js) (Barcode Writer in Pure JavaScript).

## Quick start

```bash
npm install
npm run dev       # start dev server (http://localhost:5173)
```

Other commands:

```bash
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build locally
npm run test      # run all tests (vitest, 49 tests)
npm run lint      # oxlint
npm run deploy    # build + publish to Cloudflare Pages
```

## Deploying to Cloudflare Pages

The app is configured for Cloudflare Pages (`wrangler.jsonc`), and `public/_headers` adds
security headers plus long-lived caching for hashed assets.

Live site: **https://barcode-studio-25b.pages.dev/**

```bash
npx wrangler login       # one-time browser auth
npm run deploy           # build + upload production
npm run deploy:preview   # build + upload to a preview branch
```

Any new deployment gets its own immutable URL (`<hash>.barcode-studio-25b.pages.dev`); the
production branch (`main`) also publishes to the root URL. The `dist/` folder is a plain
static bundle, so it can also be drag-and-dropped into the Cloudflare dashboard or hosted on
any other static host.

## Supported barcode types

Every format listed below is generated locally by bwip-js and verified by the test suite:

| Format | Notes |
| --- | --- |
| Code 128 | Any ASCII text |
| Code 39 | A-Z, 0-9, space, `- . $ / + %` |
| EAN-13 | 13 digits, valid check digit |
| EAN-8 | 8 digits, valid check digit |
| UPC-A | 12 digits, valid check digit |
| UPC-E | 8 digits, number system 0 or 1 |
| ITF (Interleaved 2 of 5) | Digits only; even length recommended |
| ITF-14 | Exactly 14 digits, valid check digit |
| Codabar | Digits and `- $ : / . +`, must start/end with A–D |
| GS1-128 | Application Identifiers in parentheses, e.g. `(01)00950110153403`; AI lengths and GTIN check digits are validated |
| QR Code | Any text; selectable error correction (L/M/Q/H) |
| Data Matrix | Any text |
| PDF417 | Any text; selectable error correction level 0–8 |

Validation is per-line and immediate. Invalid lines show a clear reason (wrong digit count, bad characters, wrong check digit, malformed GS1 AIs) and are never silently modified, truncated, printed, or downloaded.

## Features

- **Single or bulk values** — enter one value per line; the preview and print sheet update live.
- **Appearance controls** — module size (scale), barcode height, readable-value toggle, foreground/background colors, plus format-specific options (QR and PDF417 error correction).
- **Downloads** — each barcode can be downloaded as SVG or PNG (rasterized at 3× for sharpness) and its value copied to the clipboard.
- **Print setup** — paper presets (US Letter, A4, A5, 4×6 in) or custom page size, portrait/landscape, page margins, gap between labels, label width/height, auto or manual rows/columns per page, copies per value, and an option to print the readable value under each barcode. A live page preview shows the layout before printing.
- **Bulk workflow** — invalid lines are listed with line numbers and a "Fix" button that jumps to and selects the line in the editor. Printing requires acknowledging that invalid lines are skipped, after which all valid barcodes are laid out across pages.

## Printing

1. Enter your values and adjust appearance and print setup.
2. Click **Print**. This opens your browser's native print dialog (via `window.print()`) — choose a printer or **Save as PDF**.
3. The printed pages contain only the label sheet. App controls, headers, and navigation are excluded via print CSS; the page size is set with a dynamic `@page` rule.

For best results in the print dialog:

- Set **Margins** to "None" (the layout already includes your configured page margins).
- Enable **Background graphics** if you use a non-white barcode background.

### Known browser/printer limitations

- **Firefox** ignores the `@page` size rule, so custom paper sizes may print at the printer's default size. Chrome, Edge, and other Chromium browsers honor it.
- Printers have hardware margins; content very close to the paper edge may be clipped by the printer itself. Add 3–5 mm of page margin to compensate.
- If your driver scales the print job ("Fit to page"), physical barcode dimensions may change — print at 100% scale when size compliance matters.
- Always test-print and scan a page with a real scanner before production use.

## Privacy

Barcode values are processed entirely in the browser with client-side JavaScript. Nothing is sent to a server — there is no backend, no account, no analytics, no ads, and no watermark. The site works offline once loaded.

## Project structure

```
src/
  lib/
    formats.ts        # format catalog (bcid, metadata, samples)
    validate.ts       # per-format validation incl. GS1 AI + GTIN check digits
    generate.ts       # bwip-js SVG rendering + error mapping
    printLayout.ts    # pure print layout math (paper, grid, pagination)
    styleOptions.ts   # appearance defaults + sample values
    render.ts         # SVG viewBox helpers
    download.ts       # SVG/PNG export, clipboard helpers
  components/
    TypeSelector.tsx, DataPanel.tsx, StylePanel.tsx,
    BarcodeCard.tsx (preview + downloads), ErrorsPanel.tsx,
    PrintPanel.tsx (print setup + page preview), PrintSheet.tsx (print DOM)
  tests/              # vitest: validation, formats, layout, App integration
```

## Testing

`npm run test` covers:

- **Barcode validation** — every symbology's valid samples pass; bad check digits, wrong lengths, unsupported characters, and malformed GS1 values fail with actionable messages.
- **Supported formats** — the format registry exposes exactly the 11 promised formats, each mapping to a real bwip-js encoder that renders successfully.
- **Print layout** — paper presets, orientation swap, auto row/column computation, grid slot positions, copies expansion, pagination, overflow detection, and page-count capping.
- **App integration** — format selector, live validation errors, print-dialog gating (`window.print()` is called only with valid, reviewable data), and print CSS separation.
