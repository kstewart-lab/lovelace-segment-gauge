import { describe, expect, it } from "vitest";
import type { Level } from "../src/ha-types";
import { addLevel, listLevels, removeLevel, updateLevel } from "../src/editor/levels";

describe("editor level semantics", () => {
  it("adds first stop at min with default color", () => {
    const next = addLevel([], { min: 10, max: 40, precision: 1, random: () => 0.5 });
    expect(next).toEqual([{ value: 10, color: "#00ff00" }]);
  });

  it("adds subsequent stops at 20% range steps and floors to precision", () => {
    let levels: Level[] = [];
    levels = addLevel(levels, { min: 0, max: 1.3, precision: 1, random: () => 0.25 });
    levels = addLevel(levels, { min: 0, max: 1.3, precision: 1, random: () => 0.25 });
    levels = addLevel(levels, { min: 0, max: 1.3, precision: 1, random: () => 0.25 });

    expect(levels.map((l) => l.value)).toEqual([0, 0.2, 0.4]);
  });

  it("handles empty, single, and multiple stop color generation", () => {
    const empty = addLevel([], { min: 0, max: 100, random: () => 0.1 });
    expect(empty[0].color).toBe("#00ff00");

    const single = addLevel([{ value: 0, color: "#123456" }], { min: 0, max: 100, random: () => 0.1 });
    expect(single[1].color).toMatch(/^#[0-9a-f]{6}$/i);

    const multiple = addLevel(
      [
        { value: 0, color: "#000000" },
        { value: 20, color: "#ffffff" },
      ],
      { min: 0, max: 100, random: () => 0.1 }
    );
    expect(multiple[2].color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(multiple[2].color).not.toBe("#00ff00");
  });

  it("removes stops by index and leaves array unchanged for out-of-range index", () => {
    const levels: Level[] = [
      { value: 0, color: "#000000" },
      { value: 50, color: "#777777" },
      { value: 100, color: "#ffffff" },
    ];
    const removed = removeLevel(levels, 1);
    expect(removed).toEqual([
      { value: 0, color: "#000000" },
      { value: 100, color: "#ffffff" },
    ]);
    expect(removeLevel(levels, 99)).toEqual(levels);
  });

  it("updates existing stops and creates default stop when index is missing", () => {
    const levels: Level[] = [{ value: 0, color: "#000000" }];
    const updated = updateLevel(levels, 0, { color: "#00ff00" });
    expect(updated).toEqual([{ value: 0, color: "#00ff00" }]);

    const expanded = updateLevel(levels, 2, { value: 25 });
    expect(expanded[2]).toEqual({ value: 25, color: "#00ff00" });
  });

  it("returns an empty level list for non-array values", () => {
    expect(listLevels(undefined)).toEqual([]);
    expect(listLevels({})).toEqual([]);
  });
});
