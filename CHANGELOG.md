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

## [1.2.2] - 2026-10-10

### Improved
- Refactoring: `_handleAction` split into separate handler methods (`_handlePerformAction`, `_handleNavigate`, `_handleUrl`, `_handleMoreInfo`, `_handleToggle`) for improved maintainability and readability
- `_handlePerformAction`: Simplified domain/service extraction via direct destructuring assignment
- `_handleToggle`: Reuse of `_handlePerformAction` to eliminate code duplication
- Security: `url` action now validates protocols via `safeUrl` helper function (only http/https allowed)
- Documentation expanded and updated

### Tests
- 84 tests (expanded from 77 to 84)
- New tests for URL security and edge cases in action handlers

## [1.2.1] - 2026-10-10

### Fixed
- Card no longer dies when removed from DOM and re-added (e.g. view changes, edit mode): `disconnectedCallback` now only cleans up gesture timers instead of cloning nodes, and `connectedCallback` forces a rebuild when needed
- Hold gesture now uses Pointer Events (`pointerdown`/`pointerup`/`pointercancel`/`pointerleave`) instead of separate mousedown/touchstart handlers, eliminating double-firing and stale `holdFired` state
- `holdFired` is now reset on every `pointerdown`, fixing swallowed taps after a long-press that didn't trigger a click
- Double-tap detection is more reliable with `touch-action: manipulation` CSS preventing zoom interference
- `navigate` action now uses `history.pushState` + `window.location-changed` event instead of non-existent `hass.navigate`
- `url` action opens with `noopener` for security
- `more-info` and `toggle` actions now fall back to `this._config.entity` when no entity is specified in the action config
- `perform-action` is now the primary action type (alias `call-service` kept for backward compatibility); service calls now pass `target` as a separate argument and catch promise rejections
- Removed dead code paths (`service_domain`/`service_entity_id` and split `domain`/`service` forms)
- Removed all `[TEMP DEBUG]` console.log statements

### Changed
- `_bindGestures` signature simplified: handlers no longer receive event objects; `stop` parameter removed
- Load banner now prints version on console: `ROTARY-KNOB-CARD v1.2.1` (useful for cache verification)
- Added `debug` config option (boolean) to enable runtime action logging via `console.debug`

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

[Unreleased]: https://github.com/arboeh/rotary_knob_card/compare/v1.2.2...HEAD
[1.2.2]: https://github.com/arboeh/rotary_knob_card/releases/tag/v1.2.2
[1.2.1]: https://github.com/arboeh/rotary_knob_card/releases/tag/v1.2.1
[1.2.0]: https://github.com/arboeh/rotary_knob_card/releases/tag/v1.2.0
[1.1.1]: https://github.com/arboeh/rotary_knob_card/releases/tag/v1.1.1
[1.1.0]: https://github.com/arboeh/rotary_knob_card/releases/tag/v1.1.0
[1.0.0]: https://github.com/arboeh/rotary_knob_card/releases/tag/v1.0.0
