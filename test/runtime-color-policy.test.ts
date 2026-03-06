import { describe, expect, it } from "vitest";
import type { SegmentGaugeConfig } from "../src/ha-types";
import { normalizeRuntimeConfig } from "../src/runtime/normalize";
import {
  buildQuantizedBarColorRects,
  createScaleColorResolvers,
  deriveIconPolicy,
  deriveRuntimeModel,
  type Rgb,
  colorForMode,
} from "../src/runtime/model";

describe("runtime color policy", () => {
  it("applies quantized bar color policy for low/high/midpoint and level tie-breaking", () => {
    const numericColor = (value: number) => `v${Math.round(value)}`;
    const low = buildQuantizedBarColorRects({
      colorQuant: "low",
      segmentMode: "fixed",
      segmentBoundaries: [40, 60],
      min: 0,
      max: 100,
      levels: [
        { value: 0, color: "#ff0000" },
        { value: 50, color: "#00ff00" },
      ],
      colorAtValue: numericColor,
    });
    const high = buildQuantizedBarColorRects({
      colorQuant: "high",
      segmentMode: "fixed",
      segmentBoundaries: [40, 60],
      min: 0,
      max: 100,
      levels: [
        { value: 0, color: "#ff0000" },
        { value: 50, color: "#00ff00" },
      ],
      colorAtValue: numericColor,
    });
    const midpoint = buildQuantizedBarColorRects({
      colorQuant: "midpoint",
      segmentMode: "fixed",
      segmentBoundaries: [40, 60],
      min: 0,
      max: 100,
      levels: [
        { value: 0, color: "#ff0000" },
        { value: 50, color: "#00ff00" },
      ],
      colorAtValue: numericColor,
    });
    const level = buildQuantizedBarColorRects({
      colorQuant: "level",
      segmentMode: "fixed",
      segmentBoundaries: [40, 60],
      min: 0,
      max: 100,
      levels: [
        { value: 0, color: "#aa0000" },
        { value: 50, color: "#00aa00" },
      ],
      colorAtValue: numericColor,
    });

    expect(low?.[0].color).toBe("v40");
    expect(high?.[0].color).toBe("v60");
    expect(midpoint?.[0].color).toBe("v50");
    // Equal overlap between [0,50] and [50,100] chooses the left-most level color.
    expect(level?.[0].color).toBe("#aa0000");
  });

  it("resolves contrast tick/label colors from derived policy inputs", () => {
    const darkBg: Rgb = { r: 0, g: 0, b: 0 };
    const resolvers = createScaleColorResolvers({
      tickMode: "contrast",
      labelMode: "custom",
      tickCustom: undefined,
      labelCustom: "#778899",
      levels: [
        { value: 0, color: "#ff0000" },
        { value: 100, color: "#00ff00" },
      ],
      min: 0,
      max: 100,
      currentColor: "#00ff00",
      fillWindow: { start: 0, end: 50 },
      scaleLayout: {
        ticks: [],
        style: "",
        className: "",
        height: 20,
        mode: "center",
        labelsOn: true,
        tickTop: 12,
        tickHeight: 4,
        tickTopMajor: 12,
        tickHeightMajor: 4,
      },
      scaleOffset: 0,
      showBar: true,
      barHeight: 10,
      barTop: 0,
      trackIntensity: 0,
      cardBgRgb: darkBg,
      trackBgRgb: darkBg,
      colorAtValue: () => "#ffff00",
    });

    // Tick center is below the bar; contrast uses card background.
    expect(resolvers.tickColorFor(25, 25, false)).toBe("#ffffff");
    expect(resolvers.labelColorFor(25)).toBe("#778899");
  });

  it("resolves icon policy from levels and icon color mode", () => {
    const icon = deriveIconPolicy({
      content: {
        show_icon: true,
        show_name: true,
        show_state: true,
        name: "",
        icon: "mdi:water",
        icon_color: { mode: "level" },
      },
      levels: [
        { value: 0, color: "#ff0000", icon: "mdi:thermometer" },
        { value: 50, color: "#00ff00", icon: "mdi:leaf" },
      ],
      min: 0,
      max: 100,
      valueNum: 60,
    });

    expect(icon.icon).toBe("mdi:leaf");
    expect(icon.source).toBe("level");
    expect(icon.styleColor).toBe("#00ff00");
  });

  it("keeps snapping-sensitive color policy stable on representative derived model", () => {
    const cfg: SegmentGaugeConfig = normalizeRuntimeConfig({
      type: "custom:segment-gauge",
      entity: "sensor.x",
      data: { min: 0, max: 100 },
      levels: [
        { value: 0, color: "#ff0000" },
        { value: 50, color: "#ffff00" },
        { value: 100, color: "#00ff00" },
      ],
      bar: {
        color_mode: "gradient",
        segments: { mode: "fixed", width: 40, gap: 4 },
        snapping: { fill: "nearest", color: "level" },
      },
      scale: {
        show: true,
        placement: "center",
        ticks: { color_mode: "level" },
        labels: { color_mode: "gradient" },
      },
    });

    const model = deriveRuntimeModel({
      config: cfg,
      valueNum: 63,
      unavailable: false,
      trackWidth: 400,
      measuredInsetLeft: 0,
      measuredInsetRight: 0,
      baseSpacing: 10,
      gaugeEdgeInsetPx: 10,
    });
    const colorAtValue = (value: number) =>
      colorForMode(model.colorMode, value, model.levels, model.min, model.max, model.currentColor);

    const rects = buildQuantizedBarColorRects({
      colorQuant: model.colorQuant,
      segmentMode: model.segmentMode,
      segmentBoundaries: model.segmentBoundaries,
      min: model.min,
      max: model.max,
      levels: model.levels,
      colorAtValue,
    });

    expect(rects && rects.length > 0).toBe(true);
    expect(rects?.[0].color).toBe("#ff0000");
  });
});
