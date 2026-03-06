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

const withMockTrackWidth = async (width: number, fn: () => Promise<void>) => {
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
          right: width,
          bottom: 10,
          width,
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
    await fn();
  } finally {
    Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
      configurable: true,
      value: original,
    });
  }
};

const majorTickStyleAt = (el: HTMLElement, posPct: number) =>
  Array.from(el.shadowRoot?.querySelectorAll(".scale .tick.major") ?? [])
    .map((t) => t.getAttribute("style") ?? "")
    .find((style) => style.includes(`left:${posPct}%`)) ?? "";

const wrapVarPx = (el: HTMLElement, name: string): number => {
  const style = el.shadowRoot?.querySelector(".wrap")?.getAttribute("style") ?? "";
  const m = style.match(new RegExp(`${name}:(-?\\d+(?:\\.\\d+)?)px`));
  return m ? Number(m[1]) : NaN;
};

describe("rendering integration", () => {
  it("adds debug layout overlays when style.debug_layout is enabled", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      style: { debug_layout: true },
      levels: [{ value: 0, color: "#03a9f4" }],
    } as any;

    el.setConfig(cfg);
    el.hass = makeHass("sensor.test", "40");
    await el.updateComplete;

    expect(el.shadowRoot?.querySelector(".wrap.debug-layout")).toBeTruthy();
    const frameStyle = el.shadowRoot?.querySelector("ha-card > div")?.getAttribute("style") ?? "";
    expect(frameStyle).toContain("outline:");
  });

  it("renders the final major tick at 100% when scale spacing is levels", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      data: { min: 0, max: 100, precision: 0 },
      pointer: { show: false },
      scale: {
        show: true,
        spacing: "levels",
        placement: "below",
        labels: { show: false },
        ticks: { major_count: 2, minor_per_major: 0 },
      },
      levels: [
        { value: 25, color: "#00ff00" },
        { value: 75, color: "#ff0000" },
      ],
    } as any;

    el.setConfig(cfg);
    el.hass = makeHass("sensor.test", "50");
    await el.updateComplete;

    const majorTicks = Array.from(el.shadowRoot?.querySelectorAll(".scale .tick.major") ?? []);
    expect(majorTicks.length).toBe(4); // min, 25, 75, max
    expect(majorTicks.some((t) => (t.getAttribute("style") ?? "").includes("left:100%"))).toBe(true);
  });

  it("supports center-by-bar and center-by-labels gauge alignment policies", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
    const baseCfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      pointer: { show: false },
      data: { min: 0, max: 1000, precision: 0 },
      scale: {
        show: true,
        placement: "below",
        spacing: "even",
        labels: { show: true },
        ticks: { major_count: 3, minor_per_major: 0 },
      },
      levels: [{ value: 0, color: "#03a9f4" }],
    } as any;

    el.setConfig({ ...baseCfg, layout: { mode: "vertical", gauge_alignment: "center_labels" } });
    el.hass = makeHass("sensor.test", "100");
    await el.updateComplete;

    (el as any)._insetLeft = 12;
    (el as any)._insetRight = 28;
    el.requestUpdate();
    await el.updateComplete;

    const wrapStyleLabels = el.shadowRoot?.querySelector(".wrap")?.getAttribute("style") ?? "";
    expect(wrapStyleLabels).toContain("--mb-inset-left:12px");
    expect(wrapStyleLabels).toContain("--mb-inset-right:28px");
    expect(Array.from(el.shadowRoot?.querySelectorAll(".scale .tick.major") ?? []).some((t) => (t.getAttribute("style") ?? "").includes("left:100%"))).toBe(true);

    el.setConfig({ ...baseCfg, layout: { mode: "vertical", gauge_alignment: "center_bar" } });
    el.hass = makeHass("sensor.test", "100");
    await el.updateComplete;
    (el as any)._insetLeft = 12;
    (el as any)._insetRight = 28;
    el.requestUpdate();
    await el.updateComplete;

    const wrapStyleBar = el.shadowRoot?.querySelector(".wrap")?.getAttribute("style") ?? "";
    expect(wrapStyleBar).toContain("--mb-inset-left:28px");
    expect(wrapStyleBar).toContain("--mb-inset-right:28px");
  });

  it("forces center-by-labels gauge alignment when layout mode is horizontal", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      pointer: { show: false },
      data: { min: 0, max: 1000, precision: 0 },
      layout: { mode: "horizontal", gauge_alignment: "center_bar" },
      scale: {
        show: true,
        placement: "below",
        spacing: "even",
        labels: { show: true },
        ticks: { major_count: 3, minor_per_major: 0 },
      },
      levels: [{ value: 0, color: "#03a9f4" }],
    } as any;

    el.setConfig(cfg);
    el.hass = makeHass("sensor.test", "100");
    await el.updateComplete;

    (el as any)._insetLeft = 12;
    (el as any)._insetRight = 28;
    el.requestUpdate();
    await el.updateComplete;

    const wrapStyle = el.shadowRoot?.querySelector(".wrap")?.getAttribute("style") ?? "";
    expect(wrapStyle).toContain("--mb-inset-left:12px");
    expect(wrapStyle).toContain("--mb-inset-right:28px");
  });

  it("uses a single-column inline layout when icon, name, and state are hidden", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      layout: { mode: "horizontal" },
      content: { show_icon: false, show_name: false, show_state: false },
      pointer: { show: false },
      scale: { show: false },
      levels: [{ value: 0, color: "#03a9f4" }],
    } as any;

    el.setConfig(cfg);
    el.hass = makeHass("sensor.test", "40");
    await el.updateComplete;

    const wrap = el.shadowRoot?.querySelector(".wrap.inline.inline-bar-only");
    expect(wrap).toBeTruthy();
    expect(el.shadowRoot?.querySelector(".icon")).toBeNull();
    expect(el.shadowRoot?.querySelector(".text")).toBeNull();
    expect(el.shadowRoot?.querySelector(".bar")).toBeTruthy();
  });

  it("keeps bar and scale anchoring stable when pointer vertical offset changes", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
    const baseCfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      data: { min: 0, max: 100, precision: 0 },
      bar: { show: true, height: 8, segments: { mode: "off" } },
      pointer: { show: true, size: 20, angle: 60, y_offset: 0, color_mode: "custom", color: "#ffffff" },
      scale: {
        show: true,
        placement: "below",
        labels: { show: false },
        ticks: { major_count: 5, minor_per_major: 0 },
      },
      levels: [{ value: 0, color: "#03a9f4" }],
    } as any;

    el.setConfig(baseCfg);
    el.hass = makeHass("sensor.test", "40");
    await el.updateComplete;

    const padTopAtZero = wrapVarPx(el, "--mb-pointer-pad-top");
    const scaleStyleAtZero = el.shadowRoot?.querySelector(".scale")?.getAttribute("style") ?? "";

    el.setConfig({ ...baseCfg, pointer: { ...baseCfg.pointer, y_offset: 18 } });
    el.hass = makeHass("sensor.test", "40");
    await el.updateComplete;

    const padTopAtOffset = wrapVarPx(el, "--mb-pointer-pad-top");
    const scaleStyleAtOffset = el.shadowRoot?.querySelector(".scale")?.getAttribute("style") ?? "";

    expect(padTopAtOffset).toBe(padTopAtZero);
    expect(scaleStyleAtOffset).toBe(scaleStyleAtZero);
  });

  it("uses fixed below-scale spacing and ignores removed scale.gap field", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      scale: {
        show: true,
        placement: "below",
        spacing: "even",
        gap: 99, // legacy field; ignored
        labels: { show: false },
        ticks: { major_count: 5, minor_per_major: 0 },
      },
      pointer: { show: false },
      levels: [{ value: 0, color: "#03a9f4" }],
    } as any;

    el.setConfig(cfg);
    el.hass = makeHass("sensor.test", "40");
    await el.updateComplete;

    const barStackStyle = el.shadowRoot?.querySelector(".bar-stack")?.getAttribute("style") ?? "";
    expect(barStackStyle).toContain("--mb-scale-gap:4px");
  });

  it("applies per-segment color quantization to the dimmed track layer in fixed mode", async () => {
    await withMockTrackWidth(100, async () => {
      const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
      const cfg = {
        type: "custom:segment-gauge",
        entity: "sensor.test",
        data: { min: 0, max: 100, precision: 0 },
        bar: {
          show: true,
          color_mode: "gradient",
          track: { intensity: 100 },
          segments: { mode: "fixed", width: 10, gap: 0 },
          snapping: { fill: "off", color: "high" },
        },
        pointer: { show: false },
        levels: [
          { value: 0, color: "#ff0000" },
          { value: 100, color: "#00ff00" },
        ],
      } as any;

      el.setConfig(cfg);
      el.hass = makeHass("sensor.test", "20");
      await el.updateComplete;
      await el.updateComplete; // width sync triggers a follow-up render

      const svg = el.shadowRoot?.querySelector("svg.bar-svg");
      expect(svg).toBeTruthy();

      const trackTintGroup = svg?.querySelector('g[clip-path] > g[opacity]');
      expect(trackTintGroup).toBeTruthy();

      const fills = Array.from(trackTintGroup?.querySelectorAll("rect[fill]") ?? [])
        .map((r) => r.getAttribute("fill"))
        .filter((fill): fill is string => !!fill && fill !== "none" && !fill.startsWith("url("));

      // Segment color snapping should produce multiple solid rects with varying colors,
      // not a single gradient paint on the dimmed track layer.
      expect(fills.length).toBeGreaterThan(3);
      expect(new Set(fills).size).toBeGreaterThan(2);
    });
  });

  it("uses leftmost level color on equal-overlap ties in level color snapping", async () => {
    await withMockTrackWidth(100, async () => {
      const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
      const cfg = {
        type: "custom:segment-gauge",
        entity: "sensor.test",
        data: { min: 0, max: 100, precision: 0 },
        bar: {
          show: true,
          color_mode: "stepped",
          track: { intensity: 100 },
          segments: { mode: "fixed", width: 66, gap: 0 },
          snapping: { fill: "off", color: "level" },
        },
        pointer: { show: false },
        levels: [
          { value: 0, color: "#ff0000" },
          { value: 33, color: "#00ff00" },
          { value: 66, color: "#0000ff" },
          { value: 100, color: "#ffffff" },
        ],
      } as any;

      el.setConfig(cfg);
      el.hass = makeHass("sensor.test", "100");
      await el.updateComplete;
      await el.updateComplete;

      const svg = el.shadowRoot?.querySelector("svg.bar-svg");
      const trackTintGroup = svg?.querySelector('g[clip-path] > g[opacity]');
      const fills = Array.from(trackTintGroup?.querySelectorAll("rect[fill]") ?? [])
        .map((r) => (r.getAttribute("fill") ?? "").toLowerCase())
        .filter((fill) => fill.startsWith("#"));

      // First segment covers 0..66 and ties equally between [0..33] and [33..66].
      // Level snapping must pick the leftmost overlap -> red.
      expect(fills[0]).toBe("#ff0000");
    });
  });

  it("supports low/high/midpoint color snapping in fixed segment mode", async () => {
    await withMockTrackWidth(100, async () => {
      const makeCfg = (color: "low" | "high" | "midpoint") =>
        ({
          type: "custom:segment-gauge",
          entity: "sensor.test",
          data: { min: 0, max: 100, precision: 0 },
          bar: {
            show: true,
            color_mode: "gradient",
            track: { intensity: 100 },
            segments: { mode: "fixed", width: 50, gap: 0 },
            snapping: { fill: "off", color },
          },
          pointer: { show: false },
          levels: [
            { value: 0, color: "#ff0000" },
            { value: 100, color: "#00ff00" },
          ],
        }) as any;

      const segmentColorAtStart = async (color: "low" | "high" | "midpoint") => {
        const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
        el.setConfig(makeCfg(color));
        el.hass = makeHass("sensor.test", "100");
        await el.updateComplete;
        await el.updateComplete;
        const svg = el.shadowRoot?.querySelector("svg.bar-svg");
        const trackTintGroup = svg?.querySelector('g[clip-path] > g[opacity]');
        const fill = Array.from(trackTintGroup?.querySelectorAll("rect[fill]") ?? [])
          .map((r) => ({
            x: r.getAttribute("x"),
            fill: (r.getAttribute("fill") ?? "").toLowerCase(),
          }))
          .find((r) => r.x === "0%" && r.fill.startsWith("#"));
        return fill?.fill ?? "";
      };

      const low = await segmentColorAtStart("low");
      const high = await segmentColorAtStart("high");
      const midpoint = await segmentColorAtStart("midpoint");

      expect(low).toBe("#ff0000");
      expect(high).toBe("#808000");
      expect(midpoint).toBe("#bf4000");
      expect(midpoint).not.toBe(low);
      expect(midpoint).not.toBe(high);
    });
  });

  it("uses card background contrast when center ticks are offset below the bar", async () => {
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
        height: 12,
        track: { background: "var(--primary-color)", intensity: 0 },
        segments: { mode: "off" },
        snapping: { fill: "off", color: "off" },
      },
      pointer: { show: false },
      scale: {
        show: true,
        placement: "center",
        y_offset: 30,
        labels: { show: false },
        ticks: { major_count: 5, minor_per_major: 0, color_mode: "contrast", height_minor: 8, height_major: 10 },
      },
      levels: [
        { value: 0, color: "#ff0000" },
        { value: 100, color: "#00ff00" },
      ],
    } as any;

    el.setConfig(cfg);
    el.hass = makeHass("sensor.test", "10");
    await el.updateComplete;

    expect(majorTickStyleAt(el, 25)).toContain("background:#ffffff");
  });

  it("uses card background contrast when top ticks are offset above the bar", async () => {
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
        height: 14,
        track: { background: "var(--primary-color)", intensity: 0 },
        segments: { mode: "off" },
        snapping: { fill: "off", color: "off" },
      },
      pointer: { show: false },
      scale: {
        show: true,
        placement: "top",
        y_offset: -20,
        labels: { show: false },
        ticks: { major_count: 5, minor_per_major: 0, color_mode: "contrast", height_minor: 6, height_major: 8 },
      },
      levels: [
        { value: 0, color: "#ff0000" },
        { value: 100, color: "#00ff00" },
      ],
    } as any;

    el.setConfig(cfg);
    el.hass = makeHass("sensor.test", "10");
    await el.updateComplete;

    expect(majorTickStyleAt(el, 25)).toContain("background:#ffffff");
  });

  it("uses dark contrast ticks on light card backgrounds", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);
    el.style.setProperty("--ha-card-background", "#ffffff");
    el.style.setProperty("--card-background-color", "#ffffff");
    el.style.setProperty("--primary-color", "#ffffff");

    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      bar: {
        show: true,
        height: 14,
        track: { background: "var(--primary-color)", intensity: 0 },
        segments: { mode: "off" },
      },
      pointer: { show: false },
      scale: {
        show: true,
        placement: "top",
        y_offset: -20,
        labels: { show: false },
        ticks: { major_count: 5, minor_per_major: 0, color_mode: "contrast", height_minor: 6, height_major: 8 },
      },
      levels: [
        { value: 0, color: "#ff0000" },
        { value: 100, color: "#00ff00" },
      ],
    } as any;

    el.setConfig(cfg);
    el.hass = makeHass("sensor.test", "10");
    await el.updateComplete;

    expect(majorTickStyleAt(el, 25)).toContain("background:#000000");
  });

  it("keeps minor and major tick bottoms aligned in bottom placement when bar is hidden", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);

    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      bar: { show: false },
      pointer: { show: false },
      scale: {
        show: true,
        placement: "bottom",
        labels: { show: false },
        ticks: { major_count: 5, minor_per_major: 2, height_minor: 6, height_major: 14 },
      },
      levels: [{ value: 0, color: "#03a9f4" }],
    } as any;

    el.setConfig(cfg);
    el.hass = makeHass("sensor.test", "40");
    await el.updateComplete;

    const scaleEl = el.shadowRoot?.querySelector(".scale.bottom") as HTMLElement | null;
    expect(scaleEl).toBeTruthy();

    const style = scaleEl?.getAttribute("style") ?? "";
    const pxVar = (name: string) => {
      const m = style.match(new RegExp(`${name}:(-?\\d+(?:\\.\\d+)?)px`));
      return m ? Number(m[1]) : NaN;
    };

    const tickTop = pxVar("--mb-tick-top");
    const tickHeight = pxVar("--mb-tick-height");
    const tickTopMajor = pxVar("--mb-tick-top-major");
    const tickHeightMajor = pxVar("--mb-tick-height-major");

    expect(Number.isFinite(tickTop)).toBe(true);
    expect(Number.isFinite(tickHeight)).toBe(true);
    expect(Number.isFinite(tickTopMajor)).toBe(true);
    expect(Number.isFinite(tickHeightMajor)).toBe(true);

    expect(tickTop + tickHeight).toBe(tickTopMajor + tickHeightMajor);
  });

  it("keeps alignment behavior stable when label insets are asymmetric", async () => {
    const el = await fixture<any>(html`<segment-gauge></segment-gauge>`);

    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      layout: { mode: "vertical", gauge_alignment: "center_labels" },
      data: { min: -1000, max: 99999, precision: 0 },
      bar: { show: true, height: 8, segments: { mode: "off" } },
      pointer: { show: false },
      scale: {
        show: true,
        placement: "below",
        spacing: "even",
        labels: { show: true, precision: 0, size: 12 },
        ticks: { major_count: 5, minor_per_major: 0 },
      },
      levels: [{ value: -1000, color: "#03a9f4" }],
    } as any;

    el.setConfig(cfg);
    el.hass = makeHass("sensor.test", "40");
    await el.updateComplete;

    // Simulate measured long-label insets (left < right).
    (el as any)._insetLeft = 49;
    (el as any)._insetRight = 79;
    el.requestUpdate();
    await el.updateComplete;

    const wrapLabels = el.shadowRoot?.querySelector(".wrap")?.getAttribute("style") ?? "";
    expect(wrapLabels).toContain("--mb-inset-left:49px");
    expect(wrapLabels).toContain("--mb-inset-right:79px");

    el.setConfig({
      ...cfg,
      layout: { ...cfg.layout, gauge_alignment: "center_bar" },
    });
    el.hass = makeHass("sensor.test", "40");
    await el.updateComplete;
    (el as any)._insetLeft = 49;
    (el as any)._insetRight = 79;
    el.requestUpdate();
    await el.updateComplete;

    const wrapBar = el.shadowRoot?.querySelector(".wrap")?.getAttribute("style") ?? "";
    expect(wrapBar).toContain("--mb-inset-left:79px");
    expect(wrapBar).toContain("--mb-inset-right:79px");
  });
});
