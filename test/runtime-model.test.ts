import { describe, expect, it } from "vitest";
import type { SegmentGaugeConfig } from "../src/ha-types";
import { normalizeRuntimeConfig } from "../src/runtime/normalize";
import { deriveRuntimeModel } from "../src/runtime/model";

function derive(
  config: SegmentGaugeConfig,
  options?: Partial<{
    valueNum: number | null;
    unavailable: boolean;
    trackWidth: number;
    measuredInsetLeft: number;
    measuredInsetRight: number;
    baseSpacing: number;
    gaugeEdgeInsetPx: number;
  }>
) {
  return deriveRuntimeModel({
    config: normalizeRuntimeConfig(config),
    valueNum: options?.valueNum ?? 50,
    unavailable: options?.unavailable ?? false,
    trackWidth: options?.trackWidth ?? 400,
    measuredInsetLeft: options?.measuredInsetLeft ?? 0,
    measuredInsetRight: options?.measuredInsetRight ?? 0,
    baseSpacing: options?.baseSpacing ?? 10,
    gaugeEdgeInsetPx: options?.gaugeEdgeInsetPx ?? 10,
  });
}

describe("runtime derived model", () => {
  it("derives a stable model for minimal config without mutating input", () => {
    const input: SegmentGaugeConfig = {
      type: "custom:segment-gauge",
      entity: "sensor.x",
    };
    const before = JSON.stringify(input);

    const model = derive(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(model.layoutClass).toBe("inline");
    expect(model.gaugeAlignment).toBe("center_labels");
    expect(model.min).toBe(0);
    expect(model.max).toBe(100);
    expect(model.pointerLeft).toBe(50);
    expect(model.hideBar).toBe(false);
    expect(model.styleVars["--mb-content-gap"]).toBe("10px");
  });

  it("derives complex segmented geometry and scale model", () => {
    const model = derive(
      {
        type: "custom:segment-gauge",
        entity: "sensor.x",
        layout: { mode: "vertical", gauge_alignment: "center_labels" },
        data: { min: 0, max: 100 },
        levels: [
          { value: 0, color: "#ff0000" },
          { value: 25, color: "#ff8800" },
          { value: 50, color: "#ffff00" },
          { value: 75, color: "#88ff00" },
          { value: 100, color: "#00ff00" },
        ],
        bar: {
          color_mode: "gradient",
          segments: { mode: "level", segments_per_level: 3, gap: 2 },
          snapping: { fill: "nearest", color: "level" },
        },
        scale: {
          show: true,
          placement: "below",
          spacing: "levels",
          ticks: { major_count: 8, minor_per_major: 2 },
          labels: { show: true },
        },
      },
      { valueNum: 63 }
    );

    expect(model.layoutClass).toBe("below");
    expect(model.segmentMode).toBe("level");
    expect(model.gradStops.length).toBe(5);
    expect(model.segmentBoundaries.length).toBeGreaterThan(10);
    expect(model.levelGaps.length).toBeGreaterThan(0);
    expect(model.scaleShow).toBe(true);
    expect(model.scaleLayout.ticks.length).toBeGreaterThan(8);
  });

  it("respects alignment policy when deriving label insets", () => {
    const base: SegmentGaugeConfig = {
      type: "custom:segment-gauge",
      entity: "sensor.x",
      layout: { mode: "stacked", gauge_alignment: "center_bar" },
      scale: { show: true, labels: { show: true } },
    };

    const centered = derive(base, {
      measuredInsetLeft: 6,
      measuredInsetRight: 18,
    });
    expect(centered.insetLeft).toBe(18);
    expect(centered.insetRight).toBe(18);

    const labelAligned = derive(
      {
        ...base,
        layout: { ...(base.layout ?? {}), gauge_alignment: "center_labels" },
      },
      {
        measuredInsetLeft: 6,
        measuredInsetRight: 18,
      }
    );
    expect(labelAligned.insetLeft).toBe(6);
    expect(labelAligned.insetRight).toBe(18);
  });

  it("derives snapping and current-segment fill behavior for fixed segments", () => {
    const model = derive(
      {
        type: "custom:segment-gauge",
        entity: "sensor.x",
        data: { min: 0, max: 100 },
        levels: [
          { value: 0, color: "#0044ff" },
          { value: 50, color: "#22ccff" },
          { value: 100, color: "#00ff44" },
        ],
        bar: {
          fill_mode: "current_segment",
          segments: { mode: "fixed", width: 40, gap: 4 },
          snapping: { fill: "up", color: "midpoint" },
        },
      },
      { valueNum: 37, trackWidth: 400 }
    );

    expect(model.segmentMode).toBe("fixed");
    expect(model.fillQuant).toBe("up");
    expect(model.colorQuant).toBe("midpoint");
    expect(model.fillWindow.start).toBe(30);
    expect(model.fillWindow.end).toBe(40);
    expect(model.fixedGapRects.length).toBeGreaterThan(0);
  });

  it("is deterministic for identical normalized inputs", () => {
    const config: SegmentGaugeConfig = normalizeRuntimeConfig({
      type: "custom:segment-gauge",
      entity: "sensor.x",
      layout: { mode: "vertical", gauge_alignment: "center_bar" },
      data: { min: -10, max: 45, precision: 1 },
      levels: [
        { value: -10, color: "#0006f7" },
        { value: 0, color: "#003ef7" },
        { value: 10, color: "#00f7bf" },
        { value: 20, color: "#f76900" },
      ],
      bar: {
        color_mode: "gradient",
        segments: { mode: "level", segments_per_level: 2, gap: 2 },
        snapping: { fill: "nearest", color: "level" },
      },
      scale: {
        show: true,
        placement: "center",
        spacing: "levels",
        ticks: { major_count: 8, minor_per_major: 1, color_mode: "contrast" },
      },
    });

    const input = {
      config,
      valueNum: 12,
      unavailable: false,
      trackWidth: 420,
      measuredInsetLeft: 7,
      measuredInsetRight: 11,
      baseSpacing: 10,
      gaugeEdgeInsetPx: 10,
    } as const;

    const first = deriveRuntimeModel({ ...input });
    const second = deriveRuntimeModel({ ...input });
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});
