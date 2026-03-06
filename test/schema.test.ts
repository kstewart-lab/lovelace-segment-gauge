import { describe, it, expect } from "vitest";
import { SEGMENT_GAUGE_CONFIG_SCHEMA } from "../src/schema";
import { DEFAULTS } from "../src/shared";

const field = (key: string) => SEGMENT_GAUGE_CONFIG_SCHEMA.find((f) => f.key === key);

describe("schema defaults", () => {
  it("derives field defaults from DEFAULTS", () => {
    expect(field("layout.mode")?.default).toBe(DEFAULTS.layout.mode);
    expect(field("bar.height")?.default).toBe(DEFAULTS.bar.height);
    expect(field("data.unit")?.default).toBe(DEFAULTS.data.unit);
    expect(field("scale.ticks.major_count")?.default).toBe((DEFAULTS.scale.ticks as any).major_count);
  });

  it("clones object defaults so schema mutation does not affect DEFAULTS", () => {
    const tap = field("actions.tap_action");
    expect(tap?.default).toEqual(DEFAULTS.actions.tap_action);
    expect(tap?.default).not.toBe(DEFAULTS.actions.tap_action);

    (tap!.default as any).action = "none";
    expect(DEFAULTS.actions.tap_action.action).toBe("more-info");
  });
});
