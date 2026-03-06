import { describe, it, expect } from "vitest";
import type { SegmentGaugeConfig } from "../src/ha-types";
import { DEFAULTS } from "../src/shared";
import { normalizeRuntimeConfig } from "../src/runtime/normalize";

describe("runtime config normalization", () => {
  it("does not mutate the input config", () => {
    const input: SegmentGaugeConfig = {
      type: "custom:segment-gauge",
      entity: "sensor.x",
      bar: {
        segments: {
          mode: "level",
          segments_per_level: 3,
        },
      },
      scale: {
        placement: "below",
        spacing: "even",
      },
    };

    const before = JSON.stringify(input);
    const normalized = normalizeRuntimeConfig(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(normalized.bar?.segments?.segments_per_level).toBe(3);
  });

  it("accepts canonical values and falls back for invalid values", () => {
    const input: SegmentGaugeConfig = {
      type: "custom:segment-gauge",
      entity: "sensor.x",
      layout: {
        mode: "vertical",
        gauge_alignment: "center_labels",
      },
      content: {
        icon_color: { mode: "level" },
      },
      pointer: {
        color_mode: "interpolated" as any,
      },
      bar: {
        color_mode: "discrete" as any,
        fill_mode: "segment" as any,
        snapping: {
          fill: "ceil" as any,
          color: "segment" as any,
        },
      },
      scale: {
        placement: "center",
        spacing: "levels",
        ticks: {
          color_mode: "interpolated" as any,
        },
        labels: {
          color_mode: "discrete" as any,
        },
      },
    };

    const normalized = normalizeRuntimeConfig(input);

    expect(normalized.layout.mode).toBe("vertical");
    expect(normalized.layout.gauge_alignment).toBe("center_labels");
    expect(normalized.content.icon_color.mode).toBe("level");
    expect(normalized.pointer?.color_mode).toBe(DEFAULTS.pointer.color_mode);
    expect(normalized.bar?.color_mode).toBe(DEFAULTS.bar.color_mode);
    expect((normalized.bar as any).fill_mode).toBe((DEFAULTS.bar as any).fill_mode);
    expect(normalized.bar?.snapping?.fill).toBe(DEFAULTS.bar.snapping.fill);
    expect(normalized.bar?.snapping?.color).toBe(DEFAULTS.bar.snapping.color);
    expect(normalized.scale?.placement).toBe("center");
    expect(normalized.scale?.spacing).toBe("levels");
    expect(normalized.scale?.ticks?.color_mode).toBe(DEFAULTS.scale.ticks.color_mode);
    expect(normalized.scale?.labels?.color_mode).toBe(DEFAULTS.scale.labels.color_mode);
  });

  it("returns canonical enum values and removes non-canonical fields", () => {
    const normalized = normalizeRuntimeConfig({
      type: "custom:segment-gauge",
      entity: "sensor.x",
      content: { icon_color: { mode: "not-a-mode" as any } },
      layout: { mode: "not-a-layout" as any, gauge_alignment: "bad" as any },
      pointer: { color_mode: "bad" as any },
      bar: {
        color_mode: "bad" as any,
        fill_mode: "bad" as any,
        segments: { mode: "bad" as any, subdivisions_per_level: 3 } as any,
        snapping: { fill: "bad" as any, color: "bad" as any },
      },
      scale: {
        placement: "bad" as any,
        spacing: "bad" as any,
        gap: 4 as any,
        ticks: { color_mode: "bad" as any },
        labels: { color_mode: "bad" as any },
      } as any,
    });

    expect(["horizontal", "vertical", "stacked"]).toContain(normalized.layout.mode);
    expect(["center_bar", "center_labels"]).toContain(normalized.layout.gauge_alignment);
    expect(["theme", "state", "level", "custom"]).toContain(normalized.content.icon_color.mode);
    expect(["gradient", "level", "custom"]).toContain(normalized.pointer?.color_mode);
    expect(["stepped", "gradient", "current_level"]).toContain(normalized.bar?.color_mode);
    expect(["cumulative", "current_segment"]).toContain((normalized.bar as any).fill_mode);
    expect(["off", "down", "nearest", "up"]).toContain(normalized.bar?.snapping?.fill);
    expect(["off", "level", "midpoint", "high", "low"]).toContain(normalized.bar?.snapping?.color);
    expect(["below", "bottom", "center", "top"]).toContain(normalized.scale?.placement);
    expect(["even", "levels"]).toContain(normalized.scale?.spacing);
    expect(["theme", "gradient", "stepped", "level", "custom", "contrast"]).toContain(normalized.scale?.ticks?.color_mode);
    expect(["theme", "gradient", "stepped", "level", "custom"]).toContain(normalized.scale?.labels?.color_mode);
    expect((normalized.bar?.segments as any).subdivisions_per_level).toBeUndefined();
    expect((normalized.scale as any).gap).toBeUndefined();
  });
});
