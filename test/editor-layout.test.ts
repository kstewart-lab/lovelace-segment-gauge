import { describe, it, expect } from "vitest";
import { fixture, html } from "@open-wc/testing";
import "../src/editor";

describe("segment-gauge editor layout select", () => {
  it("normalizes canonical layout values when setConfig is called", async () => {
    const el = await fixture<any>(html`<segment-gauge-editor></segment-gauge-editor>`);
    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      layout: { mode: "vertical" },
    } as any;
    el.setConfig(cfg);
    await el.updateComplete;
    expect((el as any)._config.layout.mode).toBe("vertical");
  });

  it("updates config when layout select changes", async () => {
    const el = await fixture<any>(html`<segment-gauge-editor></segment-gauge-editor>`);
    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      layout: { mode: "horizontal" },
    } as any;
    el.setConfig(cfg);
    await el.updateComplete;
    (el as any)._update({ layout: { mode: "vertical" } });
    expect((el as any)._config.layout.mode).toBe("vertical");
  });

  it("normalizes horizontal/stacked canonical layouts", async () => {
    const el = await fixture<any>(html`<segment-gauge-editor></segment-gauge-editor>`);
    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      layout: { mode: "horizontal" },
    } as any;
    el.setConfig(cfg);
    await el.updateComplete;
    expect((el as any)._config.layout.mode).toBe("horizontal");
    (el as any)._update({ layout: { mode: "stacked" } });
    expect((el as any)._config.layout.mode).toBe("stacked");
  });

  it("keeps canonical scale spacing values", async () => {
    const el = await fixture<any>(html`<segment-gauge-editor></segment-gauge-editor>`);
    const cfg = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      scale: { spacing: "even" },
    } as any;
    el.setConfig(cfg);
    await el.updateComplete;
    expect((el as any)._config.scale.spacing).toBe("even");
  });

  it("keeps config key ordering aligned with editor section order", async () => {
    const el = await fixture<any>(html`<segment-gauge-editor></segment-gauge-editor>`);
    el.setConfig({
      type: "custom:segment-gauge",
      entity: "sensor.test",
      scale: { show: true } as any,
      bar: { show: true } as any,
      content: { show_icon: true } as any,
      layout: { mode: "vertical" } as any,
      style: { card: "default" } as any,
      data: { min: 0, max: 100 } as any,
    } as any);
    await el.updateComplete;

    const keys = Object.keys((el as any)._config);
    expect(keys.slice(0, 8)).toEqual(["type", "entity", "content", "style", "layout", "data", "bar", "scale"]);

    (el as any)._update({ pointer: { show: true } });
    const keysAfter = Object.keys((el as any)._config);
    expect(keysAfter.slice(0, 9)).toEqual(["type", "entity", "content", "style", "layout", "data", "bar", "pointer", "scale"]);
  });

  it("disables gauge alignment in horizontal layout and preserves the stored value", async () => {
    const el = await fixture<any>(html`<segment-gauge-editor></segment-gauge-editor>`);
    el.setConfig({
      type: "custom:segment-gauge",
      entity: "sensor.test",
      layout: { mode: "horizontal", gauge_alignment: "center_bar" },
    } as any);
    el.hass = { states: {}, localize: (key: string) => key } as any;
    await el.updateComplete;

    const gaugeAlignmentSelect = Array.from(el.shadowRoot?.querySelectorAll("ha-select") ?? []).find(
      (s: any) => s.disabled && s.value === "center_labels"
    ) as any;
    expect(gaugeAlignmentSelect).toBeTruthy();
    expect(gaugeAlignmentSelect.disabled).toBe(true);
    expect(gaugeAlignmentSelect.value).toBe("center_labels");
    expect((el as any)._config.layout.gauge_alignment).toBe("center_bar");

    (el as any)._update({ layout: { mode: "vertical" } });
    await el.updateComplete;

    const gaugeAlignmentSelectAfter = Array.from(el.shadowRoot?.querySelectorAll("ha-select") ?? []).find(
      (s: any) => !s.disabled && s.value === "center_bar"
    ) as any;
    expect(gaugeAlignmentSelectAfter.disabled).toBe(false);
    expect(gaugeAlignmentSelectAfter.value).toBe("center_bar");
    expect((el as any)._config.layout.gauge_alignment).toBe("center_bar");
  });

  it("latches gauge subsection expansion state after first open", async () => {
    const el = await fixture<any>(html`<segment-gauge-editor></segment-gauge-editor>`);
    el.setConfig({
      type: "custom:segment-gauge",
      entity: "sensor.test",
      bar: { height: 12 }, // non-default => Bar panel starts expanded
    } as any);
    await el.updateComplete;

    expect((el as any)._barExpanded).toBe(true);

    // Revert to default bar value via editor update; panel should not auto-collapse.
    (el as any)._update({ bar: { height: 8 } });
    await el.updateComplete;
    expect((el as any)._barExpanded).toBe(true);
  });

  it("initially collapses default gauge subsections on first open", async () => {
    const el = await fixture<any>(html`<segment-gauge-editor></segment-gauge-editor>`);
    el.setConfig({
      type: "custom:segment-gauge",
      entity: "sensor.test",
    } as any);
    await el.updateComplete;

    expect((el as any)._barExpanded).toBe(false);
    expect((el as any)._pointerExpanded).toBe(false);
    expect((el as any)._scaleExpanded).toBe(false);
  });

});
