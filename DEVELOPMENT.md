# Development Guide

This document describes how to develop, test, and contribute to **Rotary Knob
Card**.

## Project structure

```
rotary_knob_card/
├── rotary_knob_card.js          # Main card (plain JS, no framework)
├── scripts/
│   └── check-version.cjs        # CI: version sync check
├── tests/
│   ├── helpers/
│   │   ├── load_card.js         # Loads card via new Function(), exposes test utilities
│   │   └── create_card.js       # makeHass() and createCard() helpers
│   └── rotary_knob_card.test.js  # Full test suite (63 tests, 8 suites)
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yaml
│   │   ├── feature_request.yaml
│   │   └── config.yaml
│   ├── workflows/
│   │   ├── ci.yml               # Lint + test + version sync on push/PR
│   │   ├── hacs.yml             # HACS validation
│   │   ├── codeql.yml           # CodeQL security analysis
│   │   └── release.yml          # Release draft on tag push
│   └── pull_request_template.md
├── .husky/
│   └── pre-commit               # lint-staged + lint + test
├── hacs.json                    # HACS manifest
├── CHANGELOG.md
├── CONTRIBUTING.md
├── DEVELOPMENT.md
├── LICENSE
├── README.md
├── README.de.md
└── package.json
```

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **PowerShell 7+** (Windows development)

## Setup

```powershell
# Clone and install dependencies
git clone https://github.com/arboeh/rotary_knob_card.git
cd rotary_knob_card
npm ci
```

## Development workflow

### Making changes

1. Create a branch from `main`:

   ```powershell
   git checkout -b feature/my-feature
   ```

2. Edit `rotary_knob_card.js`.

   > **Note:** The card is a plain JavaScript Custom Element (no framework).
   > It uses `setConfig()` / `setCustomProperties()` for HA Lovelace
   > integration and LitElement-style template literals for rendering.

3. Run tests:

   ```powershell
   npm test
   ```

4. Run linter:

   ```powershell
   npm run lint
   ```

5. Commit (pre-commit hook runs automatically):

   ```powershell
   git add .
   git commit -m "feat: ..."
   ```

### Pre-commit hook

The Husky pre-commit hook runs:

1. `lint-staged` — ESLint `--fix` on staged `.js`/`.json` files
2. `npm run lint` — full lint check  
3. `npm test` — full test suite

If any step fails, the commit is aborted.

#### Running the pre-commit hook manually

To run the pre-commit checks without committing:

```powershell
npx lint-staged
```

This runs ESLint `--fix` on staged files, then executes `npm run lint` and
`npm test` exactly as the hook does — useful for validating changes before
staging everything.

## Testing

Tests use **Vitest 4** with a **jsdom** DOM environment.

### Running tests

```powershell
npm test                # Run all tests once
npm run test:watch      # Watch mode (auto-rerun on changes)
npm run coverage        # Coverage report (currently disabled — see notes)
```

### Test file

| File                          | Description                                         |
| ----------------------------- | --------------------------------------------------- |
| `tests/rotary_knob_card.test.js`   | Full test suite — 84 tests in 10 describe blocks  |
| `tests/helpers/load_card.js`      | Loads the card via `new Function()`, exposes utilities via `globalThis.__rotaryKnobTest` |
| `tests/helpers/create_card.js`    | `makeHass()` factory and `createCard()` helper      |

### Writing tests

```js
import { loadCard, reloadCard } from "./helpers/load_card.js";
import { createCard, makeHass } from "./helpers/create_card.js";

const { VERSION, escapeHtml, toNumber, safeCss, colorToRgba, angleForIndex } = loadCard();

describe("my new feature", () => {
  it("does something", () => {
    const card = createCard({ entity: "input_select.test" });
    const hass = makeHass("input_select.test", "option_a", ["option_a", "option_b"]);
    card.setConfig(config);
    card.hass = hass;
    // ... assert on card._rot, card._card, etc.
  });
});
```

### Test coverage notes

Coverage is currently **disabled** (`enabled: false` in `vitest.config.js`).
The card is loaded via `new Function()`, which runs the code outside Vitest's
instrumentation scope, resulting in 0% coverage. To re-enable coverage, either:

1. Convert the card to an ES module (`.mjs`) that can be imported directly, or
2. Use a coverage tool that supports dynamic code evaluation.

## Linting

ESLint uses a **flat config** (`eslint.config.js`) with overrides per file type:

| Files              | `sourceType`   | Globals              | Special rules                              |
| ------------------ | -------------- | -------------------- | ------------------------------------------ |
| `*.config.js`      | `module`       | Node                 | —                                          |
| `*.cjs`            | `commonjs`     | Node                 | —                                          |
| `tests/**/*.js`    | `module`       | Node, Vitest, Browser| —                                          |
| `rotary_knob_card.js` | `script`    | Browser              | Unused `showLabels` warning suppressed, etc.|

### Linting commands

```powershell
npm run lint      # Check all files
npm run lint -- --fix  # Auto-fix issues
```

## Debugging

Set `debug: true` in the card config to enable runtime action logging:

```yaml
type: custom:rotary-knob-card
entity: input_select.living_room_mode
debug: true
```

When enabled, the card prints gesture and action info to `console.debug`
prefixed with `[rotary-knob-card]`. The console also displays a colored
load banner with the card version on startup.

## CI/CD

### CI (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main`:

1. **Checkout** → **Setup Node.js 20 & 22** (matrix) → **npm ci**
2. **Lint** (`npm run lint`)
3. **Test** (`npm test`)
4. **Version sync** (`node scripts/check-version.cjs`) — verifies
   `package.json` version matches the `VERSION` constant in the card.

### Release (`.github/workflows/release.yml`)

On tag push matching `v*.*.*`:

1. Generates changelog from conventional commits
2. Creates a GitHub Release draft with `rotary_knob_card.js` attached

### Pre-commit

See [Development workflow → Pre-commit hook](#development-workflow).

## Version management

The card's version is defined in **two places** that must stay in sync:

| Location         | Variable / Field |
| ---------------- | ---------------- |
| `rotary_knob_card.js` | `const VERSION = "X.Y.Z"` |
| `package.json`    | `"version": "X.Y.Z"`    |

The CI workflow enforces this via `scripts/check-version.cjs`. Bump both
locations together.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for general guidelines.

### Pull request process

1. Ensure `npm run lint` and `npm test` pass locally.
2. Update `CHANGELOG.md` with your changes under `[Unreleased]`.
3. Follow the PR template at `.github/pull_request_template.md`.
4. Request review from project maintainers.

## Code conventions

- **No comments** unless absolutely necessary (project preference).
- **ESLint** must pass — fix issues with `npm run lint -- --fix`.
- Use existing patterns in `rotary_knob_card.js` for new features.
- All user-supplied config values must be validated/sanitized before DOM injection.
