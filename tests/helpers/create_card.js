import { vi } from "vitest";

export function makeHass(entityId, state = "on", options = []) {
  return {
    states: {
      [entityId]: {
        entity_id: entityId,
        state,
        attributes: { options },
      },
    },
    callService: vi.fn(),
    navigate: vi.fn(),
  };
}

export function createCard(config, hassStates) {
  const card = document.createElement("rotary-knob-card");
  document.body.appendChild(card);
  card.setConfig(config);
  if (hassStates) {
    card.hass = hassStates;
  }
  return card;
}
