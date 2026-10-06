/*
 * Rotary Knob Card
 *
 * A tactile rotary-knob dashboard card for Home Assistant, built as a
 * standard Custom Element (no framework). It renders a neumorphic knob
 * that rotates to reflect the current option of an `input_select` /
 * `select` entity and lets users pick a different option by clicking.
 *
 * Design notes
 * - The DOM is only rebuilt when the option set changes; the ha-card
 *   element persists so card-mod styles remain stable across updates.
 * - Click events are throttled to prevent service-call flooding on
 *   rapid clicks.
 * - All user-supplied config values are validated and CSS/HTML-escaped
 *   before they are injected into the DOM.
 */

const ROTARY_KNOB_TAG = "rotary-knob-card";
const VERSION = "1.1.1";
const MIN_CALL_INTERVAL_MS = 400;
const ALLOWED_DOMAINS = ["input_select", "select"];

/*
 * --- Utility helpers -------------------------------------------------
 * Pure, dependency-free functions that sanitize config values before they
 * reach the DOM or CSS.
 */

/**
 * Escape characters that are unsafe in HTML text and attributes so that
 * user-provided option labels cannot inject markup.
 * @param {string | null | undefined} value - The value to escape
 * @returns {string} The escaped string
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
}

/**
 * Coerce a config value to a finite number within [min, max].
 * Returns `fallback` when the value is missing or not a valid number.
 * @param {number | string | null | undefined} value - The value to coerce
 * @param {number} fallback - The fallback value
 * @param {number} min - The minimum allowed value
 * @param {number} max - The maximum allowed value
 * @returns {number} The coerced number
 */
function toNumber(value, fallback, min, max) {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return !Number.isFinite(n) ? fallback : Math.min(max, Math.max(min, n));
}

/**
 * Validate a CSS color / value string. Rejects characters that could
 * break out of a style attribute (``;{}<>\``) and dangerous patterns
 * such as `javascript:` URIs or `expression(...)` filters.
 * @param {string | null | undefined} value - The CSS value to validate
 * @param {string} fallback - The fallback value if validation fails
 * @returns {string} A safe CSS string
 */
function safeCss(value, fallback) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const trimmed = value.trim();
  if (/[;{}<>\`]/.test(trimmed)) return fallback;
  if (/javascript:|expression|url\s*\(/i.test(trimmed)) return fallback;
  return trimmed;
}

/**
 * Convert any supported color notation (hex, rgb/rgba) to an
 * `rgba(...)` string with the requested alpha.
 *
 * For CSS variables or other complex values that cannot be converted
 * to a literal color, fall back to `color-mix` so hover/active
 * backgrounds stay semi-transparent instead of fully opaque.
 * @param {string | null | undefined} color - Color value to convert
 * @param {number} alpha - Alpha channel value (0-1)
 * @returns {string} RGBA or color-mix string
 */
function colorToRgba(color, alpha = 1) {
  if (!color) return `rgba(3, 169, 244, ${alpha})`;

  const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)$/i);
  if (rgbMatch) {
    const [, r, g, b, a] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${a ?? alpha})`;
  }

  const hex = color.replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    const num = parseInt(hex, 16);
    const r = (num >> 8) & 0xF;
    const g = (num >> 4) & 0xF;
    const b = num & 0xF;
    return `rgba(${(r << 4) | r}, ${(g << 4) | g}, ${(b << 4) | b}, ${alpha})`;
  }

  if (/^[0-9a-f]{6}$/i.test(hex)) {
    const num = parseInt(hex, 16);
    return `rgba(${(num >> 16) & 0xFF}, ${(num >> 8) & 0xFF}, ${num & 0xFF}, ${alpha})`;
  }

  // CSS variables, 8-digit hex, `rgb(1 2 3)` etc.: use color-mix so the
  // hover background stays semi-transparent in the accent color.
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
}

/**
 * Convert a linear option index to an angle in radians, with 0° at the
 * top (12 o'clock position) and clockwise progression.
 * @param {number} i - The option index
 * @param {number} count - Total number of options
 * @returns {number} Angle in radians
 */
function angleForIndex(i, count) {
  return ((i / count) * 360 - 90) * (Math.PI / 180);
}

/**
 * Generate CSS string for the card based on resolved configuration.
 * @param {Object} c - The resolved configuration object
 * @returns {string} CSS string for the card
 */
function generateCardCss(c) {
  const { knobSize, labelRingRadius, labelMaxWidth,
          showLabels, padding,
          labelFontSize, stateFontSize, nameFontSize,
          textColor, accentColor, knobColor } = c;

  // Calculate wrapper dimensions
  const wrapperWidth = showLabels ? (labelRingRadius + labelMaxWidth) * 2 : knobSize;
  const wrapperHeight = showLabels ? Math.max(knobSize, labelRingRadius * 2 + 40) : knobSize;

  return `
    .card-container { padding: ${padding}px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .knob-wrapper { position: relative; width: ${wrapperWidth}px; height: ${wrapperHeight}px; display: flex; align-items: center; justify-content: center; }
    .knob-outer {
      width: ${knobSize}px; height: ${knobSize}px; border-radius: 50%;
      background: radial-gradient(circle, ${knobColor} 0%, #111 100%);
      box-shadow: inset 2px 2px 5px rgba(255,255,255,0.1), 5px 5px 15px rgba(0,0,0,0.5), -2px -2px 10px rgba(255,255,255,0.05);
      position: relative; transition: transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
      cursor: pointer; flex-shrink: 0;
    }
    .knob-indicator { position: absolute; top: ${knobSize * 0.0714}px; left: ${knobSize / 2 - 4}px; width: 8px; height: ${knobSize * 0.143}px; background: ${accentColor}; border-radius: 4px; box-shadow: 0 0 8px ${accentColor}; }
    .position-marker { position: absolute; top: 50%; left: 50%; width: 7px; height: 7px; border-radius: 50%; background: ${accentColor}; opacity: 0.7; box-shadow: 0 0 4px ${accentColor}; pointer-events: none; }
    .position-marker.active { width: 9px; height: 9px; opacity: 1; }
    .option-label { position: absolute; top: 50%; left: 50%; font-size: ${labelFontSize}px; line-height: 1.25; color: ${textColor}; opacity: 0.8; cursor: pointer; padding: 2px 5px; border-radius: 4px; transition: opacity 0.2s, color 0.2s, background 0.2s; user-select: none; word-break: break-word; }
    .option-label:hover { opacity: 1; background: ${colorToRgba(accentColor, 0.15)}; }
    .option-label.active { opacity: 1; color: ${accentColor}; font-weight: 600; }
    .knob-outer:focus-visible, .option-label:focus-visible { outline: 2px solid ${accentColor}; outline-offset: 2px; }
    ha-card.unavailable .knob-outer { opacity: 0.4; cursor: not-allowed; }
    ha-card.unavailable .option-label { opacity: 0.4; cursor: not-allowed; }
    .label { margin-top: 4px; font-size: ${stateFontSize}px; font-weight: 500; color: ${textColor}; text-align: center; }
    .sub-label { font-size: ${nameFontSize}px; color: ${textColor}; opacity: 0.8; }
    @media (prefers-reduced-motion: reduce) {
      .knob-outer, .option-label { transition: none; }
    }
  `;
}

/*
 * --- Custom Element -------------------------------------------------
 */

class RotaryKnobCard extends HTMLElement {
  /* -- Lifecycle ---------------------------------------------------- */

  /**
   * Called when the element is added to the DOM.
   */
  connectedCallback() {
    // No-op placeholder; event listeners are bound inside _build().
  }

  /**
   * Called when the element is removed from the DOM.
   * Removes event listeners to prevent memory leaks when the card is
   * removed from the DOM. Cloning a node drops all its listeners.
   */
  disconnectedCallback() {
    if (this._knobEl) {
      this._knobEl.replaceWith(this._knobEl.cloneNode(true));
      this._knobEl = null;
    }
    if (this._labelEls) {
      this._labelEls.forEach(el => el.replaceWith(el.cloneNode(true)));
      this._labelEls = [];
    }
  }

  /* -- Configuration ------------------------------------------------ */

  /**
   * Configure the card with the provided config.
   * @param {Object} config - The card configuration object
   * @param {string} config.entity - The entity ID (input_select or select)
   * @throws {Error} When entity is invalid or not in ALLOWED_DOMAINS
   */
  setConfig(config) {
    if (!config || typeof config.entity !== "string" || !config.entity) {
      throw new Error("You must define an entity (input_select)");
    }
    const domain = config.entity.split(".")[0];
    if (!ALLOWED_DOMAINS.includes(domain)) {
      throw new Error(`Entity must be an input_select or select (got '${config.entity}')`);
    }

    this._config = config;
    this._domain = domain;
    this._stateObj = null;
    this._optSig = null;
    this._state = null;
    this._unavailable = false;
    this._lastCall = 0;

    this._ensureShell();
    // Apply immediately if hass was already set (e.g. on config change
    // in the visual editor before the next state update arrives).
    if (this._hass) this._applyHass();
  }

  /**
   * Set the Home Assistant state object.
   * @param {Object} hass - Home Assistant state object
   */
  set hass(hass) {
    this._hass = hass;
    this._applyHass();
  }

  /* -- Config resolution --------------------------------------------- */

  /**
   * Resolve all user config values into a single plain object with
   * sensible defaults, type coercion, and sanitization.
   * @returns {Object} Resolved and sanitized config
   */
  _resolveConfig() {
    const cfg = this._config || {};
    
    // Helper to get number config with validation
    const getNum = (key, fallback, min, max) => toNumber(cfg[key], fallback, min, max);
    // Helper to get boolean config (false if undefined/null)
    const getBool = (key) => cfg[key] !== false;
    // Helper to get CSS config with validation
    const getCss = (key, fallback) => safeCss(cfg[key], fallback);

    const knobSize = getNum('knob_size', 140, 20, 600);
    const knobRadius = knobSize / 2;
    const labelGap = getNum('label_gap', 34, 0, 300);

    return {
      knobSize,
      knobRadius,
      labelRingRadius: knobRadius + labelGap,
      labelGap,
      labelMaxWidth: getNum('label_max_width', 92, 10, 400),
      markerDistance: getNum('marker_distance', 18, 0, 300),
      showLabels: getBool('show_labels'),
      showPositionMarkers: getBool('show_position_markers'),
      showState: getBool('show_state'),
      showName: getBool('show_name'),
      padding: getNum('padding', 24, 0, 200),
      labelFontSize: getNum('label_font_size', 12, 6, 64),
      stateFontSize: getNum('state_font_size', 22, 6, 96),
      nameFontSize: getNum('name_font_size', 16, 6, 96),
      textColor: getCss('text_color', 'var(--primary-text-color)'),
      accentColor: getCss('accent_color', '#03A9F4'),
      knobColor: getCss('knob_color', '#444'),
    };
  }

  /* -- DOM setup ---------------------------------------------------- */

  /**
   * Ensure the shadow DOM and card shell are created.
   * The ha-card element persists so card-mod styles remain stable
   * across rebuilds.
   */
  _ensureShell() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    if (this._card) return;
    this._styleEl = document.createElement("style");
    this._card = document.createElement("ha-card");
    this.shadowRoot.append(this._styleEl, this._card);
  }

  /**
   * Render a plain error/status message inside the persistent ha-card,
   * resetting all cached DOM references so the next rebuild starts clean.
   *
   * Note: `this._options` is intentionally NOT cleared here. When an entity
   * briefly goes unavailable (losing its `options` attribute), `_applyHass`
   * falls back to the last known options to avoid a rebuild cycle that would
   * clear and re-render the entire card (flickering). Only the signature
   * (`_optSig`) is reset so the next state with a different option list
   * triggers a fresh rebuild.
   * @param {string} text - The message to display
   * @returns {void}
   */
  _showMessage(text) {
    this._styleEl.textContent = "";
    this._card.classList.remove("unavailable");
    this._card.innerHTML = `<div style="padding:16px;color:var(--error-color, red);">${escapeHtml(text)}</div>`;
    this._optSig = null;
    this._state = null;
    this._unavailable = false;
    this._knobEl = null;
    this._stateEl = null;
    this._labelEls = [];
    this._markerEls = [];
  }

  /* -- State application & rendering --------------------------------- */

  /**
   * React to a new Home Assistant state object. The DOM is only rebuilt
   * when the option list actually changes; otherwise just the rotation
   * and active-label state are updated.
   */
  _applyHass() {
    const hass = this._hass;
    if (!hass || !this._config || !this._card) return;

    try {
      const stateObj = hass.states?.[this._config.entity];

      // Home Assistant replaces the state object only when it changes,
      // so an identical reference means nothing to do.
      if (stateObj === this._stateObj) return;
      this._stateObj = stateObj;

      if (!stateObj) {
        this._showMessage(`Entity ${this._config.entity} not found`);
        return;
      }

      let options = Array.isArray(stateObj.attributes?.options)
        ? stateObj.attributes.options
        : [];

      // When the entity is unavailable or unknown the options attribute is
      // often missing. Keep the last known options to avoid a rebuild that
      // would clear and then re-render the whole card (= flickering).
      if (!options.length && this._options && this._options.length) {
        options = this._options;
      }

      // Only rebuild the DOM when the option list has changed.
      const optSig = JSON.stringify(options);
      if (optSig !== this._optSig) {
        this._optSig = optSig;
        this._options = options;
        this._state = null;
        this._build(options);
      }

      // Toggle the unavailable styling when availability changes.
      const unavailable = stateObj.state === "unavailable" || stateObj.state === "unknown";
      if (unavailable !== this._unavailable) {
        this._unavailable = unavailable;
        this._card.classList.toggle("unavailable", unavailable);
      }

      // Update rotation / active labels when the selected state changes.
      if (stateObj.state !== this._state) {
        this._state = stateObj.state;
        this._update(stateObj.state);
      }
    } catch (err) {
      console.error("rotary-knob-card: update failed", err);
    }
   }

  /**
   * Build the full DOM structure (knob, labels, markers, state text).
   * Called only when the option list changes.
   * @param {string[]} options - The list of option values
   */
  _build(options) {
    const cfg = this._config;
    const c = this._resolveConfig();
    const { showLabels, showState, showName } = c;

    // --- Display labels (allow overrides via `labels` config) -------
    const configuredLabels = Array.isArray(cfg.labels) ? cfg.labels : [];
    this._displayLabels = options.map((opt, i) =>
      String(configuredLabels[i] != null ? configuredLabels[i] : opt)
    );

    // --- Generate CSS and label/marker HTML --------------------------
    this._styleEl.textContent = generateCardCss(c);
    const labelsHtml = this._renderLabels(options, c);
    const markersHtml = this._renderMarkers(options, c);

     // --- Markup ------------------------------------------------------
    this._card.innerHTML = `
      <div class="card-container">
        <div class="knob-wrapper">
          <div class="knob-outer" role="button" tabindex="0" aria-label="${escapeHtml(cfg.name || cfg.entity)}"><div class="knob-indicator"></div></div>
          ${markersHtml}
          ${labelsHtml}
        </div>
        ${showState ? `<div class="label" aria-live="polite"></div>` : ""}
        ${showName ? `<div class="sub-label">${escapeHtml(cfg.name || "Rotary Control")}</div>` : ""}
      </div>
    `;

    // --- Cache DOM references and bind event listeners --------------
    const root = this._card;
    this._knobEl = root.querySelector(".knob-outer");
    this._stateEl = root.querySelector(".label");
    this._labelEls = Array.from(root.querySelectorAll(".option-label"));
    this._markerEls = Array.from(root.querySelectorAll(".position-marker"));

    // On first build, set the knob rotation instantly (no transition)
    // so it doesn't animate from 0deg on initial load.
    this._rot = undefined;

    // Clicking the knob cycles to the next option.
    this._bindActivate(this._knobEl, () => this._cycle());

    // Clicking/labeling an option jumps straight to that option.
    this._labelEls.forEach((el) => {
      this._bindActivate(
        el,
        () => this.selectOption(parseInt(el.getAttribute("data-index"), 10)),
        true  // stop propagation: clicking a label should not also cycle
      );
    });
  }

  /**
   * Generate the HTML for all option labels, positioned in a ring around
   * the knob. Text alignment adapts to the label's quadrant so labels on
   * the right grow rightward, on the left grow leftward, and top/bottom
   * labels stay centered.
   * @param {string[]} options - The list of option values
   * @param {Object} c - The resolved configuration object
   * @returns {string} HTML string for the labels
   */
   _renderLabels(options, c) {
     if (!c.showLabels) return "";
     const { labelRingRadius, labelMaxWidth } = c;
     return this._displayLabels.map((label, i) => {
       const angleRad = angleForIndex(i, options.length);
       const x = labelRingRadius * Math.cos(angleRad);
       const y = labelRingRadius * Math.sin(angleRad);
       const cosVal = Math.cos(angleRad);
       const textAlign = cosVal > 0.3 ? "left" : (cosVal < -0.3 ? "right" : "center");
       const translateX = cosVal > 0.3 ? "0%" : (cosVal < -0.3 ? "-100%" : "-50%");
       const safeLabel = escapeHtml(label);
       return `<div class="option-label" role="button" tabindex="0" data-index="${i}" aria-label="${safeLabel}" style="transform: translate(${x}px, ${y}px) translate(${translateX}, -50%); text-align: ${textAlign}; max-width: ${labelMaxWidth}px;">${safeLabel}</div>`;
     }).join("");
   }

  /**
   * Generate the HTML for all position markers, placed on a ring between
   * the knob edge and the option labels.
   * @param {string[]} options - The list of option values
   * @param {Object} c - The resolved configuration object
   * @returns {string} HTML string for the markers
   */
  _renderMarkers(options, c) {
    if (!c.showLabels || !c.showPositionMarkers) return "";
    const markerRadius = c.knobRadius + c.markerDistance;
    return options.map((_, i) => {
      const angleRad = angleForIndex(i, options.length);
      const x = markerRadius * Math.cos(angleRad);
      const y = markerRadius * Math.sin(angleRad);
      return `<div class="position-marker" style="transform: translate(${x}px, ${y}px) translate(-50%, -50%);"></div>`;
    }).join("");
  }

  /**
   * Update the knob rotation, active label, active marker, and state text
   * in response to a new selected value, without rebuilding the DOM.
   * The rotation always takes the shortest angular path and accumulates
   * full turns so the knob never snaps back (e.g. from HZN to OFF).
   * @param {string} state - The new selected state
   */
  _update(state) {
    if (!this._knobEl) return;
    const options = this._options || [];
    const idx = options.indexOf(state);

    if (idx >= 0 && options.length) {
      const target = (idx / options.length) * 360;
      const first = this._rot === undefined;
      if (first) {
        // First render: jump to the target angle instantly.
        this._rot = target;
        this._knobEl.style.transition = "none";
      } else {
        // Compute the shortest signed delta in [-180, 180).
        const delta = ((target - (this._rot % 360)) + 540) % 360 - 180;
        this._rot += delta;
      }
      this._knobEl.style.transform = `rotate(${this._rot}deg)`;
      if (first) {
        // Force a reflow so the transition property change takes effect
        // without animating the initial rotation.
        void this._knobEl.offsetWidth;
        this._knobEl.style.transition = "";
      }
    }

    // Highlight the active label and marker.
    this._labelEls.forEach((el, i) => el.classList.toggle("active", i === idx));
    this._markerEls.forEach((el, i) => el.classList.toggle("active", i === idx));

    // Update the state text, preferring a custom display label if provided.
    if (this._stateEl) {
      const label = idx >= 0 && this._displayLabels ? this._displayLabels[idx] : state;
      this._stateEl.textContent = label || state;
    }
  }

  /* -- Interaction -------------------------------------------------- */

  /**
   * Select an option by index, calling the Home Assistant service to
   * set the entity's state. Throttled to prevent service-call flooding.
   * @param {number} newIndex - The index of the option to select
   * @returns {Promise<void>}
   */
  async selectOption(newIndex) {
    // Validate input is a valid integer index.
    if (!Number.isInteger(newIndex)) return;

    const hass = this._hass;
    const config = this._config;
    const options = this._options || [];
    const option = options[newIndex];

    // Type safety: ensure the option is a non-empty string.
    if (!hass || !config || typeof option !== "string" || option === "") return;
    if (!this._stateObj || this._unavailable) return;
    if (option === this._state) return;

    // Throttle: rapid clicks / click series do not produce service spam.
    const now = Date.now();
    if (now - this._lastCall < MIN_CALL_INTERVAL_MS) return;
    this._lastCall = now;

    try {
      await hass.callService(this._domain, "select_option", {
        entity_id: this._config.entity,
        option,
      });
    } catch (err) {
      console.warn(`rotary-knob-card: select_option failed for ${this._config.entity}`, err);
    }
  }

  /**
   * Advance to the next option, wrapping around to the first.
   */
  _cycle() {
    const options = this._options || [];
    if (!options.length) return;
    const idx = options.indexOf(this._state);
    // If the current state is not among the options, idx is -1 and
    // (idx + 1) % length wraps to 0 — selecting the first option.
    this.selectOption((idx + 1) % options.length);
  }

  /**
   * Bind activation listeners (click + Enter/Space key) to an element.
   * When `stop` is true, events are stopped from propagating so the
   * parent handler (e.g. knob cycling) does not also fire.
   * @param {HTMLElement} el - The element to bind to
   * @param {Function} handler - The click handler function
   * @param {boolean} stop - Whether to stop event propagation
   */
  _bindActivate(el, handler, stop = false) {
    el.addEventListener("click", e => {
      if (stop) e.stopPropagation();
      handler();
    });
    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (stop) e.stopPropagation();
        handler();
      }
    });
  }

  /* -- Sizing ------------------------------------------------------- */

  /**
   * Return the card size in 50-pixel units (HA Lovelace grid convention).
   * @returns {number} Card height in grid units
   */
  getCardSize() {
    const c = this._resolveConfig();
    const height = c.showLabels
      ? Math.max(c.knobSize, (c.knobSize / 2 + c.labelGap) * 2 + 40)
      : c.knobSize;
    return Math.max(1, Math.round((height + c.padding * 2 + 60) / 50));
  }

  /**
   * Current version string (useful for debugging / card-mod selectors).
   * @returns {string} Version string
   */
  static get version() {
    return VERSION;
  }
}

/*
 * --- Registration ---------------------------------------------------
 * Guard against double-loading the resource (e.g. two card registrations)
 * which would otherwise throw a NotSupportedError.
 */
if (!customElements.get(ROTARY_KNOB_TAG)) {
  customElements.define(ROTARY_KNOB_TAG, RotaryKnobCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === ROTARY_KNOB_TAG)) {
  window.customCards.push({
    type: ROTARY_KNOB_TAG,
    name: "Rotary Knob Card",
    description: "Rotary knob card for input_select entities",
    version: VERSION,
  });
}
