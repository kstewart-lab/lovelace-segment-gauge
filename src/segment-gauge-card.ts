import { html } from "lit";
import { SegmentGaugeBase } from "./segment-gauge-base";
import { DEFAULTS } from "./shared";

export class SegmentGaugeCard extends SegmentGaugeBase {
  render() {
    if (!this._config) return html``;
    const styleMode = this._config.style?.card ?? DEFAULTS.style.card;
    const debugLayout = !!(this._config.style as any)?.debug_layout;
    const cardStyle =
      styleMode === "plain" ? "background: none; box-shadow: none; border: none;" : "";
    const frameDebugStyle = debugLayout
      ? "outline:1px dashed rgba(64, 180, 255, 0.95); outline-offset:-1px; background:rgba(64, 180, 255, 0.06);"
      : "";
    const innerDebugStyle = debugLayout
      ? "outline:1px dashed rgba(120, 255, 170, 0.95); outline-offset:-1px; background:rgba(120, 255, 170, 0.04);"
      : "";

    return html`
      <ha-card style=${cardStyle}>
        <div
          style=${`padding: var(--segment-gauge-padding, var(--ha-card-padding, 10px)); display:flex; align-items:center; box-sizing:border-box; ${frameDebugStyle}`}
        >
          <div style=${`width:100%; ${innerDebugStyle}`}>
            ${this.renderSegmentGauge()}
          </div>
        </div>
      </ha-card>
    `;
  }

  static getConfigElement() {
    return document.createElement("segment-gauge-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      data: {
        min: 0,
        max: 100,
      },
      layout: {
        mode: "horizontal",
      },
      content: {
        show_icon: true,
        show_name: true,
        show_state: true,
        icon_color: { mode: "theme" },
      },
      bar: {
        height: 6,
        edge: "rounded",
      },
      pointer: {
        color: "#ffffff",
      },
      levels: [{ value: 0, color: "#03a9f4" }],
    };
  }
}

export function registerSegmentGaugeCard() {
  const tag = "segment-gauge";
  if (!customElements.get(tag)) {
    customElements.define(tag, SegmentGaugeCard);
  }
}
