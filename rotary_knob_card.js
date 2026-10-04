function colorToRgba(color, alpha = 1) {
  if (!color) {
    return `rgba(3, 169, 244, ${alpha})`;
  }

  const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)$/i);
  if (rgbMatch) {
    const [, r, g, b, a] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${a ?? alpha})`;
  }

  const hex = color.replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    const expanded = hex.split("").map((ch) => ch + ch).join("");
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (/^[0-9a-f]{6}$/i.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return color;
}

class RotaryKnobCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) {
      throw new Error("You must define an entity (input_select)");
    }
    this._config = config;
    this._hass = null;
    this._stateObj = null;
    this._isRendered = false;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
  }

  set hass(hass) {
    const entityId = this._config.entity;
    const stateObj = hass.states[entityId];

    if (!stateObj) {
      if (!this._isRendered) {
        this.shadowRoot.innerHTML = `<ha-card><div style="padding: 16px; color: red;">Entity ${entityId} not found</div></ha-card>`;
        this._isRendered = true;
      }
      return;
    }

    const oldState = this._stateObj;
    this._hass = hass;
    this._stateObj = stateObj;

    // WICHTIG: Prüfen, ob sich State oder Optionen tatsächlich geändert haben.
    // Das verhindert das ständige Neuladen und das damit verbundene Flackern!
    const stateChanged = !oldState || oldState.state !== stateObj.state;
    const optionsChanged = !oldState || JSON.stringify(oldState.attributes.options) !== JSON.stringify(stateObj.attributes.options);

    if (stateChanged || optionsChanged || !this._isRendered) {
      this._isRendered = true;
      this.updateKnob();
    }
  }

  updateKnob() {
    const entityId = this._config.entity;
    const stateObj = this._hass.states[entityId];
    if (!stateObj) return;

    const options = stateObj.attributes.options || [];
    const currentState = stateObj.state;
    const currentIndex = options.indexOf(currentState);
    const rotation = options.length ? (currentIndex / options.length) * 360 : 0;
    const configuredLabels = Array.isArray(this._config.labels) ? this._config.labels : [];

    const displayLabels = options.map((opt, i) => {
      return configuredLabels[i] !== undefined ? configuredLabels[i] : opt;
    });
    const displayState = currentIndex >= 0 && configuredLabels[currentIndex] !== undefined
      ? configuredLabels[currentIndex]
      : currentState;

    this.render(rotation, currentState, options, currentIndex, displayLabels, displayState);
  }

  async selectOption(newIndex) {
    const entityId = this._config.entity;
    const options = this._hass.states[entityId].attributes.options;
    const newValue = options[newIndex];

    await this._hass.callService("input_select", "select_option", {
      entity_id: entityId,
      option: newValue,
    });
  }

  render(rotation, state, options, currentIndex, displayLabels, displayState) {
    if (!this.shadowRoot) return;

    const knobSize = this._config.knob_size || 140;
    const knobRadius = knobSize / 2;
    const labelGap = this._config.label_gap ?? 34;
    const labelRingRadius = knobRadius + labelGap;
    const labelMaxWidth = this._config.label_max_width || 92;
    const showLabels = this._config.show_labels !== false;
    const showPositionMarkers = this._config.show_position_markers !== false;
    const showState = this._config.show_state !== false;
    const showName = this._config.show_name !== false;
    const padding = this._config.padding ?? 24;
    const labelFontSize = this._config.label_font_size ?? 12;
    const stateFontSize = this._config.state_font_size ?? 22;
    const nameFontSize = this._config.name_font_size ?? 16;
    const textColor = this._config.text_color || "var(--primary-text-color)";
    const accentColor = this._config.accent_color || "#03A9F4";
    const knobColor = this._config.knob_color || "#444";

    const wrapperExtent = showLabels ? (labelRingRadius + labelMaxWidth) * 2 : knobSize;
    const wrapperWidth = showLabels ? wrapperExtent : knobSize;
    const wrapperHeight = showLabels ? Math.max(knobSize, labelRingRadius * 2 + 40) : knobSize;

    const labelsHtml = !showLabels ? "" : displayLabels
      .map((label, i) => {
        const angleDeg = (i / options.length) * 360;
        const angleRad = (angleDeg - 90) * (Math.PI / 180);
        const x = labelRingRadius * Math.cos(angleRad);
        const y = labelRingRadius * Math.sin(angleRad);
        const isActive = i === currentIndex;

        const cosVal = Math.cos(angleRad);
        let textAlign = "center";
        let translateX = "-50%";
        if (cosVal > 0.3) {
          textAlign = "left";
          translateX = "0%";
        } else if (cosVal < -0.3) {
          textAlign = "right";
          translateX = "-100%";
        }

        return `
          <div
            class="option-label ${isActive ? "active" : ""}"
            data-index="${i}"
            style="
              transform: translate(${x}px, ${y}px) translate(${translateX}, -50%);
              text-align: ${textAlign};
              max-width: ${labelMaxWidth}px;
            "
          >${label}</div>
        `;
      })
      .join("");

    const markersHtml = !showLabels || !showPositionMarkers ? "" : options
      .map((_, i) => {
        const angleDeg = (i / options.length) * 360;
        const angleRad = (angleDeg - 90) * (Math.PI / 180);
        const markerRadius = knobRadius + (this._config.marker_distance ?? 18);
        const x = markerRadius * Math.cos(angleRad);
        const y = markerRadius * Math.sin(angleRad);
        const isActive = i === currentIndex;

        return `
          <div
            class="position-marker ${isActive ? "active" : ""}"
            style="transform: translate(${x}px, ${y}px) translate(-50%, -50%);"
          ></div>
        `;
      })
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        .card-container {
          padding: ${padding}px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .knob-wrapper {
          position: relative;
          width: ${wrapperWidth}px;
          height: ${wrapperHeight}px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .knob-outer {
          width: ${knobSize}px;
          height: ${knobSize}px;
          border-radius: 50%;
          background: radial-gradient(circle, ${knobColor} 0%, #111 100%);
          box-shadow:
            inset 2px 2px 5px rgba(255,255,255,0.1),
            5px 5px 15px rgba(0,0,0,0.5),
            -2px -2px 10px rgba(255,255,255,0.05);
          position: relative;
          transition: transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
          transform: rotate(${rotation}deg);
          cursor: pointer;
          flex-shrink: 0;
        }
        .knob-indicator {
          position: absolute;
          top: ${knobSize * 0.0714}px;
          left: ${knobSize / 2 - 4}px;
          width: 8px;
          height: ${knobSize * 0.143}px;
          background: ${accentColor};
          border-radius: 4px;
          box-shadow: 0 0 8px ${accentColor};
        }
        .position-marker {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: ${accentColor};
          opacity: 0.7;
          box-shadow: 0 0 4px ${accentColor};
          pointer-events: none;
        }
        .position-marker.active {
          width: 9px;
          height: 9px;
          opacity: 1;
        }
        .option-label {
          position: absolute;
          top: 50%;
          left: 50%;
          font-size: ${labelFontSize}px;
          line-height: 1.25;
          color: ${textColor};
          opacity: 0.8;
          cursor: pointer;
          padding: 2px 5px;
          border-radius: 4px;
          transition: opacity 0.2s, color 0.2s, background 0.2s;
          user-select: none;
          word-break: break-word;
        }
        .option-label:hover {
          opacity: 1;
          background: ${colorToRgba(accentColor, 0.15)};
        }
        .option-label.active {
          opacity: 1;
          color: ${accentColor};
          font-weight: 600;
        }
        .label {
          margin-top: 4px;
          font-size: ${stateFontSize}px;
          font-weight: 500;
          color: ${textColor};
          text-align: center;
        }
        .sub-label {
          font-size: ${nameFontSize}px;
          color: ${textColor};
          opacity: 0.8;
        }
      </style>
      <ha-card>
        <div class="card-container">
          <div class="knob-wrapper">
            <div class="knob-outer">
              <div class="knob-indicator"></div>
            </div>
            ${markersHtml}
            ${labelsHtml}
          </div>
          ${showState ? `<div class="label">${displayState || state}</div>` : ""}
          ${showName ? `<div class="sub-label">${this._config.name || "Rotary Control"}</div>` : ""}
        </div>
      </ha-card>
    `;

    const knob = this.shadowRoot.querySelector(".knob-outer");
    knob.addEventListener("click", () => {
      const nextIndex = (currentIndex + 1) % options.length;
      this.selectOption(nextIndex);
    });

    this.shadowRoot.querySelectorAll(".option-label").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(el.getAttribute("data-index"), 10);
        this.selectOption(idx);
      });
    });
  }

  getCardSize() {
    const knobSize = this._config?.knob_size || 140;
    const showLabels = this._config?.show_labels !== false;
    const padding = this._config?.padding ?? 24;
    const height = (showLabels ? Math.max(knobSize, (knobSize / 2 + (this._config?.label_gap ?? 34)) * 2 + 40) : knobSize) + padding * 2 + 60;
    return Math.max(1, Math.round(height / 50));
  }
}

customElements.define("rotary-knob-card", RotaryKnobCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "rotary-knob-card",
  name: "Rotary Knob Card",
  description: "Rotary knob card for input_select entities",
});