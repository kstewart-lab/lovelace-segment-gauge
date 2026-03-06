import { describe, expect, it } from "vitest";
import type { SegmentGaugeConfig } from "../src/ha-types";
import {
  applyEditorActionPatch,
  applyEditorPatch,
  emitConfigChanged,
  orderEditorConfig,
  replaceEditorLevels,
} from "../src/editor/updates";

describe("editor update layer", () => {
  it("applies nested updates without dropping sibling fields", () => {
    const input: SegmentGaugeConfig = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      scale: {
        show: true,
        ticks: {
          major_count: 6,
          height_major: 10,
        },
        labels: {
          show: true,
          color_mode: "theme",
        },
      },
    };

    const before = JSON.stringify(input);
    const result = applyEditorPatch(input, { scale: { ticks: { height_major: 22 } } } as any);

    expect(result.config.scale?.ticks?.height_major).toBe(22);
    expect(result.config.scale?.ticks?.major_count).toBe(6);
    expect(result.config.scale?.labels?.show).toBe(true);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("supports level add/remove flows through centralized updates", () => {
    const input: SegmentGaugeConfig = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
      levels: [{ value: 0, color: "#000000" }],
    };

    const added = replaceEditorLevels(input, [...(input.levels ?? []), { value: 10, color: "#ffffff" }]);
    expect(added.config.levels).toEqual([
      { value: 0, color: "#000000" },
      { value: 10, color: "#ffffff" },
    ]);

    const removed = replaceEditorLevels(added.config, (added.config.levels ?? []).slice(1));
    expect(removed.config.levels).toEqual([{ value: 10, color: "#ffffff" }]);
  });

  it("preserves configured key ordering for top-level and nested sections", () => {
    const ordered = orderEditorConfig({
      type: "custom:segment-gauge",
      entity: "sensor.test",
      scale: {
        labels: { color: "#aaaaaa", color_mode: "custom" },
        ticks: { height_minor: 4, height_major: 9, color_mode: "theme", major_count: 7, minor_per_major: 2 },
        spacing: "even",
      },
      bar: {
        snapping: { color: "midpoint", fill: "nearest" },
        segments: { gap: 3, width: 12, mode: "fixed" },
        track: { intensity: 25, background: "#101010" },
        fill_mode: "current_segment",
        color_mode: "gradient",
        height: 10,
        edge: "rounded",
        show: true,
      },
      data: { unit: "%", precision: 1, max: 100, min: 0 },
      content: {
        icon_color: { value: "#00ff00", mode: "custom" },
        show_state: true,
        show_name: true,
        show_icon: true,
        name: "Test",
      },
      layout: { content_spacing: 2, gauge_alignment: "center_labels", split_pct: 35, mode: "horizontal" },
    } as SegmentGaugeConfig);

    expect(Object.keys(ordered).slice(0, 7)).toEqual(["type", "entity", "content", "layout", "data", "bar", "scale"]);
    expect(Object.keys(ordered.bar?.segments ?? {})).toEqual(["mode", "width", "gap"]);
    expect(Object.keys(ordered.scale?.ticks ?? {})).toEqual(["color_mode", "major_count", "minor_per_major", "height_major", "height_minor"]);
  });

  it("emits config-changed with expected event semantics", () => {
    const host = document.createElement("div");
    const input: SegmentGaugeConfig = {
      type: "custom:segment-gauge",
      entity: "sensor.test",
    };
    const result = applyEditorActionPatch(input, "tap_action", { action: "none" });

    let seen: CustomEvent | undefined;
    host.addEventListener("config-changed", (ev) => {
      seen = ev as CustomEvent;
    });
    emitConfigChanged(host, result.config);

    expect(seen).toBeTruthy();
    expect(seen?.detail?.config).toEqual(result.config);
    expect(seen?.bubbles).toBe(true);
    expect(seen?.composed).toBe(true);
  });
});
