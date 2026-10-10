# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Test suite using Vitest + jsdom covering utility helpers, configuration, rendering, interaction, rotation, and version consistency
- ESLint flat configuration with recommended rules and card-specific overrides
- GitHub Actions CI workflow (lint, test, coverage on Node 20 and 22)
- HACS validation workflow
- Release workflow with automated GitHub Release creation
- Dependabot configuration for npm and GitHub Actions
- CONTRIBUTING.md with setup and release instructions
- Pull request template with checklist

## [1.2.0] - 2026-10-10

### Added
- Tap/hold/double-tap gesture support via `tap_action`, `hold_action`, and `double_tap_action` config options
- `_handleAction` method supporting `call-service`, `navigate`, `url`, `more-info`, `toggle`, `link`, and `none` action types
- `_resolveActions` method to read card action config
- `_resolveServiceCall` method supporting `service`, `service_domain`/`service_entity_id`, and `domain`/`service` forms
- `LONG_PRESS_MS` and `DOUBLE_TAP_MS` constants

### Changed
- Replaced `_bindActivate` with `_bindGestures` supporting tap, hold, and double-tap gestures
- Knob tap now fires `tap_action` if configured, otherwise cycles to next option
- Labels now support hold and double-tap gestures sharing card-level actions
- Bump version to 1.2.0

## [1.1.1] - 2026-10-06

### Changed
- Add CSS generation function for card styling

## [1.1.0] - 2026-10-05

### Added
- Security utilities and input sanitization (`escapeHtml`, `safeCss`, `toNumber`, `colorToRgba`)
- Position markers around the knob indicating possible positions
- Configurable labels mapping and styling options

### Fixed
- Prevent unnecessary re-renders and flickering by persisting ha-card across state-only changes

## [1.0.0] - 2026-07-19

### Added
- Initial release of rotary-knob-card
- Neumorphic knob design with smooth rotation animation
- Clickable labels showing all states around the knob
- Configurable size, padding, colors, and font sizes
- Support for `input_select` entities

[Unreleased]: https://github.com/arboeh/rotary_knob_card/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/arboeh/rotary_knob_card/releases/tag/v1.2.0
[1.1.1]: https://github.com/arboeh/rotary_knob_card/releases/tag/v1.1.1
[1.1.0]: https://github.com/arboeh/rotary_knob_card/releases/tag/v1.1.0
[1.0.0]: https://github.com/arboeh/rotary_knob_card/releases/tag/v1.0.0
