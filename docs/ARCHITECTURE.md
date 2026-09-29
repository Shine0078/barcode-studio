# Architecture

This document explains how Barcode Studio is put together, why the pieces are
separated the way they are, and where to make changes.

## Design goals

1. **Never touch the network.** All encoding happens in the browser with
   `bwip-js`. There is no backend, no telemetry, and no account.
2. **Never mutate user data.** Values are validated and either encoded exactly
   as written or rejected with a reason. There is no silent truncation,
   padding, or check-digit invention.
3. **Print-accurate output.** Physical dimensions are computed in millimetres
   and rendered with a deterministic layout, because barcodes must scan and
   labels must fit real paper.
4. **Small, testable core.** All non-UI logic lives in pure functions under
   `src/lib/`, so it can be unit tested without a DOM.

## Layers

```
┌──────────────────────────────────────────────────────────────┐
│ src/components/*  (React, DOM)                               │
│   TypeSelector · DataPanel · TemplatePanel · StylePanel      │
│   ErrorsPanel · PrintPanel · BarcodeCard · PrintSheet        │
└───────────────▲──────────────────────────────────────────────┘
                │ props / callbacks
┌───────────────┴──────────────────────────────────────────────┐
│ src/App.tsx   (orchestration + derived state)                │
│   value → validate → render SVG → preview | downloads | print│
└───────────────▲──────────────────────────────────────────────┘
                │ pure functions
┌───────────────┴──────────────────────────────────────────────┐
│ src/lib/*                                                    │
│   formats · validate · generate · render · printLayout       │
│   styleOptions · download                                    │
└───────────────▲──────────────────────────────────────────────┘
                │ toSVG()
┌───────────────┴──────────────────────────────────────────────┐
│ bwip-js (Barcode Writer in Pure JavaScript)                  │
└──────────────────────────────────────────────────────────────┘
```

### `src/lib` — the domain core

| Module | Responsibility |
| --- | --- |
| `formats.ts` | The catalogue of supported symbologies: id, human label, bwip-js `bcid`, family (`linear`/`2d`), sample values and format notes. Single source of truth for what the UI may show. |
| `validate.ts` | Per-format validation mirroring BWIPP's own rules: character sets, digit counts, GTIN check digits and GS1 Application Identifiers. Returns a human-readable reason or `null`. |
| `generate.ts` | Translates app state into bwip-js options, calls `toSVG`, and maps library errors to actionable text. The only module that imports bwip-js. |
| `render.ts` | Extracts intrinsic dimensions from the SVG `viewBox`, used for aspect-ratio-preserving layout. |
| `printLayout.ts` | Pure geometry: paper presets, orientation, grid computation, pagination, and the `LabelEntry` model (value + caption lines + mini-barcode fields). |
| `styleOptions.ts` | Appearance defaults and per-format defaults, plus the sample data used by "Load examples". |
| `download.ts` | SVG blob download, SVG→PNG rasterisation on a canvas, clipboard with a `document.execCommand` fallback. |

### `src/App.tsx` — orchestration

App owns the three pieces of state that describe a job:

```ts
formatId   // which symbology
mode       // 'simple' (values list) | 'template' (Item/Qty/COO)
style      // scale, height, colours, error correction
printConfig// paper, margins, label size, copies, stacking, borders
```

and the *data*: `text` (newline separated) or `tplEntries` (structured rows).

Everything else is derived with `useMemo`:

```
text/tplEntries ──► errors ────────────────► ErrorsPanel / print gate
                └─► valid items ──► svgs ──► preview cards, downloads
                                      └────► printLabels ──► buildPages ──► PrintSheet
```

Two rendering passes intentionally exist:

- **Preview SVGs** include the human-readable text when the user enables it.
- **Print SVGs** are always rendered with `includetext: false`; the readable
  value / field rows are drawn by the app as HTML text. This keeps print output
  deterministic and uniform across 1D and 2D symbologies.

### `PrintSheet` — the print-only DOM

The sheet is always mounted but hidden (`display: none`) on screen and shown
only inside `@media print`, where the application UI is hidden. It renders:

- one `.print-page` per sheet, sized in millimetres to match the paper,
- one absolutely positioned `.print-label` per label,
- an injected `@page { size: <w>mm <h>mm; margin: 0 }` rule so the browser
  creates the right paper size.

Label internals are sized with computed millimetre values (never CSS
`max-height` scaling), because browser print engines are inconsistent about
sizing replaced elements. See `docs/PRINTING.md`.

## Data flow for a single value

```
raw line
  └─ renderLine(formatId, raw, style)
       ├─ validateValue()            → error message? stop, report line number
       ├─ barcodeOptionsFor()        → { bcid, text, scale, height, colors, ecc }
       ├─ bwip-js toSVG()            → <svg viewBox="…">…</svg>
       └─ catch                     → friendlyRenderError()
```

`Analyse → encode → catch` means validation bugs degrade into a clear error
message rather than a broken or silently altered barcode.

## Why these choices

- **bwip-js** covers every required symbology (including GS1-128, Data Matrix
  and PDF417) in pure JavaScript with both canvas and SVG output, so a single
  dependency covers the whole feature set.
- **SVG, not canvas, for the UI.** SVG scales without resampling, prints as
  vectors, and is the natural format for the "Download SVG" feature. PNG export
  rasterises the same SVG at 3×.
- **Millimetres in the print model.** Physical label sizes are what users know;
  CSS `mm` maps 1:1 to paper in print, so the same numbers serve layout and
  output.
- **Pure `lib` + thin components.** Enables the 100% test coverage of domain
  behaviour without a browser, and keeps React components about rendering.

## Extension points

- **Add a symbology**: extend `FORMATS` in `src/lib/formats.ts` with a valid
  bwip-js `bcid`, then add validation rules in `validate.ts` and samples in
  `styleOptions.ts`. The UI picks it up automatically.
- **Add a print option**: add a field to `PrintConfig` in `printLayout.ts`,
  thread it through `PrintPanel` and `PrintSheet`.
- **Change label design**: `PrintLabel` in `src/components/PrintSheet.tsx`
  and the `.print-*` rules in `src/styles.css`.
