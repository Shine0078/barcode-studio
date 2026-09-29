# Validation reference

Validation exists for one reason: to tell the user *why* a value cannot be
encoded **before** anything is printed or downloaded, in language they can act
on. It is intentionally a mirror of the rules `bwip-js`/BWIPP enforces — not a
replacement. BWIPP remains the authority: if it rejects a value our pre-check
missed, its error is caught and surfaced per line.

> Golden rule: the app never edits, pads, truncates or otherwise "fixes" a
> value. It either encodes exactly what was typed or refuses it with a reason.

## Per-format rules

| Format | Accepted | Rejected with |
| --- | --- | --- |
| Code 128 | ASCII 32–126 | non-ASCII (curly quotes, accents, emoji) or control characters |
| Code 39 | `A-Z 0-9 - . $ / + %` and space | lowercase and other symbols |
| EAN-13 | 13 digits, valid check digit | wrong length; wrong check digit (the correct one is suggested) |
| EAN-8 | 8 digits, valid check digit | as above |
| UPC-A | 12 digits, valid check digit | as above |
| UPC-E | 8 digits starting with 0 or 1 | other number systems; BWIPP verifies the check digit |
| ITF (Interleaved 2 of 5) | digits only | any non-digit |
| ITF-14 | 14 digits, valid check digit | wrong length; wrong check digit |
| Codabar | start/stop `A-D`, body `0-9 - $ : / . +` | missing start/stop; unsupported payload characters |
| GS1-128 | `(AI)value` pairs, e.g. `(01)00950110153403` | missing parentheses; unknown 3–4 digit AI; wrong fixed length; wrong GTIN check digit |
| QR Code / Data Matrix / PDF417 | any non-empty text | — (length limits reported by BWIPP) |

Blank lines in the values list are ignored; they are not errors.

## GTIN check digit

`gtinCheckDigitValid()` and `computeGtinCheckDigit()` in `src/lib/validate.ts`
implement the GS1 Modulo-10 algorithm: the **rightmost data digit is weighted
3**, then weights alternate `1, 3, 1, …` moving left; the check digit is
`(10 − sum mod 10) mod 10`.

The same function serves EAN-8 (8), UPC-A (12), EAN-13 (13) and ITF-14 (14),
which is why a single implementation with a length-aware weight index is used.

```
EAN-13  4006381333931
data    4 0 0 6 3 8 1 3 3 3 9 3   check 1
weights 1 3 1 3 1 3 1 3 1 3 1 3
sum = 4+0+0+18+3+24+1+9+3+9+9+9 = 89      (10 − 89 mod 10) mod 10 = 1 ✓
```

When a check digit is wrong the message names the expected one, e.g.
`Wrong check digit: the last digit should be 1.`

## GS1-128 Application Identifiers

`validateGs1Value()` parses `(AI)data` segments. `GS1_AI_TABLE` holds the AIs
common on real labels with their fixed lengths or maximum variable lengths,
plus a `check` flag for the AIs that carry a GTIN check digit (01, 02, 03, 04,
00, 8017, 8018).

Rules enforced:

- the value must start with `(`;
- every segment must have an AI and non-empty data;
- fixed-length AIs must have an allowed length (`(01)` requires 14 digits, `(17)`
  6, …);
- check-digit AIs are verified and the expected digit is named;
- variable-length AIs are length-capped;
- unknown 3–4 digit AIs are rejected (they are almost always typos); unknown
  2-digit AIs fall back to generic handling so newer AIs still work.

## Where errors surface

1. **Inline** — the template form shows the message under the offending field
   and refuses to add the row.
2. **Per line** — the errors panel lists `Line n`, the offending value and the
   reason, with a **Fix** button that focuses and selects the line in the
   editor.
3. **Print gate** — printing with unresolved errors requires an explicit
   acknowledgment; the dialog then prints valid labels only. Invalid entries are
   never silently dropped.

## Adding validation for a new format

1. Add the format to `FORMATS` (`src/lib/formats.ts`) with at least one
   verified sample.
2. Add a branch in `validateValue()` with a precise message.
3. Add the sample to `SAMPLE_VALUES` (`styleOptions.ts`) and confirm it renders.
4. Add cases to `src/tests/formats.test.ts` — one valid, at least one invalid
   per rule — then run `npm test`.
