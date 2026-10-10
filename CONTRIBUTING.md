# Contributing

Thank you for contributing to rotary_knob_card!

## Development setup (Windows / PowerShell)

```powershell
npm ci
npm test      # run tests
npm run lint  # run linter
```

## Adding tests

Tests live in `tests/`. Add new test cases to the relevant `describe` block in
`tests/rotary_knob_card.test.js`. Helpers are in `tests/helpers/`.

## CI

GitHub Actions runs `npm run lint` and `npm test` on every push and pull
request targeting `main`.

## CHANGELOG

The CHANGELOG.md is auto-generated from Git commit messages using
conventional-changelog. Use [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat: add new feature`
- `fix: fix a bug`
- `docs: update docs`
- `refactor: restructure code`
- `test: add tests`
- `chore: maintenance`

Example commit:
```bash
git commit -m "feat: support dark mode in rotary knob"
```

CI automatically updates CHANGELOG.md with each push.
