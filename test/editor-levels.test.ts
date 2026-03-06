import { describe, it, expect } from "vitest";
import { fixture, html } from "@open-wc/testing";
import "../src/editor";

describe("editor level add defaults", () => {
  it("adds first level at min", async () => {
    const el = await fixture<any>(html`<segment-gauge-editor></segment-gauge-editor>`);
    el.setConfig({ entity: "sensor.test", data: { min: 0, max: 100, precision: 1 }, levels: [] } as any);
    (el as any)._addStop();
    const stops = (el as any)._stops();
    expect(stops.length).toBe(1);
    expect(stops[0].value).toBe(0);
  });

  it("adds 20% of range and floors to precision", async () => {
    const el = await fixture<any>(html`<segment-gauge-editor></segment-gauge-editor>`);
    el.setConfig({ entity: "sensor.test", data: { min: 0, max: 1.3, precision: 1 }, levels: [] } as any);
    (el as any)._addStop(); // 0
    (el as any)._addStop(); // 0.2
    (el as any)._addStop(); // 0.4
    const stops = (el as any)._stops();
    expect(stops.length).toBe(3);
    expect(stops[0].value).toBe(0);
    expect(stops[1].value).toBe(0.2);
    expect(stops[2].value).toBe(0.4);
  });
});
