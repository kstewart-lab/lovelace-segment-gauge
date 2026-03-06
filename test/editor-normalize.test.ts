import { describe, it, expect } from "vitest";
import type { SegmentGaugeConfig } from "../src/ha-types";
import { DEFAULTS } from "../src/shared";
import { normalizeEditorConfig } from "../src/editor/normalize";

describe("editor config normalization", () => {
  it("normalizes canonical editor values and does not map removed legacy aliases", () => {
    const input: SegmentGaugeConfig = {
      type: "custom:segment-gauge",
      entity: "sensor.x",
      bar: {
        color_mode: "discrete" as any,
        fill_mode: "current" as any,
        segments: {
          mode: "level",
          segments_per_level: 2,
          subdivisions_per_level: 9,
        } as any,
        snapping: {
          fill: "round" as any,
          color: "average" as any,
        },
      },
      pointer: {
        color_mode: "interpolated" as any,
      },
      scale: {
        gap: 12,
        placement: "bottom",
        spacing: "range" as any,
        ticks: { color_mode: "interpolated" as any },
        labels: { color_mode: "discrete" as any },
      } as any,
      content: {
        icon_color: {
          mode: "stop" as any,
        },
      },
    };

    const normalized = normalizeEditorConfig(input);

    expect(normalized.bar?.color_mode).toBe(DEFAULTS.bar.color_mode);
    expect((normalized.bar as any)?.fill_mode).toBe((DEFAULTS.bar as any).fill_mode);
    expect((normalized.bar?.segments as any)?.segments_per_level).toBe(2);
    expect((normalized.bar?.segments as any)?.subdivisions_per_level).toBeUndefined();
    expect(normalized.bar?.snapping?.fill).toBe(DEFAULTS.bar.snapping.fill);
    expect(normalized.bar?.snapping?.color).toBe(DEFAULTS.bar.snapping.color);
    expect(normalized.pointer?.color_mode).toBe(DEFAULTS.pointer.color_mode);
    expect(normalized.scale?.placement).toBe("bottom");
    expect(normalized.scale?.spacing).toBe(DEFAULTS.scale.spacing);
    expect((normalized.scale as any)?.gap).toBeUndefined();
    expect(normalized.scale?.ticks?.color_mode).toBe(DEFAULTS.scale.ticks.color_mode);
    expect(normalized.scale?.labels?.color_mode).toBe(DEFAULTS.scale.labels.color_mode);
    expect(normalized.content?.icon_color?.mode).toBe(DEFAULTS.content.icon_color.mode);
  });
});
