import { html } from "lit";
import { SegmentGaugeBase } from "./segment-gauge-base";

export class SegmentGaugeRow extends SegmentGaugeBase {
  render() {
    if (!this._config) return html``;
    return html`${this.renderSegmentGauge()}`;
  }
}

export function registerSegmentGaugeRow() {
  const tag = "segment-gauge-row";
  if (!customElements.get(tag)) {
    customElements.define(tag, SegmentGaugeRow);
  }
}
