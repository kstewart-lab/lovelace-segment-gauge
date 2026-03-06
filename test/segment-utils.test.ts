import { describe, it, expect } from "vitest";
import { computeFixedBoundaries, computeLevelBoundaries, snapToBoundary } from "../src/segment-utils";

describe("segment utils", () => {
  it("computes fixed boundaries from track and segment width", () => {
    const bounds = computeFixedBoundaries(1000, 100);
    expect(bounds[0]).toBe(0);
    expect(bounds[bounds.length - 1]).toBe(100);
    expect(bounds).toContain(10);
    expect(bounds).toContain(50);
  });

  it("computes level boundaries from levels", () => {
    const bounds = computeLevelBoundaries(
      [
        { value: 0, color: "#00ff00" },
        { value: 25, color: "#ffff00" },
        { value: 50, color: "#ff8800" },
        { value: 75, color: "#ff0000" },
        { value: 100, color: "#ff0000" },
      ],
      0,
      100
    );
    expect(bounds).toEqual([0, 25, 50, 75, 100]);
  });

  it("recomputes level boundaries when levels change", () => {
    const a = computeLevelBoundaries(
      [
        { value: 0, color: "#00ff00" },
        { value: 50, color: "#ffff00" },
        { value: 100, color: "#ff0000" },
      ],
      0,
      100
    );
    const b = computeLevelBoundaries(
      [
        { value: 0, color: "#00ff00" },
        { value: 70, color: "#ffff00" },
        { value: 100, color: "#ff0000" },
      ],
      0,
      100
    );
    expect(a).toEqual([0, 50, 100]);
    expect(b).toEqual([0, 70, 100]);
  });

  it("supports level subdivisions per interval", () => {
    const bounds = computeLevelBoundaries(
      [
        { value: 0, color: "#00ff00" },
        { value: 50, color: "#ffff00" },
        { value: 100, color: "#ff0000" },
      ],
      0,
      100,
      2
    );
    expect(bounds).toEqual([0, 25, 50, 75, 100]);
  });

  it("ignores level values outside min/max when computing boundaries", () => {
    const bounds = computeLevelBoundaries(
      [
        { value: -90, color: "#ff0000" },
        { value: -75, color: "#ffff00" },
        { value: -50, color: "#00ff00" },
        { value: 0, color: "#00ff00" },
      ],
      -80,
      0
    );
    expect(bounds).toEqual([0, 6.25, 37.5, 100]);
  });

  it("snaps to boundaries using canonical fill snapping values", () => {
    const bounds = [0, 25, 50, 75, 100];
    expect(snapToBoundary(60, bounds, "down")).toBe(50);
    expect(snapToBoundary(60, bounds, "up")).toBe(75);
    expect(snapToBoundary(60, bounds, "nearest")).toBe(50);
    expect(snapToBoundary(60, bounds, "off")).toBe(60);
  });
});
