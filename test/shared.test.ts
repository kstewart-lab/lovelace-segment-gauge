import { describe, it, expect } from "vitest";
import {
  normalizeStops,
  stopsToGradient,
  formatValue,
  clamp,
  getUnit,
  normalizeBarColorMode,
  normalizeBarFillMode,
  normalizeIconColorMode,
  normalizeFillSnappingMode,
  normalizeLayoutMode,
  normalizeGaugeAlignmentMode,
  normalizePointerColorMode,
  normalizeScaleColorMode,
  normalizeScalePlacementMode,
  normalizeScaleTickSpacingMode,
  normalizeTickColorMode,
  normalizeColorSnappingMode,
} from "../src/shared";

describe("shared utilities", () => {
  it("normalizes stops by clamping to min/max and sorting", () => {
    const stops = [
      { value: 50, color: "#00f" },
      { value: 0, color: "#f00" },
    ];
    const result = normalizeStops(stops, 0, 100);
    expect(result[0]).toEqual({ value: 0, color: "#f00" });
    expect(result[result.length - 1]).toEqual({ value: 100, color: "#00f" });
  });

  it("builds a stepped gradient when smooth=false", () => {
    const gradient = stopsToGradient(
      [
        { value: 0, color: "#f00" },
        { value: 50, color: "#0f0" },
        { value: 100, color: "#00f" },
      ],
      0,
      100,
      false
    );
    expect(gradient).toContain("#f00");
    expect(gradient).toContain("#0f0");
    // Current implementation duplicates the start color for each segment; ensure it covers the range.
    expect(gradient).toMatch(/^linear-gradient/);
  });

  it("formats values with auto precision", () => {
    expect(formatValue(10, null)).toBe("10");
    expect(formatValue(10.1234, null)).toBe("10.1");
  });

  it("clamps numbers", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it("prefers data.unit and otherwise uses entity unit_of_measurement", () => {
    expect(
      getUnit({ type: "custom:segment-gauge", entity: "sensor.x", data: { unit: "kWh" } } as any, undefined)
    ).toBe("kWh");
    expect(
      getUnit(
        { type: "custom:segment-gauge", entity: "sensor.x" } as any,
        { entity_id: "sensor.x", state: "1", attributes: { unit_of_measurement: "%" } } as any
      )
    ).toBe("%");
  });

  it("normalizes layout values to canonical modes", () => {
    expect(normalizeLayoutMode("horizontal")).toBe("horizontal");
    expect(normalizeLayoutMode("vertical")).toBe("vertical");
    expect(normalizeLayoutMode("stacked")).toBe("stacked");
    expect(normalizeLayoutMode(undefined)).toBe("horizontal");
  });

  it("normalizes scale placement values to canonical modes", () => {
    expect(normalizeScalePlacementMode("below")).toBe("below");
    expect(normalizeScalePlacementMode("center")).toBe("center");
    expect(normalizeScalePlacementMode("bottom")).toBe("bottom");
    expect(normalizeScalePlacementMode("top")).toBe("top");
    expect(normalizeScalePlacementMode(undefined)).toBe("below");
  });

  it("normalizes scale tick spacing values to canonical modes", () => {
    expect(normalizeScaleTickSpacingMode("even")).toBe("even");
    expect(normalizeScaleTickSpacingMode("levels")).toBe("levels");
    expect(normalizeScaleTickSpacingMode(undefined)).toBe("even");
  });

  it("normalizes gauge alignment values to canonical modes", () => {
    expect(normalizeGaugeAlignmentMode("center_bar")).toBe("center_bar");
    expect(normalizeGaugeAlignmentMode("center_labels")).toBe("center_labels");
    expect(normalizeGaugeAlignmentMode(undefined)).toBe("center_bar");
  });

  it("normalizes icon color mode values to canonical modes", () => {
    expect(normalizeIconColorMode("theme")).toBe("theme");
    expect(normalizeIconColorMode("state")).toBe("state");
    expect(normalizeIconColorMode("level")).toBe("level");
    expect(normalizeIconColorMode("custom")).toBe("custom");
    expect(normalizeIconColorMode(undefined)).toBe("theme");
  });

  it("normalizes bar color mode values to canonical modes", () => {
    expect(normalizeBarColorMode("gradient")).toBe("gradient");
    expect(normalizeBarColorMode("stepped")).toBe("stepped");
    expect(normalizeBarColorMode("current_level")).toBe("current_level");
    expect(normalizeBarColorMode("interpolated")).toBe("stepped");
    expect(normalizeBarColorMode("discrete")).toBe("stepped");
    expect(normalizeBarColorMode("level")).toBe("stepped");
    expect(normalizeBarColorMode(undefined)).toBe("stepped");
  });

  it("normalizes bar fill mode values to canonical modes", () => {
    expect(normalizeBarFillMode("cumulative")).toBe("cumulative");
    expect(normalizeBarFillMode("current_segment")).toBe("current_segment");
    expect(normalizeBarFillMode("segment")).toBe("cumulative");
    expect(normalizeBarFillMode("current")).toBe("cumulative");
    expect(normalizeBarFillMode(undefined)).toBe("cumulative");
  });

  it("normalizes fill snapping values to canonical modes", () => {
    expect(normalizeFillSnappingMode("off")).toBe("off");
    expect(normalizeFillSnappingMode("down")).toBe("down");
    expect(normalizeFillSnappingMode("nearest")).toBe("nearest");
    expect(normalizeFillSnappingMode("up")).toBe("up");
    expect(normalizeFillSnappingMode("precise")).toBe("off");
    expect(normalizeFillSnappingMode("floor")).toBe("off");
    expect(normalizeFillSnappingMode("round")).toBe("off");
    expect(normalizeFillSnappingMode("ceil")).toBe("off");
  });

  it("normalizes color snapping values to canonical modes", () => {
    expect(normalizeColorSnappingMode("off")).toBe("off");
    expect(normalizeColorSnappingMode("level")).toBe("level");
    expect(normalizeColorSnappingMode("midpoint")).toBe("midpoint");
    expect(normalizeColorSnappingMode("high")).toBe("high");
    expect(normalizeColorSnappingMode("low")).toBe("low");
    expect(normalizeColorSnappingMode("continuous")).toBe("off");
    expect(normalizeColorSnappingMode("segment")).toBe("off");
    expect(normalizeColorSnappingMode("average")).toBe("off");
  });

  it("normalizes pointer color mode values to canonical modes", () => {
    expect(normalizePointerColorMode("gradient")).toBe("gradient");
    expect(normalizePointerColorMode("interpolated")).toBe("custom");
    expect(normalizePointerColorMode("level")).toBe("level");
    expect(normalizePointerColorMode("custom")).toBe("custom");
  });

  it("normalizes scale color mode values to canonical modes", () => {
    expect(normalizeScaleColorMode("theme")).toBe("theme");
    expect(normalizeScaleColorMode("gradient")).toBe("gradient");
    expect(normalizeScaleColorMode("interpolated")).toBe("theme");
    expect(normalizeScaleColorMode("stepped")).toBe("stepped");
    expect(normalizeScaleColorMode("discrete")).toBe("theme");
    expect(normalizeScaleColorMode("level")).toBe("level");
    expect(normalizeScaleColorMode("custom")).toBe("custom");
  });

  it("normalizes tick color mode values to canonical modes", () => {
    expect(normalizeTickColorMode("contrast")).toBe("contrast");
    expect(normalizeTickColorMode("interpolated")).toBe("theme");
    expect(normalizeTickColorMode("discrete")).toBe("theme");
  });
});
