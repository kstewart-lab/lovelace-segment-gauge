import { describe, expect, it } from "vitest";
import {
  asOptionalString,
  asString,
  buildPatch,
  coerceNumericValue,
  readEventChecked,
  readEventNumberOrNull,
  readEventValue,
} from "../src/editor/fields";

describe("editor field helpers", () => {
  it("reads event value from detail first, then target", () => {
    expect(readEventValue({ detail: { value: "from-detail" }, target: { value: "from-target" } })).toBe("from-detail");
    expect(readEventValue({ target: { value: "from-target" } })).toBe("from-target");
  });

  it("reads checked state from target or detail", () => {
    expect(readEventChecked({ target: { checked: true } })).toBe(true);
    expect(readEventChecked({ detail: { value: false } })).toBe(false);
    expect(readEventChecked({ detail: { value: 1 } })).toBe(true);
  });

  it("reads number values from HA-like event payloads", () => {
    expect(readEventNumberOrNull({ detail: { value: "12.5" } })).toBe(12.5);
    expect(readEventNumberOrNull({ target: { value: "42" } })).toBe(42);
    expect(readEventNumberOrNull({ target: { value: "x" } })).toBeNull();
  });

  it("coerces numeric values with clamp and round options", () => {
    expect(coerceNumericValue(4.6, { round: true })).toBe(5);
    expect(coerceNumericValue(-2, { min: 0 })).toBe(0);
    expect(coerceNumericValue(99, { max: 40 })).toBe(40);
  });

  it("normalizes optional and required strings", () => {
    expect(asOptionalString("")).toBeUndefined();
    expect(asOptionalString(undefined)).toBeUndefined();
    expect(asOptionalString("abc")).toBe("abc");
    expect(asString(undefined)).toBe("");
    expect(asString(7)).toBe("7");
  });

  it("builds nested patch objects for update paths", () => {
    expect(buildPatch(["scale", "ticks", "major_count"], 7)).toEqual({
      scale: { ticks: { major_count: 7 } },
    });
    expect(buildPatch(["entity"], "sensor.test")).toEqual({ entity: "sensor.test" });
  });
});
