# Commit roadmap

Ordered list of every commit in this repository's development history.
Generated from the same plan used to build the history, so it never drifts
from `git log --oneline`.

Total commits: **101**

| # | Commit message |
| --- | --- |
| 1 | `chore: add npm metadata and project scripts` |
| 2 | `chore: add gitignore for dependencies, builds and editors` |
| 3 | `chore: add TypeScript project configuration` |
| 4 | `chore: configure Vite with React plugin and Vitest` |
| 5 | `chore: add oxlint configuration` |
| 6 | `chore: add HTML shell with SEO metadata` |
| 7 | `chore: add editor defaults` |
| 8 | `feat(branding): add barcode mark as favicon` |
| 9 | `feat(ui): bootstrap the React root` |
| 10 | `chore: commit lockfile for reproducible installs` |
| 11 | `docs: add README with setup and feature overview` |
| 12 | `docs: add development plan and commit roadmap` |
| 13 | `feat(formats): add barcode format catalogue` |
| 14 | `feat(styles): add appearance defaults for each format family` |
| 15 | `feat(styles): add sample values for every format` |
| 16 | `fix(formats): correct sample values for checksum formats` |
| 17 | `feat(validate): add GTIN check-digit utilities` |
| 18 | `feat(validate): add per-format validation rules` |
| 19 | `fix(validate): correct GTIN weighting order` |
| 20 | `feat(validate): add GS1-128 application identifier rules` |
| 21 | `feat(render): add SVG viewBox dimension extraction` |
| 22 | `feat(generate): add bwip-js SVG rendering pipeline` |
| 23 | `fix(generate): restore validation import in the render pipeline` |
| 24 | `feat(generate): map encoder errors to actionable messages` |
| 25 | `feat(print): add print configuration model and paper presets` |
| 26 | `feat(print): compute label grid from paper, margins and gaps` |
| 27 | `feat(print): paginate labels with copies and a safety cap` |
| 28 | `feat(print): support caption lines on label entries` |
| 29 | `feat(print): support mini-barcode field rows` |
| 30 | `feat(print): add vertical stacking option` |
| 31 | `feat(print): draw cut-guide borders per label` |
| 32 | `feat(print): add half-page label sizing` |
| 33 | `feat(download): add SVG download helper` |
| 34 | `feat(download): rasterise SVG to PNG` |
| 35 | `feat(download): add clipboard copy with fallback` |
| 36 | `feat(ui): add format selector` |
| 37 | `feat(ui): add values list editor` |
| 38 | `refactor(ui): simplify values editor wiring` |
| 39 | `feat(ui): add appearance panel` |
| 40 | `feat(ui): add error panel with fix actions` |
| 41 | `feat(ui): add barcode preview card` |
| 42 | `fix(ui): give preview SVGs intrinsic size` |
| 43 | `feat(ui): add SVG and PNG downloads to preview cards` |
| 44 | `feat(template): add product label form` |
| 45 | `feat(print-ui): add print setup panel with page preview` |
| 46 | `feat(print): render the dedicated print sheet` |
| 47 | `fix(print): fit print symbols deterministically in millimetres` |
| 48 | `feat(print): draw the readable value under each printed barcode` |
| 49 | `feat(print): render field rows with mini barcodes` |
| 50 | `feat(ui): compose the application shell` |
| 51 | `feat(styles): add base tokens and reset styles` |
| 52 | `feat(styles): add header styles` |
| 53 | `feat(styles): add layout styles` |
| 54 | `feat(styles): add cards styles` |
| 55 | `feat(styles): add type selector styles` |
| 56 | `feat(styles): add form fields styles` |
| 57 | `feat(styles): add buttons styles` |
| 58 | `feat(styles): add checkbox styles` |
| 59 | `feat(styles): add data mode switch styles` |
| 60 | `feat(styles): add template panel styles` |
| 61 | `feat(styles): add preview styles` |
| 62 | `feat(styles): add errors styles` |
| 63 | `feat(styles): add print setup styles` |
| 64 | `feat(styles): add print root (paper output) styles` |
| 65 | `feat(styles): add footer styles` |
| 66 | `feat(styles): add print media styles` |
| 67 | `test: configure Vitest with jsdom and jest-dom matchers` |
| 68 | `test(formats): assert the catalogue exposes the promised formats` |
| 69 | `test(formats): cover GTIN check-digit maths` |
| 70 | `test(formats): cover per-format validation rules` |
| 71 | `test(formats): cover GS1-128 application identifiers` |
| 72 | `test(formats): render every sample through the full pipeline` |
| 73 | `test(formats): cover additional cases (6)` |
| 74 | `test(print): cover paper presets and orientation` |
| 75 | `test(print): cover grid computation and slot positions` |
| 76 | `test(print): cover explicit rows and overflow detection` |
| 77 | `test(print): cover pagination and large-job capping` |
| 78 | `test(app): cover the format selector and preview` |
| 79 | `test(app): cover validation errors and print gating` |
| 80 | `test(app): cover the print DOM and label sizing` |
| 81 | `test(app): cover print CSS separation` |
| 82 | `test(app): cover template mode entries` |
| 83 | `docs: add architecture guide` |
| 84 | `docs: add validation reference` |
| 85 | `docs: add printing internals guide` |
| 86 | `docs: add usage guide` |
| 87 | `docs: add testing strategy` |
| 88 | `docs: add accessibility guide` |
| 89 | `docs: add privacy model` |
| 90 | `docs: add deployment guide` |
| 91 | `docs: add contributing guide` |
| 92 | `docs: add changelog` |
| 93 | `docs: add MIT license` |
| 94 | `docs: document the GitHub Desktop workflow` |
| 95 | `docs: link documentation from the README` |
| 96 | `chore: add pull request template` |
| 97 | `chore: add bug report issue template` |
| 98 | `chore(deploy): add Cloudflare Pages configuration` |
| 99 | `chore(deploy): add security headers and caching rules` |
| 100 | `chore(deploy): add deploy scripts and wrangler dependency` |
| 101 | `chore: ignore Wrangler artifacts` |

Phases, branch strategy, conventions and an end-to-end example workflow are
described in [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md).
