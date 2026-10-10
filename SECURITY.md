# Security Policy

Thank you for helping keep **Rotary Knob Card** and its users safe.

Rotary Knob Card is a client-side Home Assistant Lovelace custom card, shipped
as a single JavaScript file (`rotary_knob_card.js`) without runtime
dependencies. It runs in the browser of everyone who opens a dashboard that
uses it, and it can trigger Home Assistant actions (service calls, navigation,
URLs). Security reports are therefore taken seriously.

## Supported Versions

This is a small, maintained-on-a-best-effort-basis project. Only the latest
release (and the current `main` branch) receives security fixes.

| Version                | Supported |
| ---------------------- | --------- |
| Latest release / `main` | ✅        |
| Older releases         | ❌        |

If you use an older version, please update to the latest release first and
check whether the issue still exists.

## Reporting a Vulnerability

**Please do not report security vulnerabilities via public issues, pull
requests or discussions.**

Use GitHub's private vulnerability reporting instead:

1. Go to the [**Security** tab](https://github.com/arboeh/rotary_knob_card/security) of this repository.
2. Click **Report a vulnerability**.
3. Describe the issue as precisely as you can.

Please include, where possible:

- A description of the vulnerability and its potential impact
- The affected version or commit
- Steps to reproduce, ideally with a minimal card configuration (YAML) and, if
  relevant, the entity state or option values involved
- Your Home Assistant version and browser/companion app
- A proof of concept (please keep it harmless)
- A suggested fix, if you have one

## What to Expect

This project is maintained by a single person in their spare time, so the
following are targets rather than guarantees:

- **Acknowledgement** of your report within **7 days**
- **Initial assessment** (accepted / needs more info / declined) within **14 days**
- **Fix or mitigation** for confirmed issues as soon as reasonably possible,
  depending on severity
- **Coordinated disclosure**: please give me reasonable time to release a fix
  before publishing details (I suggest up to **90 days**). Once a fix is
  released, the issue will be documented in the
  [CHANGELOG](CHANGELOG.md) and, where appropriate, in a GitHub Security
  Advisory. Reporters are credited unless they prefer to stay anonymous.

## Scope

### In scope

Vulnerabilities in the code of this repository, for example:

- Cross-site scripting (XSS) or HTML/CSS injection through card configuration
  values (`name`, `labels`, colors, sizes, ...) or through entity data such as
  `input_select` / `select` option names or states
- Bypasses of the protocol restriction for URL actions (only `http:` and
  `https:` are intended to be allowed, e.g. `javascript:` or `data:` URLs)
- Actions being triggered that the user did not configure or did not
  initiate (e.g. unintended service calls, navigation, or `toggle` /
  `perform-action` execution)
- Bypasses of the service-call throttling that allow flooding Home Assistant
- Vulnerabilities in the build, test or release tooling in this repository
  (e.g. `.github` workflows, scripts) that could compromise releases or the
  distributed JavaScript file

### Out of scope

- Vulnerabilities in Home Assistant itself, HACS, or other custom cards or
  integrations. Please report those to the respective projects.
- Issues that require an attacker to already have administrative access to the
  Home Assistant instance or to be able to edit dashboards. Dashboard editors
  can by design configure arbitrary card actions.
- Misconfiguration, e.g. exposing Home Assistant to the internet without
  proper authentication, or intentionally configuring a card to call dangerous
  services.
- Social engineering, physical attacks, or denial-of-service attacks that are
  not caused by a flaw in this card's code.
- Findings from automated scanners without a demonstrated, practical impact.
- Vulnerabilities in third-party dev dependencies that do not affect the
  shipped `rotary_knob_card.js` (the card has no runtime dependencies). These
  are still welcome as normal issues or pull requests.

### Upstream project

This repository is a fork of
[fstancu/rotary_knob_card](https://github.com/fstancu/rotary_knob_card).
If you find a vulnerability in code that is shared with the upstream project,
I may coordinate the disclosure with the upstream maintainer. Please mention
in your report if you prefer that I do not.

## Security Design Notes

For context when assessing a finding, the card is intentionally designed to:

- Escape all user-supplied configuration values for HTML and CSS output
- Restrict URL actions to the `http:` and `https:` protocols
- Throttle service calls to prevent flooding
- Use no third-party runtime dependencies

If you find a way around any of these protections, that is a valid report.

## Safe Harbor

I consider good-faith security research conducted under this policy to be
authorized. Please avoid privacy violations, data destruction, and any
disruption of other people's Home Assistant instances; test against your own
setup only. I will not pursue action against researchers who follow this
policy.