import { describe, it, expect } from "vitest";
import { registerSegmentGaugeElements } from "../src/register";
import { SegmentGaugeCard, registerSegmentGaugeCard } from "../src/segment-gauge-card";
import { SegmentGaugeRow, registerSegmentGaugeRow } from "../src/segment-gauge-row";
import { SegmentGaugeEditor, registerSegmentGaugeEditor } from "../src/editor";

describe("registration API", () => {
  it("exports card, row, and editor classes", () => {
    expect(typeof SegmentGaugeCard).toBe("function");
    expect(typeof SegmentGaugeRow).toBe("function");
    expect(typeof SegmentGaugeEditor).toBe("function");
  });

  it("registers default elements and deduplicates customCards entry", () => {
    (window as any).customCards = [];

    registerSegmentGaugeElements({ registerCustomCardEntry: true });
    registerSegmentGaugeElements({ registerCustomCardEntry: true });

    expect(customElements.get("segment-gauge")).toBeTruthy();
    expect(customElements.get("segment-gauge-row")).toBeTruthy();
    expect(customElements.get("segment-gauge-editor")).toBeTruthy();

    expect((window as any).customCards).toHaveLength(1);
    expect((window as any).customCards[0]?.type).toBe("segment-gauge");
  });

  it("individual registration helpers are idempotent", () => {
    registerSegmentGaugeCard();
    registerSegmentGaugeCard();
    registerSegmentGaugeRow();
    registerSegmentGaugeRow();
    registerSegmentGaugeEditor();
    registerSegmentGaugeEditor();

    expect(customElements.get("segment-gauge")).toBe(SegmentGaugeCard);
    expect(customElements.get("segment-gauge-row")).toBe(SegmentGaugeRow);
    expect(customElements.get("segment-gauge-editor")).toBe(SegmentGaugeEditor);
  });
});
