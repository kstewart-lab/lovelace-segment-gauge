import { describe, expect, it, vi } from "vitest";
import { fixture, html } from "@open-wc/testing";
import "../src/segment-gauge-card";
import "../src/editor";

const makeHass = (entityId: string, value = "42") => ({
  states: {
    [entityId]: {
      entity_id: entityId,
      state: value,
      attributes: {},
    },
  },
  callService: () => {},
});

describe("config warning integration", () => {
  it("logs validation warnings in runtime setConfig", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
      el.setConfig({
        type: "custom:segment-gauge",
        entity: "sensor.test",
        ming: "mong",
      } as any);
      el.hass = makeHass("sensor.test", "40");
      await el.updateComplete;

      expect(warn).toHaveBeenCalledWith("segment-gauge:", `Unknown field "ming"`);
      expect((el as any)._config?.entity).toBe("sensor.test");
    } finally {
      warn.mockRestore();
    }
  });

  it("shows editor warnings and clears them when config becomes valid", async () => {
    const editor = await fixture<any>(html`<segment-gauge-editor></segment-gauge-editor>`);
    editor.hass = makeHass("sensor.test", "40");
    editor.setConfig({
      type: "custom:segment-gauge",
      entity: "sensor.test",
      ming: "mong",
    } as any);
    await editor.updateComplete;

    const alertText = editor.shadowRoot?.textContent ?? "";
    expect((editor as any)._warnings).toContain(`Unknown field "ming"`);
    expect(alertText).toContain(`Unknown field "ming"`);

    editor.setConfig({
      type: "custom:segment-gauge",
      entity: "sensor.test",
    } as any);
    await editor.updateComplete;

    expect((editor as any)._warnings).toEqual([]);
  });
});
