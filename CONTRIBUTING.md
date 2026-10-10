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
