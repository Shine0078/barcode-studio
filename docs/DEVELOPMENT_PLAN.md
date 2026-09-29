# Development plan

This document is the working plan for Barcode Studio: what it is, how it is
built, the conventions used, and the phased roadmap whose history is reflected
in the repository's Git log.

The exact, ordered list of commits lives in
[`COMMIT_ROADMAP.md`](./COMMIT_ROADMAP.md) (generated from the same plan the
history was built from).

---

## 1. Product definition

**Goal.** A completely free, browser-only barcode generator: create barcodes in
several symbologies, customise them, arrange them on printable sheets, print or
download them — with no account, backend, or data upload.

**Non-goals.** No cloud storage, no user accounts, no analytics, no paid tiers,
no server-side rendering, no barcode *decoding*.

**Primary use cases.**

1. Ad-hoc encoding — type a value, scan or download it.
2. Bulk sheets — many values, laid out and printed.
3. Shipping/warehouse labels — structured `ITEM / QTY / COO` labels (with an
   optional second item or note) sized for pasting onto products.

---

## 2. Scope of formats

All 13 formats listed in the UI are generated locally by `bwip-js` and
verified by the test suite:

Code 128, Code 39, EAN-13, EAN-8, UPC-A, UPC-E, ITF, ITF-14, Codabar, GS1-128,
QR Code, Data Matrix, PDF417.

A format only appears in the interface if the app can actually generate it —
the selector is driven by the same catalogue the encoder uses.

---

## 3. Architecture in one paragraph

Non-UI logic lives in `src/lib/*` as pure, testable functions: format
catalogue, validation, encoding, print geometry, style defaults and downloads.
`src/App.tsx` owns state and derives everything else with `useMemo`.
Components are presentational. Printing uses a dedicated `.print-root` DOM that
is hidden on screen and shown only in `@media print`, with millimetre-accurate
label sizing. See [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 4. Engineering conventions

### Commit messages — Conventional Commits

```
<type>(<scope>): <imperative summary>

[optional body: why, trade-offs, refs]
```

| Type | Use for |
| --- | --- |
| `feat` | a new user-visible capability |
| `fix` | a bug fix (state the symptom) |
| `refactor` | behaviour-preserving change |
| `test` | tests only |
| `docs` | documentation only |
| `chore` | tooling, deps, config, housekeeping |
| `perf` | performance |
| `style` | formatting only (rare — we lint) |

Rules:

- One logical change per commit; a commit should be reviewable on its own.
- Imperative mood, lower-case, no trailing period: `add label grid maths`.
- Scopes used here: `formats`, `validate`, `generate`, `print`, `ui`,
  `template`, `styles`, `deploy`.
- A `fix` message names the symptom, not just the file:
  `fix(print): give print SVGs intrinsic dimensions`.

### Branching — GitHub Flow

- `main` is always releasable. Every commit on `main` builds and tests green.
- Work happens on short-lived branches: `feat/<topic>`, `fix/<topic>`,
  `docs/<topic>`, `chore/<topic>`.
- Merge back via pull request (squash or merge commit), then delete the branch.
- Releases are tagged (`v1.0.0`) on `main`.

### Quality gates

A change is done only when:

1. `npm run lint` passes.
2. `npm test` passes (new behaviour has tests; regressions have a named test).
3. `npm run build` succeeds.
4. Print-affecting changes were verified in a real browser print preview
   (and ideally a headless print-to-PDF).
5. Documentation that the change invalidates is updated in the same PR.

---

## 5. Phased roadmap

Each phase below maps to a contiguous block of commits in the Git history. The
per-commit list is [`COMMIT_ROADMAP.md`](./COMMIT_ROADMAP.md).

| Phase | Focus | Representative commits |
| --- | --- | --- |
| 0. Foundation | Repo, tooling, HTML shell, docs skeleton | `chore: add gitignore for dependencies, builds and editors`, `chore: configure Vite with React plugin` |
| 1. Domain core | Catalogs, validation, encoding, print geometry, downloads | `feat(validate): add GS1-128 application identifier rules`, `feat(print): add half-page label sizing` |
| 2. Interface | Panels, preview cards, print sheet, styling | `feat(ui): add format selector`, `fix(print): fit print symbols deterministically in millimetres` |
| 3. Verification | Unit + integration tests | `test(print): cover pagination and large-job capping` |
| 4. Documentation | Architecture through privacy guides | `docs: add architecture guide` |
| 5. Deployment | Cloudflare Pages config, headers, deploy scripts | `chore(deploy): add security headers and caching rules` |
| 6. Housekeeping | Ignore rules, final consistency | `chore: finalize project state` |

### Phase 0 — Foundation

Stand up the repository so every later commit is buildable: `package.json`,
TypeScript project references, Vite (+ Vitest), oxlint, the HTML shell, the
favicon and the initial README.

### Phase 1 — Domain core

Build the pure core first, because everything else depends on it and it is what
gets unit tested:

1. **Formats** — the catalogue of supported symbologies with verified samples.
2. **Validation** — GTIN check digits, per-format rules, GS1 AI parsing.
3. **Encoding** — a thin, well-typed wrapper over `bwip-js` that never mutates
   input and turns library errors into actionable messages.
4. **Print geometry** — paper presets, grid maths, pagination, label entries.
5. **Downloads** — SVG, PNG rasterisation, clipboard.

Notable fixes captured in this phase (they really happened):

- `fix(validate): correct GTIN weighting order` — the first implementation
  weighted from the left; the GS1 rule is that the *rightmost data digit* gets
  weight 3. Caught by the check-digit tests.
- `fix(formats): correct sample values for checksum formats` — EAN-8 and ITF-14
  samples must carry valid check digits to be usable as examples.
- `fix(generate): restore validation import in render pipeline` — a refactor
  dropped an import, breaking every render call; caught by the pipeline tests.

### Phase 2 — Interface

Panels are built from small, labelled components, then composed in `App.tsx`.
Printing got the most iteration, because browser print engines are the least
predictable part of the stack:

- `fix(print): give print SVGs intrinsic dimensions` — `bwip-js` emits SVGs with
  only a `viewBox`; Chrome's print engine collapses those to zero size, producing
  a blank sheet (verified: ~1.7 KB blank PDF vs ~9.7 KB with bars).
- `fix(print): fit print symbols deterministically in millimetres` — sizing is
  computed in JS instead of relying on CSS `max-height` in a flex context.
- `feat(print): draw the readable value under every printed barcode` and
  `feat(print): render field rows with mini barcodes`.
- `fix(print): centre mini barcodes in their column`.

### Phase 3 — Verification

Unit tests for the domain, integration tests for user-visible behaviour. Every
validation rule ships with a valid and an invalid case; catalogue-wide
guarantees are asserted with data-driven loops over `FORMATS`.

### Phase 4 — Documentation

Written last so it describes the shipped behaviour: architecture, validation
reference, printing internals, usage, testing, accessibility, privacy,
deployment and contribution guide.

### Phase 5 — Deployment

Cloudflare Pages: `wrangler.jsonc`, `public/_headers`, and
`npm run deploy` / `npm run deploy:preview`.

### Phase 6 — Housekeeping

Ignore Cloudflare/Wrangler artefacts and run a final consistency pass.

---

## 6. Example feature workflow

The following is a complete, realistic walk-through of adding a new format
(say **Code 93**) using the conventions above.

### Step 1 — Branch

```bash
git switch main
git pull
git switch -c feat/code93
```

### Step 2 — Catalogue + samples

`src/lib/formats.ts`:

```ts
{
  id: 'code93',
  label: 'Code 93',
  bcid: 'code93',
  family: 'linear',
  samples: ['CODE93-123'],
  notes: 'Uppercase letters, digits and symbols; compact and alphanumeric.',
}
```

`src/lib/styleOptions.ts`: add `code93: ['CODE93-123']` to `SAMPLE_VALUES`.

```bash
git add src/lib/formats.ts src/lib/styleOptions.ts
git commit -m "feat(formats): add Code 93 to the format catalogue"
```

### Step 3 — Validation

`src/lib/validate.ts`:

```ts
if (formatId === 'code93') {
  if (!/^[A-Z0-9\-. $/+%]*$/.test(value)) {
    return 'Code 93 supports A-Z, 0-9, space, and - . $ / + % only.';
  }
  return null;
}
```

```bash
git add src/lib/validate.ts
git commit -m "feat(validate): enforce Code 93 character set"
```

### Step 4 — Tests

`src/tests/formats.test.ts`:

```ts
it('code93: enforces charset', () => {
  expect(validateValue('code93', 'CODE93-123')).toBeNull();
  expect(validateValue('code93', 'code93')).toMatch(/A-Z/i);
});
```

The suite also asserts every sample in `FORMATS` renders and validates, so
adding the catalogue entry exercises the new format automatically.

```bash
git add src/tests/formats.test.ts
git commit -m "test(formats): cover Code 93 validation and rendering"
```

### Step 5 — Verify

```bash
npm run lint && npm test && npm run build
```

### Step 6 — Document

Add Code 93 to the supported-formats list in `README.md`.

```bash
git add README.md
git commit -m "docs: list Code 93 in supported formats"
```

### Step 7 — Pull request and merge

```bash
git push -u origin feat/code93
gh pr create --fill --base main
gh pr merge --squash --delete-branch
```

### Step 8 — Release (when appropriate)

```bash
git switch main && git pull
git tag -a v1.1.0 -m "v1.1.0: add Code 93"
git push --tags
```

---

## 7. Definition of done

- [ ] Behaviour implemented, not mocked.
- [ ] Validation errors are specific and actionable.
- [ ] No user data is mutated, skipped silently, or sent anywhere.
- [ ] Print layout verified in a real print preview when print code changed.
- [ ] Tests added for new rules and regressions.
- [ ] `lint`, `test`, `build` green.
- [ ] Docs updated.

## 8. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Browser print engines differ | Millimetre layout, deterministic SVG sizing, documented limitations, headless PDF smoke test |
| Check-digit bugs | Dedicated GTIN utilities with unit tests and verified samples |
| Bundle size (all encoders) | Accepted for offline capability; could be code-split per format later |
| Silent data corruption | "Never mutate" rule + tests asserting the value survives errors |
