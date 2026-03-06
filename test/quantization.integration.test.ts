import { describe, it, expect } from "vitest";
import { fixture, html } from "@open-wc/testing";
import "../src/segment-gauge-card";

const makeHass = (entityId: string, value: string) => ({
  states: {
    [entityId]: {
      entity_id: entityId,
      state: value,
      attributes: {},
    },
  },
});

const getFillClipRect = (el: HTMLElement) => {
  const svg = el.shadowRoot?.querySelector("svg.bar-svg");
  if (!svg) return null;
  return svg.querySelector('clipPath[id$="-fill-clip"] rect');
};

describe("quantization integration", () => {
  it("snaps fill to level boundary in level mode (floor)", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      data: { min: 0, max: 100 },
      bar: {
        show: true,
        segments: { mode: "level", gap: 0 },
        snapping: { fill: "down" },
        track: { intensity: 50 },
      },
      levels: [
        { value: 0, color: "#00ff00" },
        { value: 50, color: "#ffff00" },
        { value: 100, color: "#ff0000" },
      ],
    } as any;
    el.setConfig(cfg);
    const hass = makeHass("sensor.test", "60");
    el.hass = hass;
    (el as any)._stateObj = hass.states["sensor.test"];
    (el as any)._valueNum = 60;
    el.requestUpdate();
    await el.updateComplete;

    const fillClip = getFillClipRect(el);
    expect(fillClip).toBeTruthy();
    expect(fillClip?.getAttribute("x")).toBe("0%");
    expect(fillClip?.getAttribute("width")).toBe("50%");
  });

  it("snaps fill in fixed segment mode on initial render using measured track width", async () => {
    const original = HTMLElement.prototype.getBoundingClientRect;
    Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
      configurable: true,
      value: function () {
        if ((this as Element).classList?.contains("track")) {
          return {
            x: 0,
            y: 0,
            top: 0,
            left: 0,
            right: 100,
            bottom: 10,
            width: 100,
            height: 10,
            toJSON() {
              return {};
            },
          } as DOMRect;
        }
        return original.call(this);
      },
    });

    try {
      const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
      const cfg = {
        type: "custom:segment-gauge",
        entity: "sensor.test",
        data: { min: 0, max: 100 },
        bar: {
          show: true,
          segments: { mode: "fixed", width: 10, gap: 0 },
          snapping: { fill: "down" },
          track: { intensity: 50 },
        },
        pointer: { show: false },
        levels: [
          { value: 0, color: "#00ff00" },
          { value: 100, color: "#ff0000" },
        ],
      } as any;
      el.setConfig(cfg);
      const hass = makeHass("sensor.test", "37");
      el.hass = hass;
      (el as any)._stateObj = hass.states["sensor.test"];
      (el as any)._valueNum = 37;
      el.requestUpdate();
      await el.updateComplete;
      await el.updateComplete;

      const fillClip = getFillClipRect(el);
      expect(fillClip).toBeTruthy();
      expect(fillClip?.getAttribute("width")).toBe("30%");
    } finally {
      Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
        configurable: true,
        value: original,
      });
    }
  });

  it("can fill only the active segment when bar.fill_mode is current_segment", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      data: { min: 0, max: 100 },
      bar: {
        show: true,
        fill_mode: "current_segment",
        segments: { mode: "level", gap: 0 },
        snapping: { fill: "off" },
        track: { intensity: 50 },
      },
      levels: [
        { value: 0, color: "#00ff00" },
        { value: 50, color: "#ffff00" },
        { value: 100, color: "#ff0000" },
      ],
    } as any;
    el.setConfig(cfg);
    const hass = makeHass("sensor.test", "60");
    el.hass = hass;
    (el as any)._stateObj = hass.states["sensor.test"];
    (el as any)._valueNum = 60;
    el.requestUpdate();
    await el.updateComplete;

    const fillClip = getFillClipRect(el);
    expect(fillClip).toBeTruthy();
    expect(fillClip?.getAttribute("x")).toBe("50%");
    expect(fillClip?.getAttribute("width")).toBe("50%");
  });
});
