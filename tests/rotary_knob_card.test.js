import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadCard, reloadCard } from "./helpers/load_card.js";
import { createCard, makeHass } from "./helpers/create_card.js";

const helpers = loadCard();
const {
  VERSION,
  MIN_CALL_INTERVAL_MS,
  escapeHtml,
  toNumber,
  safeCss,
  colorToRgba,
  angleForIndex,
  generateCardCss,
} = helpers;

const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));

const changelogPath = join(process.cwd(), "CHANGELOG.md");

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("Utility helpers", () => {
  describe("escapeHtml", () => {
    it("escapes ampersands", () => {
      expect(escapeHtml("&")).toBe("&amp;");
    });

    it("escapes angle brackets", () => {
      expect(escapeHtml("<")).toBe("&lt;");
      expect(escapeHtml(">")).toBe("&gt;");
    });

    it("escapes quotes", () => {
      expect(escapeHtml('"')).toBe("&quot;");
      expect(escapeHtml("'")).toBe("&#39;");
    });

    it("handles null and undefined", () => {
      expect(escapeHtml(null)).toBe("");
      expect(escapeHtml(undefined)).toBe("");
    });

    it("escapes a combination of characters", () => {
      expect(escapeHtml('<a href="x">&')).toBe(
        "&lt;a href=&quot;x&quot;&gt;&amp;"
      );
    });
  });

  describe("toNumber", () => {
    it("returns fallback for null, undefined, and empty string", () => {
      expect(toNumber(null, 50, 0, 100)).toBe(50);
      expect(toNumber(undefined, 50, 0, 100)).toBe(50);
      expect(toNumber("", 50, 0, 100)).toBe(50);
    });

    it("returns fallback for NaN", () => {
      expect(toNumber("abc", 50, 0, 100)).toBe(50);
    });

    it("coerces valid numbers", () => {
      expect(toNumber(25, 50, 0, 100)).toBe(25);
      expect(toNumber("75", 50, 0, 100)).toBe(75);
    });

    it("clamps to min and max", () => {
      expect(toNumber(150, 50, 0, 100)).toBe(100);
      expect(toNumber(-10, 50, 0, 100)).toBe(0);
    });
  });

  describe("safeCss", () => {
    const fb = "#000";

    it("rejects semicolon", () => {
      expect(safeCss(";color:red", fb)).toBe(fb);
    });

    it("rejects braces", () => {
      expect(safeCss("{bad}", fb)).toBe(fb);
    });

    it("rejects angle brackets", () => {
      expect(safeCss("<bad", fb)).toBe(fb);
      expect(safeCss(">bad", fb)).toBe(fb);
    });

    it("rejects backtick", () => {
      expect(safeCss("`bad", fb)).toBe(fb);
    });

    it("rejects javascript: URIs", () => {
      expect(safeCss("javascript:alert(1)", fb)).toBe(fb);
    });

    it("rejects expression()", () => {
      expect(safeCss("expression(1+1)", fb)).toBe(fb);
    });

    it("rejects url()", () => {
      expect(safeCss("url(https://evil.com)", fb)).toBe(fb);
    });

    it("accepts hex colors", () => {
      expect(safeCss("#03A9F4", fb)).toBe("#03A9F4");
    });

    it("accepts rgb() values", () => {
      expect(safeCss("rgb(1,2,3)", fb)).toBe("rgb(1,2,3)");
    });

    it("accepts CSS variables", () => {
      expect(safeCss("var(--primary-text-color)", fb)).toBe(
        "var(--primary-text-color)"
      );
    });

    it("returns fallback for non-string or empty", () => {
      expect(safeCss(null, fb)).toBe(fb);
      expect(safeCss(123, fb)).toBe(fb);
      expect(safeCss("   ", fb)).toBe(fb);
    });
  });

  describe("colorToRgba", () => {
    it("converts 3-digit hex", () => {
      expect(colorToRgba("#000", 1)).toBe("rgba(0, 0, 0, 1)");
      expect(colorToRgba("#fff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
    });

    it("converts 6-digit hex", () => {
      expect(colorToRgba("#ff0000", 1)).toBe("rgba(255, 0, 0, 1)");
      expect(colorToRgba("#000000", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
    });

    it("converts rgb()", () => {
      expect(colorToRgba("rgb(10, 20, 30)", 0.5)).toBe("rgba(10, 20, 30, 0.5)");
    });

    it("converts rgba() preserving existing alpha", () => {
      expect(colorToRgba("rgba(10, 20, 30, 0.8)", 0.5)).toBe(
        "rgba(10, 20, 30, 0.8)"
      );
    });

    it("falls back to color-mix for CSS variables", () => {
      expect(colorToRgba("var(--primary-text-color)", 0.5)).toBe(
        "color-mix(in srgb, var(--primary-text-color) 50%, transparent)"
      );
    });

    it("returns default color for empty/null/undefined", () => {
      expect(colorToRgba("", 0.5)).toBe("rgba(3, 169, 244, 0.5)");
      expect(colorToRgba(null, 0.5)).toBe("rgba(3, 169, 244, 0.5)");
      expect(colorToRgba(undefined, 0.5)).toBe("rgba(3, 169, 244, 0.5)");
    });
  });

  describe("angleForIndex", () => {
    it("returns -90 degrees (in radians) for index 0", () => {
      expect(angleForIndex(0, 4)).toBeCloseTo((-90 * Math.PI) / 180);
    });

    it("returns correct angles for quarter turns", () => {
      expect(angleForIndex(0, 4)).toBeCloseTo((-90 * Math.PI) / 180);
      expect(angleForIndex(1, 4)).toBeCloseTo((0 * Math.PI) / 180);
      expect(angleForIndex(2, 4)).toBeCloseTo((90 * Math.PI) / 180);
      expect(angleForIndex(3, 4)).toBeCloseTo((180 * Math.PI) / 180);
    });
  });

  describe("generateCardCss", () => {
    it("produces a CSS string with expected selectors", () => {
      const css = generateCardCss({
        knobSize: 140,
        knobRadius: 70,
        labelRingRadius: 104,
        labelGap: 34,
        labelMaxWidth: 92,
        markerDistance: 18,
        showLabels: true,
        showPositionMarkers: true,
        showState: true,
        showName: true,
        padding: 24,
        labelFontSize: 12,
        stateFontSize: 22,
        nameFontSize: 16,
        textColor: "#fff",
        accentColor: "#03A9F4",
        knobColor: "#444",
      });
      expect(css).toContain(".knob-outer");
      expect(css).toContain(".option-label");
      expect(css).toContain(".position-marker");
      expect(css).toContain(".card-container");
    });
  });
});

describe("setConfig", () => {
  beforeEach(() => loadCard());

  it("throws when entity is missing", () => {
    const card = document.createElement("rotary-knob-card");
    document.body.appendChild(card);
    expect(() => card.setConfig({})).toThrow("You must define an entity");
  });

  it("throws when entity is not a string", () => {
    const card = document.createElement("rotary-knob-card");
    document.body.appendChild(card);
    expect(() => card.setConfig({ entity: 123 })).toThrow(
      "You must define an entity"
    );
  });

  it("throws for invalid entity domain", () => {
    const card = document.createElement("rotary-knob-card");
    document.body.appendChild(card);
    expect(() => card.setConfig({ entity: "light.x" })).toThrow(
      "Entity must be an input_select or select"
    );
  });

  it("accepts input_select entity", () => {
    const card = createCard(
      { entity: "input_select.test" },
      makeHass("input_select.test", "on", ["on", "off"])
    );
    expect(card._config.entity).toBe("input_select.test");
  });

  it("accepts select entity", () => {
    const card = createCard(
      { entity: "select.test" },
      makeHass("select.test", "on", ["on", "off"])
    );
    expect(card._config.entity).toBe("select.test");
  });
});

describe("Rendering", () => {
  beforeEach(() => loadCard());

  it("shows error message when entity is missing", () => {
    const card = createCard(
      { entity: "input_select.test" },
      makeHass("other.entity", "on", ["on", "off"])
    );
    const haCard = card.shadowRoot.querySelector("ha-card");
    expect(haCard.textContent).toContain("not found");
  });

  it("creates N labels and N markers for N options", () => {
    const card = createCard(
      { entity: "input_select.test" },
      makeHass("input_select.test", "a", ["a", "b", "c"])
    );
    expect(card.shadowRoot.querySelectorAll(".option-label")).toHaveLength(3);
    expect(card.shadowRoot.querySelectorAll(".position-marker")).toHaveLength(3);
  });

  it("show_labels: false removes labels and markers", () => {
    const card = createCard(
      { entity: "input_select.test", show_labels: false },
      makeHass("input_select.test", "a", ["a", "b", "c"])
    );
    expect(card.shadowRoot.querySelectorAll(".option-label")).toHaveLength(0);
    expect(card.shadowRoot.querySelectorAll(".position-marker")).toHaveLength(0);
  });

  it("show_state: false hides state text", () => {
    const card = createCard(
      { entity: "input_select.test", show_state: false },
      makeHass("input_select.test", "a", ["a", "b", "c"])
    );
    expect(card.shadowRoot.querySelector(".label")).toBeNull();
  });

  it("show_name: false hides name text", () => {
    const card = createCard(
      { entity: "input_select.test", show_name: false },
      makeHass("input_select.test", "a", ["a", "b", "c"])
    );
    expect(card.shadowRoot.querySelector(".sub-label")).toBeNull();
  });

  it("displays custom labels when provided", () => {
    const card = createCard(
      {
        entity: "input_select.test",
        labels: ["Off", "Eco", "Comfort"],
      },
      makeHass("input_select.test", "off", ["off", "eco", "comfort"])
    );
    const labels = card.shadowRoot.querySelectorAll(".option-label");
    expect(labels[0].textContent).toBe("Off");
    expect(labels[1].textContent).toBe("Eco");
    expect(labels[2].textContent).toBe("Comfort");
  });

  it("escapes option labels with script tags", () => {
    const card = createCard(
      { entity: "input_select.test" },
      makeHass("input_select.test", "safe", [
        "safe",
        "<script>alert(1)</script>",
      ])
    );
    const labels = card.shadowRoot.querySelectorAll(".option-label");
    expect(labels[1].querySelector("script")).toBeNull();
    expect(labels[1].innerHTML).toContain("&lt;script&gt;");
  });

  it("escapes option labels with quotes", () => {
    const card = createCard(
      { entity: "input_select.test" },
      makeHass("input_select.test", "a", ['a', 'test"quote'])
    );
    const labels = card.shadowRoot.querySelectorAll(".option-label");
    expect(labels[1].querySelector("script")).toBeNull();
  });

  it("does not rebuild DOM when only state changes", () => {
    const card = createCard(
      { entity: "input_select.test" },
      makeHass("input_select.test", "a", ["a", "b", "c"])
    );
    const knobBefore = card.shadowRoot.querySelector(".knob-outer");

    card.hass = makeHass("input_select.test", "b", ["a", "b", "c"]);

    const knobAfter = card.shadowRoot.querySelector(".knob-outer");
    expect(knobAfter).toBe(knobBefore);
  });

  it("rebuilds DOM when options list changes", () => {
    const card = createCard(
      { entity: "input_select.test" },
      makeHass("input_select.test", "a", ["a", "b", "c"])
    );
    const knobBefore = card._knobEl;

    card.hass = makeHass("input_select.test", "a", ["a", "b", "c", "d"]);

    const knobAfter = card._knobEl;
    expect(knobAfter).not.toBe(knobBefore);
    expect(card.shadowRoot.querySelectorAll(".option-label")).toHaveLength(4);
  });

  it("sets unavailable class and retains last known options", () => {
    const card = createCard(
      { entity: "input_select.test" },
      makeHass("input_select.test", "a", ["a", "b", "c"])
    );
    const haCard = card.shadowRoot.querySelector("ha-card");

    expect(haCard.classList.contains("unavailable")).toBe(false);
    expect(card.shadowRoot.querySelectorAll(".option-label")).toHaveLength(3);

    card.hass = makeHass("input_select.test", "unavailable", []);

    expect(haCard.classList.contains("unavailable")).toBe(true);
    expect(card.shadowRoot.querySelectorAll(".option-label")).toHaveLength(3);
  });
});

describe("Interaction", () => {
  beforeEach(() => loadCard());

  it("knob click calls select_option with next option", () => {
    const hass = makeHass("input_select.test", "a", ["a", "b", "c"]);
    const card = createCard({ entity: "input_select.test" }, hass);

    card.shadowRoot.querySelector(".knob-outer").click();

    expect(hass.callService).toHaveBeenCalledTimes(1);
    expect(hass.callService).toHaveBeenCalledWith("input_select", "select_option", {
      entity_id: "input_select.test",
      option: "b",
    });
  });

  it("knob click wraps around from last to first option", () => {
    vi.useFakeTimers({ now: 10000 });
    const hass = makeHass("input_select.test", "c", ["a", "b", "c"]);
    const card = createCard({ entity: "input_select.test" }, hass);

    card.shadowRoot.querySelector(".knob-outer").click();

    expect(hass.callService).toHaveBeenCalledWith("input_select", "select_option", {
      entity_id: "input_select.test",
      option: "a",
    });
  });

  it("label click selects that option without cycling", () => {
    const hass = makeHass("input_select.test", "a", ["a", "b", "c"]);
    const card = createCard({ entity: "input_select.test" }, hass);

    const labels = card.shadowRoot.querySelectorAll(".option-label");
    labels[1].click();

    expect(hass.callService).toHaveBeenCalledTimes(1);
    expect(hass.callService).toHaveBeenCalledWith("input_select", "select_option", {
      entity_id: "input_select.test",
      option: "b",
    });
  });

  it("Enter key on knob triggers cycle", () => {
    const hass = makeHass("input_select.test", "a", ["a", "b", "c"]);
    const card = createCard({ entity: "input_select.test" }, hass);

    const knob = card.shadowRoot.querySelector(".knob-outer");
    knob.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(hass.callService).toHaveBeenCalledTimes(1);
  });

  it("Space key on knob triggers cycle", () => {
    const hass = makeHass("input_select.test", "a", ["a", "b", "c"]);
    const card = createCard({ entity: "input_select.test" }, hass);

    const knob = card.shadowRoot.querySelector(".knob-outer");
    knob.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

    expect(hass.callService).toHaveBeenCalledTimes(1);
  });

  it("Enter key on label selects that option", () => {
    const hass = makeHass("input_select.test", "a", ["a", "b", "c"]);
    const card = createCard({ entity: "input_select.test" }, hass);

    const labels = card.shadowRoot.querySelectorAll(".option-label");
    labels[2].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(hass.callService).toHaveBeenCalledWith("input_select", "select_option", {
      entity_id: "input_select.test",
      option: "c",
    });
  });

  it("throttles rapid clicks within MIN_CALL_INTERVAL_MS", () => {
    vi.useFakeTimers({ now: 10000 });
    const hass = makeHass("input_select.test", "a", ["a", "b", "c"]);
    const card = createCard({ entity: "input_select.test" }, hass);

    const knob = card.shadowRoot.querySelector(".knob-outer");

    knob.click();
    expect(hass.callService).toHaveBeenCalledTimes(1);

    knob.click();
    expect(hass.callService).toHaveBeenCalledTimes(1);

    vi.setSystemTime(10000 + MIN_CALL_INTERVAL_MS + 1);

    knob.click();
    expect(hass.callService).toHaveBeenCalledTimes(2);
  });

  it("does not call service when entity is unavailable", () => {
    const hass = makeHass("input_select.test", "unavailable", ["a", "b", "c"]);
    const card = createCard({ entity: "input_select.test" }, hass);

    card.shadowRoot.querySelector(".knob-outer").click();

    expect(hass.callService).not.toHaveBeenCalled();
  });

  it("does not call service when selecting the same option (label click)", () => {
    const hass = makeHass("input_select.test", "a", ["a", "b", "c"]);
    const card = createCard({ entity: "input_select.test" }, hass);

    const labels = card.shadowRoot.querySelectorAll(".option-label");
    labels[0].click();

    expect(hass.callService).not.toHaveBeenCalled();
  });

  it("does not call service for invalid index", () => {
    const hass = makeHass("input_select.test", "a", ["a", "b", "c"]);
    const card = createCard({ entity: "input_select.test" }, hass);

    return Promise.all([
      card.selectOption(99),
      card.selectOption(-1),
    ]).then(() => {
      expect(hass.callService).not.toHaveBeenCalled();
    });
  });

  it("catches errors from callService without unhandled rejection", async () => {
    const hass = makeHass("input_select.test", "a", ["a", "b"]);
    hass.callService = vi.fn().mockRejectedValue(new Error("service error"));

    const card = createCard({ entity: "input_select.test" }, hass);

    card.shadowRoot.querySelector(".knob-outer").click();

    await vi.waitFor(() => {
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("select_option failed"),
        expect.any(Error)
      );
    });
  });
});

describe("Rotation", () => {
  beforeEach(() => loadCard());

  it("takes shortest angular path including wrap-around", () => {
    const options = ["a", "b", "c", "d"];
    const card = createCard(
      { entity: "input_select.test" },
      makeHass("input_select.test", "a", options)
    );

    expect(card._rot).toBe(0);

    card.hass = makeHass("input_select.test", "d", options);
    expect(card._rot).toBe(-90);

    card.hass = makeHass("input_select.test", "a", options);
    expect(card._rot).toBe(0);
  });

  it("last option to first does not snap back", () => {
    const options = ["a", "b", "c", "d"];

    const card = createCard(
      { entity: "input_select.test" },
      makeHass("input_select.test", "d", options)
    );

    expect(card._rot).toBe(270);

    card.hass = makeHass("input_select.test", "a", options);

    expect(card._rot).toBe(360);
    expect(card.shadowRoot.querySelector(".knob-outer").style.transform).toBe(
      "rotate(360deg)"
    );
  });

  it("first render sets rotation instantly without transition animation", () => {
    const options = ["a", "b", "c"];
    const card = createCard(
      { entity: "input_select.test" },
      makeHass("input_select.test", "c", options)
    );

    expect(card._rot).toBe(240);
  });
});

describe("Miscellaneous", () => {
  beforeEach(() => loadCard());

  it("getCardSize returns a number >= 1 and grows with knob_size", () => {
    const card = createCard(
      { entity: "input_select.test" },
      makeHass("input_select.test", "a", ["a", "b"])
    );
    const defaultSize = card.getCardSize();

    expect(defaultSize).toBeGreaterThanOrEqual(1);
    expect(typeof defaultSize).toBe("number");

    const bigCard = createCard(
      { entity: "input_select.test", knob_size: 200 },
      makeHass("input_select.test", "a", ["a", "b"])
    );
    expect(bigCard.getCardSize()).toBeGreaterThan(defaultSize);
  });

  it("window.customCards has exactly one entry with type rotary-knob-card, even after double load", () => {
    const entries = window.customCards.filter(
      (c) => c.type === "rotary-knob-card"
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].version).toBe(VERSION);

    reloadCard();

    const entriesAfter = window.customCards.filter(
      (c) => c.type === "rotary-knob-card"
    );
    expect(entriesAfter).toHaveLength(1);
  });

  it("VERSION in card matches package.json version", () => {
    expect(VERSION).toBe(pkg.version);
  });

  it("latest version section in CHANGELOG matches VERSION", () => {
    const changelog = readFileSync(changelogPath, "utf-8");
    const matches = [...changelog.matchAll(/## \[(\d+\.\d+\.\d+)\]/g)];
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0][1]).toBe(VERSION);
  });
});
