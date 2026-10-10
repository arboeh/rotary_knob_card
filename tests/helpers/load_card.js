import { readFileSync } from "node:fs";
import { join } from "node:path";

const cardPath = join(process.cwd(), "rotary_knob_card.js");

let cached = null;

export function loadCard() {
  if (cached) return cached;

  const cardSource = readFileSync(cardPath, "utf-8");

  const testHook = `
  globalThis.__rotaryKnobTest = {
    escapeHtml, toNumber, safeCss, safeUrl, colorToRgba,
    angleForIndex, generateCardCss,
    VERSION, MIN_CALL_INTERVAL_MS,
    LONG_PRESS_MS, DOUBLE_TAP_MS
  };
  `;

  const factory = new Function(cardSource + "\n" + testHook);
  factory();

  cached = globalThis.__rotaryKnobTest;
  delete globalThis.__rotaryKnobTest;
  return cached;
}

export function reloadCard() {
  const cardSource = readFileSync(cardPath, "utf-8");
  new Function(cardSource).call(globalThis);
}
