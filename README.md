# Rotary Knob Card for Home Assistant

<img src="" alt="Rotary Knob Card" width="600"/>

[🇬🇧 English](README.md) | [🇩🇪 **Deutsch**](README.de.md)

[![HACS](https://img.shields.io/badge/HACS-Custom-card-blue.svg)](https://hacs.xyz)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Compatible-41BDF5.svg)](https://www.home-assistant.io/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![Tests](https://github.com/arboeh/rotary_knob_card/actions/workflows/ci.yml/badge.svg)](https://github.com/arboeh/rotary_knob_card/actions/workflows/ci.yml)

A beautiful, tactile rotary knob dashboard card for Home Assistant. It renders a
neumorphic knob that rotates to reflect the current option of an `input_select`
or `select` entity and lets users pick a different option by clicking.

The card supports standard Home Assistant card actions: `tap_action`,
`hold_action`, and `double_tap_action`.

<!-- Replace with real screenshot -->
![Screenshot](images/screenshot.png)

## Features

- **Intuitive control**: Click the knob to cycle through `input_select` options.
- **Smooth animation**: Visual rotation matches the current state of the entity.
- **Neumorphic design**: Modern dark-themed aesthetic that fits Home Assistant.
- **Gesture support**: Tap, double-tap, and long-press actions.
- **Action routing**: Configurable `tap_action`, `hold_action`, and
  `double_tap_action` per the HA card action convention.
- **Safe by design**: All user-supplied config values are HTML/CSS escaped;
  service calls are throttled to prevent flooding; URL actions are restricted
  to `http:` and `https:` protocols.
- **Zero dependencies**: Plain Custom Element - no framework required.

## Installation

### Via HACS

1. Open **HACS** in your Home Assistant instance.
2. Click the **three dots (⋮)** → **Custom repositories**.
3. Paste `https://github.com/arboeh/rotary_knob_card`.
4. Select **Dashboard** as the category and click **Add**.
5. Search for **Rotary Knob Card** in the HACS store and click **Download**.
6. **Restart Home Assistant.**

### Manual

Download `rotary_knob_card.js` into your `www` (or `config/www`) folder, then register
it as a Lovelace resource.

**Via UI (recommended):**
- **Settings → Dashboards → Three dots (⋮) → Resources → Add resource**
- URL: `/local/rotary_knob_card.js`
- Module type: `JavaScript Module`

**Via `configuration.yaml`:**

```yaml
lovelace:
  resources:
    - url: /local/rotary_knob_card.js
      type: module
```

After adding, restart Home Assistant.

## Usage

Add a **Manual** card to your dashboard:

```yaml
type: custom:rotary-knob-card
entity: input_select.living_room_mode
name: "Living Room"
```

## Configuration

| Option                   | Type      | Default                       | Description                                                              |
| ------------------------ | --------- | ----------------------------- | ------------------------------------------------------------------------ |
| `entity`                 | string    | -                             | **Required.** `input_select` or `select` entity ID.                      |
| `name`                   | string    | `"Rotary Control"`            | Text shown under the state label.                                        |
| `knob_size`              | number    | `140`                         | Diameter of the knob in px.                                              |
| `label_gap`              | number    | `34`                          | Distance from knob edge to label ring.                                   |
| `label_max_width`        | number    | `92`                          | Max width per option label before wrapping.                              |
| `padding`                | number    | `24`                          | Padding around card content.                                             |
| `label_font_size`        | number    | `12`                          | Font size for labels around the knob.                                    |
| `state_font_size`        | number    | `22`                          | Font size for current state text.                                        |
| `name_font_size`         | number    | `16`                          | Font size for the name subtitle.                                         |
| `text_color`             | string    | `var(--primary-text-color)`   | Text color for labels, state and name.                                   |
| `accent_color`           | string    | `#03A9F4`                     | Accent color for knob indicator, active labels, hover.                   |
| `knob_color`             | string    | `#444`                        | Background color of the knob body.                                       |
| `show_position_markers`  | boolean   | `true`                        | Show indicator markers around the knob.                                  |
| `marker_distance`        | number    | `18`                          | Distance from knob edge to position markers.                             |
| `show_labels`            | boolean   | `true`                        | Show the ring of option labels.                                          |
| `show_state`             | boolean   | `true`                        | Show current-state text below knob.                                      |
| `show_name`              | boolean   | `true`                        | Show name subtitle below state.                                          |
| `tap_action`             | object    | -                             | Action fired on single tap.                                      |
| `hold_action`            | object    | -                             | Action fired on long-press (500 ms).                             |
| `double_tap_action`      | object    | -                             | Action fired on double-tap. Single taps are delayed 300 ms to detect. |
| `debug`                  | boolean   | `false`                       | Enable debug logging in browser console.                         |
| `labels`                 | list      | -                             | Custom display labels for options (mapped 1:1 in order).                 |

### Examples

Compact card:

```yaml
type: custom:rotary-knob-card
entity: input_select.heating_state
name: "AC Heating"
knob_size: 80
label_gap: 18
padding: 10
```

Minimal (knob only, no labels or text):

```yaml
type: custom:rotary-knob-card
entity: input_select.heating_state
show_labels: false
show_state: false
show_name: false
```

Custom labels:

```yaml
type: custom:rotary-knob-card
entity: input_select.heating_state
name: "Heating"
labels:
  - "Off"
  - "Eco"
  - "Comfort"
```

Custom styling:

```yaml
type: custom:rotary-knob-card
entity: input_select.heating_state
name: "Heating"
label_font_size: 15
state_font_size: 24
name_font_size: 18
text_color: "#f5f5f5"
accent_color: "#ffb347"
knob_color: "#5a3d2b"
show_position_markers: true
marker_distance: 20
```

### Card actions

Actions follow the [Home Assistant card action convention](https://github.com/home-assistant/frontend/blob/dev/docs/development/contract-card.md#action):

```yaml
type: custom:rotary-knob-card
entity: input_select.living_mode
tap_action:
  action: perform-action
  perform_action: light.toggle
  data:
    entity_id: light.living_room
hold_action:
  action: more-info
double_tap_action:
  action: navigate
  navigation_path: /lovelace/living
```

Supported action types:

| Action          | Key                   | Example                                    |
| --------------- | --------------------- | ------------------------------------------ |
| Service call    | `perform-action`      | `perform_action: light.toggle`             |
| Navigate        | `navigate`            | `navigation_path: /lovelace/living`        |
| Open URL        | `url`                 | `url_path: https://example.com`            |
| More info       | `more-info`           | (uses card entity by default)              |
| Toggle          | `toggle`              | `entity: light.living_room`                |
| No-op           | `none`                | -                                          |

The legacy `call-service` action (with `service: "domain.service"` key) is still supported as an alias for `perform-action`.

- When `double_tap_action` is set, a single tap waits ~300 ms (`DOUBLE_TAP_MS`) to detect a second tap before firing.
- Without `double_tap_action`, single taps fire immediately.
- `hold_action` fires after 500 ms (`LONG_PRESS_MS`) and suppresses the tap.
- **Without `tap_action`**: tapping the knob cycles to the next option.
- **Labels**: clicking a label selects that option directly. Hold/double-tap on labels fire the card-level `hold_action`/`double_tap_action`.
- **Touch support**: Gestures use Pointer Events; `touch-action: manipulation` prevents zoom on double-tap; long-press context menu is suppressed.
- **Keyboard support**: Press <kbd>Enter</kbd> or <kbd>Space</kbd> to fire the `tap_action`.

## Development

### Setup

```powershell
# Install dependencies
npm ci

# Lint
npm run lint

# Run tests
npm test

# Watch tests
npm run test:watch

# Coverage (currently disabled due to new Function() loading pattern)
npm run coverage
```

### Linting pre-commit

A git pre-commit hook (Husky) runs `lint-staged` (ESLint --fix on staged files)
plus `npm run lint` and `npm test` before every commit.

## Screenshots

![Screenshot](images/screenshot.png)

*(TODO: add real screenshots)*

## License

MIT License - see [LICENSE](LICENSE).

## Repository

[https://github.com/arboeh/rotary_knob_card](https://github.com/arboeh/rotary_knob_card)
