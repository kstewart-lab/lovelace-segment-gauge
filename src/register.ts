import { registerSegmentGaugeCard } from "./segment-gauge-card";
import { registerSegmentGaugeRow } from "./segment-gauge-row";
import { registerSegmentGaugeEditor } from "./editor";

declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string }>;
  }
}

export type RegisterSegmentGaugeOptions = {
  registerCustomCardEntry?: boolean;
};

export function registerSegmentGaugeElements(options: RegisterSegmentGaugeOptions = {}) {
  const { registerCustomCardEntry = true } = options;

  registerSegmentGaugeEditor();
  registerSegmentGaugeCard();
  registerSegmentGaugeRow();

  if (!registerCustomCardEntry || typeof window === "undefined") return;

  const entry = {
    type: "segment-gauge",
    name: "Segment Gauge",
    description: "Compact gauge card with levels, segments, scale, and pointer.",
  };

  window.customCards = window.customCards || [];
  const exists = window.customCards.some((card) => card.type === entry.type);
  if (!exists) {
    window.customCards.push(entry);
  }
}
