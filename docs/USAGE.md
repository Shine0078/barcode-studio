# Usage guide

## Two ways to enter data

### 1. Values list (simple mode)

One value per line. Blank lines are ignored. Each line becomes one barcode.

```
Hello-123
ABC-987654
SKU-2026-0001
```

Use it for ad-hoc encoding, testing or one-off sheets. Every line is validated
independently and errors are reported by line number with a **Fix** button that
jumps to the offending line.

### 2. Product labels (Item / Qty / COO)

A structured form for shipping and warehouse labels:

| Field | Meaning |
| --- | --- |
| **ITEM** | The value encoded in the main barcode (validated for the chosen symbology) |
| **Second item / note** | Optional. Prints a **second label** for the same product with its own barcode |
| **Quantity** | Printed as a `QTY` field row, with a mini barcode |
| **COO** | Country of origin, printed as a `COO` field row, with a mini barcode |

**Add label** appends the entry (the button reads "Add labels (2)" when a second
item is set). Entries are listed below the form with remove buttons; invalid
entries are highlighted and cannot be added until corrected. **Load examples**
fills three demo products; **Clear list** empties it.

## Choosing a format

The format selector shows all 13 supported symbologies. The note under the
selector explains the accepted characters for the current format, so you can
correct a value before the validator complains.

Quick guidance:

- **Shipping / asset tags / free text** → Code 128 (default)
- **Retail GTIN** → EAN-13, UPC-A (or EAN-8/UPC-E for small packages)
- **Cartons** → ITF-14 (GTIN-14)
- **GS1 labels** → GS1-128 with `(AI)value` pairs
- **Links / long text / phone numbers** → QR Code
- **Small marks / parts** → Data Matrix
- **IDs and documents** → PDF417

## Appearance

- **Module size (scale):** width of the narrowest bar, 1–8. Bigger is easier to
  scan but wider.
- **Barcode height (mm):** bar height for linear formats.
- **Show the value as readable text:** draw the value inside the symbol on
  screen (print always uses the app's own text line instead).
- **QR / PDF417 error correction:** higher levels survive more damage or glare
  but increase symbol size.
- **Foreground / background:** keep strong contrast (dark bars on a light
  background). Avoid red bars — many scanners use a red light source.
- **Reset appearance** returns the current format's defaults.

## Downloads

Each preview card offers:

- **SVG** — vector, infinitely scalable, ideal for print and design tools.
- **PNG** — rasterised at 3× for screen use and office documents.
- **Copy value** — puts the raw value on the clipboard.

## Print setup

| Setting | Notes |
| --- | --- |
| Paper size | US Letter, A4, A5, 4 × 6 in, or Custom (mm) |
| Orientation | Portrait / Landscape |
| Page margin | Keep ≥ 3–5 mm so the printer's own margin does not clip labels |
| Gap between labels | Space between adjacent labels |
| Label width / height | Physical label size |
| Half page (2 labels per sheet) | One click: sizes labels to fill half the page |
| Rows / Columns per page | `0` = auto; columns lock to 1 while stacking |
| Copies per value | Repeats each label |
| Stack one label per row | One label per printed line, in the order entered (default) |
| Draw a border around each label | Cut guide for pasting labels onto products |
| Print the readable value below each barcode | Turns captions and field rows on/off |

The panel shows a live page thumbnail and a summary such as
`1 × 2 grid — 2 labels per page. 6 valid values × 1 copy = 3 pages.`

**Print** opens the browser's native dialog. Choose a printer or **Save as
PDF**. For exact sizing set margins to *None* in the dialog and enable
*Background graphics* if you use coloured labels.

## Bulk workflow

1. Paste many values (one per line) into the values list.
2. Review the error panel. Invalid lines are listed with reasons.
3. Fix them with the **Fix** buttons — nothing is printed for invalid lines.
4. Confirm the skip notice, then print; valid labels are laid out across pages.

## Privacy

Values are processed in the browser. Nothing is uploaded, stored or tracked.
See `docs/PRIVACY.md`.
