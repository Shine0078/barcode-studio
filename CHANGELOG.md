# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-09-29

First complete release.

### Added

- **Generator** for 13 symbologies: Code 128, Code 39, EAN-13, EAN-8, UPC-A,
  UPC-E, ITF, ITF-14, Codabar, GS1-128, QR Code, Data Matrix and PDF417.
- **Two data modes**: a multi-line values list, and a structured
  *Product labels* form (ITEM / second item or note / Quantity / COO).
- **Validation** for every format, including GTIN check digits and GS1
  Application Identifier lengths and check digits, with actionable messages and
  per-line fixes. Values are never mutated or silently skipped.
- **Appearance controls**: module scale, bar height, readable-value toggle,
  foreground/background colours, and QR/PDF417 error-correction levels.
- **Downloads**: SVG and 3×-rasterised PNG per barcode, plus copy-to-clipboard.
- **Printing**: paper presets (US Letter, A4, A5, 4 × 6 in) and custom sizes,
  orientation, margins, gaps, label size, auto or manual rows/columns, copies,
  vertical stacking, cut-guide borders, and a live page preview. Printing uses
  the browser's native dialog via `window.print()` with a dedicated print-only
  layout and dynamic `@page` sizing.
- **Shipping labels**: half-page labels (two per sheet), readable value and
  field rows with mini Code 128 barcodes, optional second item/note label.
- **Privacy**: 100% client-side; no accounts, uploads, analytics or watermarks.
- **Accessibility**: labelled controls, full keyboard operation, visible focus,
  announced errors, AA contrast, responsive layout.
- **Documentation**: architecture, validation, printing, usage, testing,
  accessibility, privacy, deployment and contribution guides.
- **Cloudflare Pages** deployment configuration, security headers and deploy
  scripts.

### Fixed

- Print output rendered blank because `bwip-js` SVGs carry only a `viewBox`;
  barcodes now receive deterministic dimensions in print.
- Print label proportions could be clipped or inconsistent; sizing is now
  computed in millimetres from the symbol's aspect ratio.
- GTIN check-digit weighting corrected to the rightmost-data-digit rule.
- Sample values for EAN-8, ITF-14 and GS1-128 corrected to valid ones.

### Security

- Response headers: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, restrictive
  `Permissions-Policy`. Long-lived immutable caching for hashed assets.

[1.0.0]: https://github.com/Shine0078/barcode-studio/releases/tag/v1.0.0
