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

const nextFrame = async () =>
  new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

const mockRectWidth = (el: Element, width: number) => {
  Object.defineProperty(el, "getBoundingClientRect", {
    configurable: true,
    value: () =>
      ({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: width,
        bottom: 12,
        width,
        height: 12,
        toJSON() {
          return {};
        },
      }) as DOMRect,
  });
};

describe("layout and contrast integration contracts", () => {
  it("remeasures label insets when label size changes (same min/max labels)", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      data: { min: 0, max: 1000, precision: 0 },
      scale: {
        show: true,
        labels: { show: true, size: 12, precision: 0 },
      },
      pointer: { show: false },
      levels: [{ value: 0, color: "#00aaff" }],
    } as any;
    el.setConfig(cfg);
    const hass = makeHass("sensor.test", "400");
    el.hass = hass;
    await el.updateComplete;

    const minMeasure = el.shadowRoot?.querySelector(".measure.min");
    const maxMeasure = el.shadowRoot?.querySelector(".measure.max");
    expect(minMeasure).toBeTruthy();
    expect(maxMeasure).toBeTruthy();

    mockRectWidth(minMeasure!, 20);
    mockRectWidth(maxMeasure!, 40);
    (el as any)._lastMeasureKey = "";
    (el as any)._insetLeft = 0;
    (el as any)._insetRight = 0;
    (el as any)._scheduleInsetMeasure();
    await nextFrame();

    expect((el as any)._insetLeft).toBe(14); // ceil(20/2 + 4)
    expect((el as any)._insetRight).toBe(24); // ceil(40/2 + 4)

    // Same label text ("0" and "1000"), different label typography.
    (el as any)._config.scale.labels.size = 20;
    mockRectWidth(minMeasure!, 36);
    mockRectWidth(maxMeasure!, 72);
    (el as any)._scheduleInsetMeasure();
    await nextFrame();

    // Should remeasure because typography changed, even though min/max text is unchanged.
    expect((el as any)._insetLeft).toBe(22); // ceil(36/2 + 4)
    expect((el as any)._insetRight).toBe(40); // ceil(72/2 + 4)
  });

  it("uses the actual resolved track background for contrast ticks in unfilled area", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
    el.style.setProperty("--ha-card-background", "#000000");
    el.style.setProperty("--card-background-color", "#000000");
    el.style.setProperty("--primary-color", "#ffffff");

    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      data: { min: 0, max: 100, precision: 0 },
      bar: {
        show: true,
        track: { background: "var(--primary-color)", intensity: 0 },
        segments: { mode: "off" },
        snapping: { fill: "off", color: "off" },
      },
      pointer: { show: false },
      scale: {
        show: true,
        placement: "center",
        labels: { show: false },
        ticks: { major_count: 5, minor_per_major: 0, color_mode: "contrast" },
      },
      levels: [
        { value: 0, color: "#ff0000" },
        { value: 100, color: "#00ff00" },
      ],
    } as any;

    el.setConfig(cfg);
    const hass = makeHass("sensor.test", "10");
    el.hass = hass;
    await el.updateComplete;

    const majorTicks = Array.from(el.shadowRoot?.querySelectorAll(".scale .tick.major") ?? []);
    const tick25 = majorTicks.find((t) => t.getAttribute("style")?.includes("left:25%"));
    expect(tick25).toBeTruthy();

    // At 10%, the 25% major tick is in the unfilled region.
    // Track background resolves to white via --primary-color, so contrast should be black.
    expect(tick25?.getAttribute("style")).toContain("background:#000000");
  });
});
