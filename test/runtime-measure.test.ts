import { describe, it, expect } from "vitest";
import { computeLabelInsets } from "../src/runtime/measure";

describe("runtime measurement contract", () => {
  it("computes label insets from measured min/max label widths", () => {
    const result = computeLabelInsets(20, 50, 4);
    expect(result).toEqual({ left: 14, right: 29 });
  });
});
