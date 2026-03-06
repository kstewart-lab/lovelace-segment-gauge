import { describe, expect, it } from "vitest";
import { validateConfig } from "../src/runtime/validate";

describe("config validation", () => {
  it("warns on unknown top-level keys", () => {
    const result = validateConfig({
      type: "custom:segment-gauge",
      entity: "sensor.test",
      foo: 1,
    });
    expect(result.warnings).toContain(`Unknown field "foo"`);
  });

  it("does not warn on supported Lovelace host-level keys", () => {
    const result = validateConfig({
      type: "custom:segment-gauge",
      entity: "sensor.test",
      grid_options: { columns: 6 },
      view_layout: { position: "sidebar" },
      visibility: [{ condition: "user", users: ["abc"] }],
    } as any);
    expect(result.warnings).toEqual([]);
  });

  it("warns on unknown nested keys", () => {
    const result = validateConfig({
      type: "custom:segment-gauge",
      entity: "sensor.test",
      bar: {
        segments: {
          mode: "fixed",
          bar_mode: "x",
        },
      },
    });
    expect(result.warnings).toContain(`Unknown field "segments.bar_mode"`);
  });

  it("warns on invalid enum values", () => {
    const result = validateConfig({
      type: "custom:segment-gauge",
      entity: "sensor.test",
      bar: {
        snapping: {
          fill: "segment",
        },
      },
    });
    expect(result.warnings).toContain(
      `Invalid value "segment" for snapping.fill (allowed: off | down | nearest | up)`
    );
  });

  it("warns on removed legacy fields", () => {
    const result = validateConfig({
      type: "custom:segment-gauge",
      entity: "sensor.test",
      bar: {
        segments: {
          mode: "level",
          subdivisions_per_level: 3,
        },
      },
      scale: {
        gap: 8,
      },
    });
    expect(result.warnings).toContain(`Removed legacy field "subdivisions_per_level"`);
    expect(result.warnings).toContain(`Removed legacy field "scale.gap"`);
  });

  it("does not mutate the input config", () => {
    const input = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      bar: {
        segments: {
          mode: "level",
          subdivisions_per_level: 3,
        },
      },
      scale: {
        gap: 8,
      },
    };
    const before = JSON.stringify(input);
    validateConfig(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
