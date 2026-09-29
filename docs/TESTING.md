# Testing strategy

## Pyramid

```
        integration (jsdom + Testing Library)
      ┌───────────────────────────────────────┐
      │ App.test.tsx — user-visible behaviour │
      └───────────────────────────────────────┘
   ┌──────────────────────────────────────────────┐
   │ unit — pure domain logic (no DOM)            │
   │ formats.test.ts · printLayout.test.ts        │
   └──────────────────────────────────────────────┘
```

The domain layer is pure, so most rules are tested as plain functions. The
integration layer then proves the app wires them together correctly.

## Files

| File | Covers |
| --- | --- |
| `src/tests/formats.test.ts` | Format catalogue integrity, GTIN check-digit maths, every per-format validation rule (valid + invalid), the full render pipeline for every sample, and "never silently truncates". |
| `src/tests/printLayout.test.ts` | Paper presets, orientation, custom sizes, auto grid computation, slot positions, stacking, explicit rows/cols, overflow detection, half-page maths, copies expansion, pagination, page capping. |
| `src/tests/App.test.tsx` | Format selector, live preview, per-line errors, print gating (`window.print()` only with valid/reviewed data), print DOM structure and deterministic label sizing, captions under every printed barcode, template mode, second-item labels, print CSS separation. |
| `src/tests/setup.ts` | Loads `@testing-library/jest-dom` matchers. |

## Running

```bash
npm test           # one-shot, CI mode
npm run test:watch # watch mode during development
```

Vitest configuration lives in `vite.config.ts` (`environment: 'jsdom'`,
`globals: true`, setup file above). The whole suite runs in a couple of seconds.

## Conventions

- **One behaviour per test**, named as the behaviour: `rejects bad check
  digits`, not `testValidate2`.
- **Assert the contract, not the implementation.** Tests use the public
  function or a user-visible query (`getByRole`, `getByLabelText`), never
  internal state.
- **Every new validation rule ships with a valid and an invalid case.**
- **Regressions get a named test.** The print-engine SVG bug, for example, is
  locked in by `embeds barcode SVGs with deterministic label sizing into print
  labels`.
- **Prefer data-driven loops** for catalogue-wide guarantees, e.g. "every sample
  value validates cleanly for its own format".

## Coverage of critical rules

| Rule | Where asserted |
| --- | --- |
| Check digits (EAN-8/13, UPC-A, ITF-14, GTIN-14) | `formats.test.ts` |
| GS1 AI parsing, lengths, check digits | `formats.test.ts` |
| No silent data mutation | `formats.test.ts` |
| Auto grid + stacking + half page | `printLayout.test.ts` |
| Print excludes app UI | `App.test.tsx` (reads `src/styles.css`) |
| Barcodes + captions present in print DOM | `App.test.tsx` |

## Manual checks (browser-only behaviour)

Some things cannot be asserted in jsdom and are verified by hand or with
headless Chrome:

1. `npm run preview`, then print to PDF:
   `chrome --headless=new --print-to-pdf=out.pdf http://localhost:4173`
   A sheet with barcodes produces a substantially larger PDF than a blank one
   (≈ 14 KB vs ≈ 1.7 KB) — an end-to-end proof that bars reach the page.
2. Print dialog opens from the **Print** button and the preview matches the
   paper size.
3. Scan a printed sheet with a real scanner before production use.
