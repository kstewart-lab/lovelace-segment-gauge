import { describe, expect, it } from "vitest";
import { fixture, html } from "@open-wc/testing";
import { HARNESS_RENDER_SCENARIOS } from "../dev-harness/scenarios";
import { validateConfig } from "../src/runtime/validate";
import "../src/segment-gauge-card";
import "../src/editor";

type HarnessState = {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
};

function makeHass(state: HarnessState) {
  return {
    states: {
      [state.entity_id]: state,
    },
    callService: () => {},
  };
}

describe("harness rendering scenarios", () => {
  it("keep harness scenario configs canonical and warning-free", () => {
    expect(HARNESS_RENDER_SCENARIOS.length).toBeGreaterThan(0);
    for (const scenario of HARNESS_RENDER_SCENARIOS) {
      const result = validateConfig(scenario.config);
      expect(result.warnings, scenario.id).toEqual([]);
    }
  });

  it("render preview cards for all harness scenarios", async () => {
    for (const scenario of HARNESS_RENDER_SCENARIOS) {
      const card = await fixture<any>(html`<segment-gauge></segment-gauge>`);
      card.style.width = scenario.id === "long-label-narrow" ? "260px" : "480px";
      card.setConfig(scenario.config);
      card.hass = makeHass({
        entity_id: scenario.entity,
        state: scenario.state,
        attributes: scenario.attributes ?? {},
      });
      await card.updateComplete;
      await card.updateComplete;

      expect(card.shadowRoot?.querySelector(".wrap"), scenario.id).toBeTruthy();
      expect(card.shadowRoot?.querySelector(".bar"), scenario.id).toBeTruthy();
    }
  });

  it("renders the editor for all harness scenarios without warnings", async () => {
    const editor = await fixture<any>(html`<segment-gauge-editor></segment-gauge-editor>`);
    for (const scenario of HARNESS_RENDER_SCENARIOS) {
      editor.hass = makeHass({
        entity_id: scenario.entity,
        state: scenario.state,
        attributes: scenario.attributes ?? {},
      });
      editor.setConfig(scenario.config);
      await editor.updateComplete;
      expect((editor as any)._warnings, scenario.id).toEqual([]);
    }
  });
});
