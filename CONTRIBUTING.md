# Contributing

Thanks for helping improve Barcode Studio. This guide covers setup, the
conventions we follow, and how to get a change merged.

## Setup

```bash
git clone <repo-url>
cd barcode-studio
npm install
npm run dev        # http://localhost:5173
```

Requirements: Node 20+ and npm. No global tooling is required.

## Before you start

- Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the layering.
- Read [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) for the roadmap,
  commit conventions and the example feature workflow.
- Scan [`docs/VALIDATION.md`](docs/VALIDATION.md) if you touch validation.

## The loop

```bash
git switch -c feat/my-change
# ... edit ...
npm run lint
npm test
npm run build
git add <files>
git commit -m "feat(scope): concise summary"
git push -u origin feat/my-change
gh pr create --fill
```

Open a pull request against `main`. Keep it focused; unrelated cleanups belong
in a separate PR.

## Rules of the codebase

1. **Never mutate user data.** A value is encoded exactly as typed, or rejected
   with a clear reason. No padding, truncation or check-digit invention.
2. **No network calls.** Everything stays in the browser. Do not add
   analytics, trackers, remote fonts or barcode APIs.
3. **Domain logic is pure.** Put rules in `src/lib/*`, not in components.
4. **Accessibility is required.** Every control has a label; keyboard operation
   works; errors are announced. See
   [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md).
5. **Print changes need print verification.** Check the browser print preview
   (and ideally headless print-to-PDF) before claiming completion.
6. **No new runtime dependencies without discussion.** The bundle is already
   dominated by the encoder library; prefer using what is present.

## Commit messages

Conventional Commits, imperative mood, one logical change per commit:

```
feat(print): add stacked one-per-row layout
fix(validate): correct GTIN weighting order
test(print): cover half-page sizing
docs: add privacy model
chore(deploy): add response headers
```

## Tests

- Domain behaviour → `src/tests/formats.test.ts`, `printLayout.test.ts`.
- User-visible behaviour → `src/tests/App.test.tsx`.
- Every new validation rule needs a valid and an invalid case.
- Every bug fix gets a named regression test.

See [`docs/TESTING.md`](docs/TESTING.md).

## Adding a symbology

1. Add an entry to `FORMATS` in `src/lib/formats.ts` with a real, verified
   sample value.
2. Add validation in `validateValue()` with a precise message.
3. Add the sample to `SAMPLE_VALUES` in `src/lib/styleOptions.ts`.
4. Add tests, then confirm the UI renders it.

## Reporting bugs

Include: what you did, what you expected, what happened, the barcode type and
the exact value (redact anything sensitive), browser + version, and whether it
affects screen, print, or both.

## Code of conduct

Be respectful and constructive. Assume good faith. Keep discussion about the
code, not the person.
