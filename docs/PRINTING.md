# Printing internals

Printing is the part of this app most constrained by the browser, so the design
is deliberately conservative. This document explains the model and the traps.

## Units

Everything in the print model is **millimetres**. CSS `mm` maps directly onto
paper in print, so the same number is used for layout maths and for the style
the browser receives. There is no unit conversion layer to get wrong.

## The print document

`PrintSheet` is always in the DOM but:

```css
.print-root { display: none; }              /* hidden on screen */
@media print {
  .screen-only, .screen-only * { display: none !important; }  /* hide the app */
  .print-root { display: block !important; }                  /* show the sheet */
}
```

The sheet injects its own page rule so the browser creates the right paper:

```jsx
<style>{`@page { size: ${w}mm ${h}mm; margin: 0; }`}</style>
```

Print margins are **zero at the page level** and provided by the app's own
`marginMm`, so the layout is identical across browsers and printers. Each
`.print-page` is a fixed-size block with `break-after: page`.

## Layout maths (`src/lib/printLayout.ts`)

```
stepW = labelWidth + gap          stepH = labelHeight + gap
autoCols = floor((pageW − 2·margin + gap) / stepW)
autoRows = floor((pageH − 2·margin + gap) / stepH)
```

- `cols`/`rows` may be set explicitly; `0` means "auto".
- **Stack mode** (`stackVertical`) forces one column so values print one per
  row in input order — the default for label work.
- `buildPages(entries, copies, cfg)` expands copies, fills slot grids in order,
  cuts them into pages and caps the job at 100 pages to protect the tab.

`halfPageLabel(cfg)` derives the maximum label that yields exactly two labels
per sheet for the current paper and margins.

## Label rendering and the SVG sizing trap

bwip-js returns SVGs with **only a `viewBox`** — no `width`/`height`
attributes. Chrome's print engine collapses such an element to zero size, which
produced blank label sheets during development (verified with
`chrome --headless --print-to-pdf`: ~1.7 KB blank vs ~9.7 KB with bars).

The fix has two parts, both required:

1. **On-screen preview** (`BarcodeCard`): inject intrinsic `width`/`height`
   attributes parsed from the `viewBox`.
2. **Print labels** (`PrintSheet`): fit the symbol in JavaScript and give the
   wrapper an explicit millimetre size computed from the SVG aspect ratio, then
   let the inner `svg` fill it at `100%`. Because the wrapper already has the
   symbol's exact ratio, filling it cannot distort the barcode.

Text space is reserved before fitting:

```
textSpace = captionLines·4.6mm + fieldRows·6.0mm
available = labelHeight − textSpace − 2·padding
fit(symbol, available)   // clamp height, recompute width from ratio
```

## Readable value and field rows

Print symbols are rendered with `includetext: false`. Instead:

- the **caption** (`ITEM: …` or the raw value) is bold monospace text;
- each **field row** (`QTY`, `COO`) is `name | value | mini barcode`, separated
  by hairlines, with the mini barcode centred in a 30% column.

Mini barcodes are always **Code 128** with a 10 mm symbol height, so arbitrary
quantities and country codes scan without depending on the main symbology.

## Paper presets

| Preset | Size (mm) |
| --- | --- |
| US Letter | 215.9 × 279.4 |
| A4 | 210 × 297 |
| A5 | 148 × 210 |
| 4 × 6 in | 101.6 × 152.4 |
| Custom | any 20–2000 mm |

Landscape swaps the two dimensions.

## Known limitations

- **Firefox ignores `@page size`.** Custom paper may come out at the printer
  default; Chromium browsers honour it.
- **Printer hardware margins.** Content within a few millimetres of the paper
  edge can be clipped by the device — keep ≥ 3–5 mm page margin.
- **"Fit to page" scaling** in the print dialog changes physical dimensions.
  Print at 100% when size compliance matters.
- **Background graphics.** Non-white barcode backgrounds need "Background
  graphics" enabled in the dialog. Cut-guide borders are drawn with
  `print-color-adjust: exact`.
- Always test-scan a sheet before a production run.
