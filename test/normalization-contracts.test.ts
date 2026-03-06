import { describe, expect, it } from "vitest";
import { fixture, html, oneEvent } from "@open-wc/testing";
import type { SegmentGaugeConfig } from "../src/ha-types";
import {
  DEFAULTS,
  mergeDefaults,
  normalizeBarColorMode,
  normalizeBarFillMode,
  normalizeColorSnappingMode,
  normalizeFillSnappingMode,
  normalizeGaugeAlignmentMode,
  normalizeIconColorMode,
  normalizeLayoutMode,
  normalizePointerColorMode,
  normalizeScaleColorMode,
  normalizeScalePlacementMode,
  normalizeTickColorMode,
  normalizeScaleTickSpacingMode,
} from "../src/shared";
import { normalizeRuntimeConfig } from "../src/runtime/normalize";
import { normalizeEditorConfig } from "../src/editor/normalize";
import "../src/editor";

function referenceRuntimeCanonical(config: SegmentGaugeConfig): SegmentGaugeConfig {
  const merged = mergeDefaults(DEFAULTS, config);

  const layoutRaw = merged.layout ?? DEFAULTS.layout;
  merged.layout = {
    ...layoutRaw,
    mode: normalizeLayoutMode(layoutRaw.mode),
    gauge_alignment: normalizeGaugeAlignmentMode(layoutRaw.gauge_alignment),
  };

  if (merged.content?.icon_color) {
    merged.content.icon_color.mode = normalizeIconColorMode(merged.content.icon_color.mode as any);
  }

  if (merged.pointer) {
    merged.pointer.color_mode = normalizePointerColorMode(merged.pointer.color_mode as any);
  }

  if (merged.bar) {
    merged.bar.fill_mode = normalizeBarFillMode((merged.bar as any).fill_mode);
  }

  if (merged.bar?.snapping) {
    merged.bar.snapping.fill = normalizeFillSnappingMode(merged.bar.snapping.fill as any);
    merged.bar.snapping.color = normalizeColorSnappingMode(merged.bar.snapping.color as any);
  }

  const scaleRaw = merged.scale ?? DEFAULTS.scale;
  merged.scale = {
    ...scaleRaw,
    placement: normalizeScalePlacementMode(scaleRaw.placement),
    spacing: normalizeScaleTickSpacingMode(scaleRaw.spacing),
  };

  if (merged.scale?.ticks) {
    merged.scale.ticks.color_mode = normalizeTickColorMode(merged.scale.ticks.color_mode as any);
  }
  if (merged.scale?.labels) {
    merged.scale.labels.color_mode = normalizeScaleColorMode(merged.scale.labels.color_mode as any);
  }

  return merged;
}

function referenceEditorCanonical(config: SegmentGaugeConfig): SegmentGaugeConfig {
  const contentRaw = config.content && typeof config.content === "object" && !Array.isArray(config.content) ? { ...config.content } : {};
  const layoutRaw = config.layout && typeof config.layout === "object" && !Array.isArray(config.layout) ? { ...config.layout } : {};
  const dataRaw = config.data && typeof config.data === "object" && !Array.isArray(config.data) ? { ...config.data } : {};
  const barRaw = config.bar && typeof config.bar === "object" && !Array.isArray(config.bar) ? { ...config.bar } : undefined;
  const pointerRaw =
    config.pointer && typeof config.pointer === "object" && !Array.isArray(config.pointer) ? { ...config.pointer } : undefined;
  const scaleRaw = config.scale && typeof config.scale === "object" && !Array.isArray(config.scale) ? { ...config.scale } : undefined;

  if ((contentRaw as any).icon_color && typeof (contentRaw as any).icon_color === "object") {
    (contentRaw as any).icon_color = { ...(contentRaw as any).icon_color };
    (contentRaw as any).icon_color.mode = normalizeIconColorMode((contentRaw as any).icon_color.mode as any);
  }

  if (barRaw) {
    barRaw.color_mode = normalizeBarColorMode(barRaw.color_mode as any);
    (barRaw as any).fill_mode = normalizeBarFillMode((barRaw as any).fill_mode);
    if (barRaw.segments && typeof barRaw.segments === "object" && !Array.isArray(barRaw.segments)) {
      (barRaw as any).segments = { ...(barRaw.segments as any) };
    }
  }

  if (barRaw?.snapping) {
    barRaw.snapping = {
      ...barRaw.snapping,
      fill: normalizeFillSnappingMode(barRaw.snapping.fill as any),
      color: normalizeColorSnappingMode(barRaw.snapping.color as any),
    };
  }

  if (pointerRaw) {
    pointerRaw.color_mode = normalizePointerColorMode(pointerRaw.color_mode as any);
  }

  const layout = {
    ...layoutRaw,
    mode: normalizeLayoutMode(layoutRaw.mode as any),
    gauge_alignment: normalizeGaugeAlignmentMode(layoutRaw.gauge_alignment as any),
  };

  const ticksRaw =
    scaleRaw?.ticks && typeof scaleRaw.ticks === "object" && !Array.isArray(scaleRaw.ticks)
      ? { ...scaleRaw.ticks, color_mode: normalizeTickColorMode((scaleRaw.ticks as any).color_mode) }
      : scaleRaw?.ticks;
  const labelsRaw =
    scaleRaw?.labels && typeof scaleRaw.labels === "object" && !Array.isArray(scaleRaw.labels)
      ? { ...scaleRaw.labels, color_mode: normalizeScaleColorMode((scaleRaw.labels as any).color_mode) }
      : scaleRaw?.labels;
  const scale = {
    ...(scaleRaw ?? {}),
    placement: normalizeScalePlacementMode(scaleRaw?.placement as any),
    spacing: normalizeScaleTickSpacingMode(scaleRaw?.spacing as any),
    ticks: ticksRaw as any,
    labels: labelsRaw as any,
  };

  return {
    ...config,
    content: contentRaw as any,
    data: dataRaw as any,
    layout,
    bar: barRaw as any,
    pointer: pointerRaw as any,
    scale,
  } as SegmentGaugeConfig;
}

const representativeConfigs: Array<{ name: string; config: SegmentGaugeConfig }> = [
  // minimal
  {
    name: "minimal",
    config: {
      type: "custom:segment-gauge",
      entity: "sensor.minimal",
    },
  },
  // complex segmented
  {
    name: "complex segmented",
    config: {
      type: "custom:segment-gauge",
      entity: "sensor.complex",
      content: {
        show_icon: true,
        show_name: true,
        show_state: true,
        icon_color: { mode: "theme" },
      },
      layout: { mode: "vertical", gauge_alignment: "center_labels", split_pct: 33 },
      data: { min: -10, max: 45, precision: 1 },
      levels: [
        { value: -10, color: "#0006f7" },
        { value: 0, color: "#003ef7" },
        { value: 20, color: "#f76900" },
        { value: 30, color: "#f70000" },
      ],
      bar: {
        show: true,
        height: 14,
        color_mode: "gradient",
        fill_mode: "cumulative",
        segments: { mode: "level", segments_per_level: 3, gap: 2 },
        snapping: { fill: "nearest", color: "level" },
        track: { intensity: 80 },
      },
      pointer: { show: true, size: 20, angle: 45, y_offset: -2, color_mode: "custom", color: "#fff" },
      scale: {
        show: true,
        placement: "below",
        y_offset: 0,
        spacing: "levels",
        ticks: { major_count: 6, minor_per_major: 3, height_major: 10, height_minor: 6, color_mode: "theme" },
        labels: { show: true, precision: 0, color_mode: "theme" },
      },
      actions: {
        tap_action: { action: "none" },
        hold_action: { action: "none" },
        double_tap_action: { action: "none" },
      },
    },
  },
];

describe("normalization contracts", () => {
  it("runtime normalization matches the reference canonical contract", () => {
    for (const { config } of representativeConfigs) {
      const expected = referenceRuntimeCanonical(config);
      const actual = normalizeRuntimeConfig(config);
      expect(actual).toEqual(expected);
    }
  });

  it("editor normalization matches the reference canonical contract", () => {
    for (const { config: cfg } of representativeConfigs) {
      const expected = referenceEditorCanonical(cfg);
      const actual = normalizeEditorConfig(cfg);
      expect(actual).toEqual(expected);
    }
  });

  it("editor emits config-changed with merged config on update", async () => {
    const el = await fixture<any>(html`<segment-gauge-editor></segment-gauge-editor>`);
    el.setConfig({
      type: "custom:segment-gauge",
      entity: "sensor.test",
      layout: { mode: "horizontal", split_pct: 20, gauge_alignment: "center_labels" },
    });
    await el.updateComplete;

    const evPromise = oneEvent(el, "config-changed");
    (el as any)._update({ layout: { split_pct: 35 } });
    const ev = (await evPromise) as CustomEvent;
    const nextConfig = (ev.detail as any)?.config;

    expect(nextConfig.layout.mode).toBe("horizontal");
    expect(nextConfig.layout.split_pct).toBe(35);
    expect(nextConfig.layout.gauge_alignment).toBe("center_labels");
    expect((el as any)._config.layout.split_pct).toBe(35);
  });
});
