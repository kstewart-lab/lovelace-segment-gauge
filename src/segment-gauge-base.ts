import { css, html, LitElement, nothing, svg } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import type { ColorQuantization, HassEntity, HomeAssistant, SegmentGaugeConfig, SegmentMode } from "./ha-types";
import { ActionController } from "./actions";
import {
  asNumber,
  clamp,
  DEFAULTS,
  formatValue,
  getUnit,
  isUnavailable,
  normalizeLayoutMode,
  normalizeStops,
} from "./shared";
import { normalizeRuntimeConfig } from "./runtime/normalize";
import { computeLabelInsets, domMeasureAdapter } from "./runtime/measure";
import { validateConfig } from "./runtime/validate";
import {
  buildQuantizedBarColorRects,
  colorForMode,
  createScaleColorResolvers,
  deriveRuntimeModel,
  deriveIconPolicy,
  parseRgbColor,
  resolveCssColor,
  type DerivedRuntimeModel,
  type FixedGapRect,
  type GradientStopDef,
  type ScaleLayout,
} from "./runtime/model";

const DEFAULT_LABEL_FONT_SIZE = 12;
const LABEL_LINE_HEIGHT = 1.2;
const LABEL_BOTTOM_MARGIN = 2;
const INSET_SAFETY_PX = 4;
const INLINE_ICON_SLOT_MARGIN_PX = -1;

function hasAnyAction(cfg: SegmentGaugeConfig): boolean {
  const has = (a: any) => a && typeof a === "object" && a.action && a.action !== "none";
  const actions = (cfg as any).actions ?? {};
  return has(actions.tap_action) || has(actions.hold_action) || has(actions.double_tap_action);
}

const CONTENT_BASE_SPACING_FALLBACK = 10;

type BarSvgRenderParams = {
  hideBar: boolean;
  height: number;
  radius: number;
  fillStartPct: number;
  fillPct: number;
  barClipId: string;
  fillClipId: string;
  gradId: string;
  gradStops: GradientStopDef[];
  trackBg: string;
  trackOpacity: number;
  colorQuant: ColorQuantization;
  segmentMode: SegmentMode;
  trackWidth: number;
  segWidth: number;
  segmentBoundaries: number[];
  min: number;
  max: number;
  range: number;
  levels: Array<{ value: number; color: string }>;
  colorAtValue: (value: number) => string;
  fixedGapRects: FixedGapRect[];
  gapPx: number;
  levelGaps: number[];
};

export class SegmentGaugeBase extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _stateObj: { state: true },
    _valueNum: { state: true },
    _insetLeft: { state: true },
    _insetRight: { state: true },
  };

  hass?: HomeAssistant;
  protected _config: SegmentGaugeConfig | null = null;
  protected _stateObj?: HassEntity;
  protected _valueNum: number | null = null;
  private _actionCtl?: ActionController;
  private _measureRaf = 0;
  private _lastMeasureKey = "";
  private _insetLeft = 0;
  private _insetRight = 0;
  private _trackWidth = 0;
  private _trackObserver?: ResizeObserver;
  private _trackObserverRaf = 0;
  private _svgId?: string;
  private _measureAdapter = domMeasureAdapter;

  setConfig(config: SegmentGaugeConfig) {
    if (!config || !config.entity) throw new Error("segment-gauge: 'entity' is required");
    const validation = validateConfig(config);
    for (const warning of validation.warnings) {
      console.warn("segment-gauge:", warning);
    }
    this._config = normalizeRuntimeConfig(config);
    if (!this._actionCtl) {
      this._actionCtl = new ActionController(this, {
        getConfig: () => this._config,
        getHass: () => this.hass ?? null,
        getEntityId: () => this._config?.entity ?? null,
      });
    }
  }

  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has("hass") && this.hass && this._config?.entity) {
      this._stateObj = this.hass.states[this._config.entity];
      this._valueNum = asNumber(this._stateObj?.state);
    }
    this._syncTrackWidthFromDom();
    this._scheduleInsetMeasure();
    this._ensureTrackObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._trackObserver) {
      this._trackObserver.disconnect();
      this._trackObserver = undefined;
    }
    if (this._trackObserverRaf) {
      this._measureAdapter.cancelFrame(this._trackObserverRaf);
      this._trackObserverRaf = 0;
    }
  }

  private _ensureTrackObserver() {
    if (this._trackObserver) return;
    const track = this._measureAdapter.queryTrack(this.renderRoot);
    if (!track) {
      if (!this._trackObserverRaf) {
        this._trackObserverRaf = this._measureAdapter.requestFrame(() => {
          this._trackObserverRaf = 0;
          this._ensureTrackObserver();
        });
      }
      return;
    }
    this._trackObserver = this._measureAdapter.createResizeObserver((entries) => {
      const entry = entries[0];
      const w = Math.round(entry.contentRect.width);
      if (w > 0 && w !== this._trackWidth) {
        this._trackWidth = w;
        this.requestUpdate();
      }
    });
    this._trackObserver.observe(track);
  }

  private _syncTrackWidthFromDom() {
    const segmentMode = this._config?.bar?.segments?.mode ?? DEFAULTS.bar.segments.mode;
    if (segmentMode !== "fixed") return;
    const track = this._measureAdapter.queryTrack(this.renderRoot);
    if (!track) return;
    const w = this._measureAdapter.readTrackWidth(track);
    if (w > 0 && w !== this._trackWidth) {
      this._trackWidth = w;
      this.requestUpdate();
    }
  }

  private _scheduleInsetMeasure() {
    const cfg = this._config;
    if (!cfg) return;
    const scale = cfg.scale ?? DEFAULTS.scale;
    const labels = scale.labels ?? DEFAULTS.scale.labels;
    const showScale = !!scale.show;
    const labelsOn = labels.show !== false;
    if (!showScale || !labelsOn) {
      this._lastMeasureKey = "";
      this._setInsets(0, 0);
      return;
    }

    const min = Number(cfg.data?.min ?? DEFAULTS.data.min);
    const max = Number(cfg.data?.max ?? DEFAULTS.data.max);
    const precision = labels.precision ?? cfg.data?.precision ?? DEFAULTS.data.precision;
    const minLabel = formatValue(min, precision ?? null);
    const maxLabel = formatValue(max, precision ?? null);
    const labelSize = Math.max(8, Math.round(Number(labels.size ?? DEFAULTS.scale.labels.size ?? DEFAULT_LABEL_FONT_SIZE)));
    const key = `${minLabel}|${maxLabel}|${labelSize}`;
    if (key === this._lastMeasureKey && this._insetLeft > 0 && this._insetRight > 0) return;
    this._lastMeasureKey = key;

    if (this._measureRaf) this._measureAdapter.cancelFrame(this._measureRaf);
    this._measureRaf = this._measureAdapter.requestFrame(() => {
      this._measureRaf = 0;
      const measureNodes = this._measureAdapter.queryLabelMeasureNodes(this.renderRoot);
      if (!measureNodes) return;
      const minWidth = this._measureAdapter.readElementWidth(measureNodes.minEl);
      const maxWidth = this._measureAdapter.readElementWidth(measureNodes.maxEl);
      const { left: insetLeft, right: insetRight } = computeLabelInsets(minWidth, maxWidth, INSET_SAFETY_PX);
      this._setInsets(insetLeft, insetRight);
    });
  }

  private _setInsets(left: number, right: number) {
    if (left === this._insetLeft && right === this._insetRight) return;
    this._insetLeft = left;
    this._insetRight = right;
  }

  private _renderIcon(
    stateObj: HassEntity | undefined,
    config: SegmentGaugeConfig,
    model?: Pick<DerivedRuntimeModel, "levels" | "min" | "max">
  ) {
    const content = config.content ?? DEFAULTS.content;
    const policy = deriveIconPolicy({
      content,
      levels:
        model?.levels ??
        normalizeStops(
          (config.levels ?? []) as any,
          config.data?.min ?? DEFAULTS.data.min,
          config.data?.max ?? DEFAULTS.data.max
        ),
      min: model?.min ?? Number(config.data?.min ?? DEFAULTS.data.min),
      max: model?.max ?? Number(config.data?.max ?? DEFAULTS.data.max),
      valueNum: Number.isFinite(Number(stateObj?.state)) ? Number(stateObj?.state) : null,
    });

    const style: Record<string, string> = policy.styleColor ? { color: policy.styleColor } : {};
    const styleAttr = Object.keys(style).length ? styleMap(style) : nothing;
    if (policy.icon) {
      return html`<ha-icon .icon=${policy.icon} style=${styleAttr}></ha-icon>`;
    }
    return html`<ha-state-icon
      .hass=${this.hass}
      .stateObj=${stateObj}
      ?stateColor=${policy.source === "state"}
      style=${styleAttr}
    ></ha-state-icon>`;
  }

  private _renderScaleMeasurers(config: SegmentGaugeConfig, min: number, max: number) {
    const scale = config.scale ?? DEFAULTS.scale;
    const labels = scale.labels ?? DEFAULTS.scale.labels;
    const showScale = !!scale.show;
    const labelsOn = labels.show !== false;
    if (!showScale || !labelsOn) return nothing;
    const precision = labels.precision ?? config.data?.precision ?? DEFAULTS.data.precision;
    const minLabel = formatValue(min, precision ?? null);
    const maxLabel = formatValue(max, precision ?? null);
    return html`
      <span class="measure min">${minLabel}</span>
      <span class="measure max">${maxLabel}</span>
    `;
  }

  private _themePx(name: string, fallback: number): number {
    const styles = getComputedStyle(this);
    const raw = styles.getPropertyValue(name).trim();
    if (!raw) return fallback;
    const asNumber = Number(raw);
    if (Number.isFinite(asNumber)) return asNumber;
    const parsePx = (value: string, base: number) => {
      const num = Number.parseFloat(value);
      if (!Number.isFinite(num)) return fallback;
      if (value.endsWith("rem")) return num * base;
      if (value.endsWith("em")) return num * base;
      if (value.endsWith("px")) return num;
      return fallback;
    };
    if (raw.endsWith("rem")) {
      const rootSize = getComputedStyle(document.documentElement).fontSize.trim() || "16px";
      return parsePx(raw, Number.parseFloat(rootSize) || fallback);
    }
    if (raw.endsWith("em")) {
      const fontSize = styles.fontSize.trim() || "16px";
      return parsePx(raw, Number.parseFloat(fontSize) || fallback);
    }
    return raw.endsWith("px") ? parsePx(raw, fallback) : fallback;
  }

  private _renderScaleTemplate(params: {
    showScale: boolean;
    scaleLayout: ScaleLayout;
    min: number;
    range: number;
    tickColorFor: (value: number, pos: number, major: boolean) => string | null;
    labelColorFor: (value: number) => string | null;
  }) {
    const { showScale, scaleLayout, min, range, tickColorFor, labelColorFor } = params;
    if (!showScale) return nothing;
    return html`
      <div class="scale ${scaleLayout.className}" style=${scaleLayout.style}>
        <div class="scale-line"></div>
        ${scaleLayout.ticks.map((tick) => {
          const value = min + (range || 1) * (tick.pos / 100);
          const tickColor = tickColorFor(value, tick.pos, tick.major);
          const tickStyle = `left:${tick.pos}%${tickColor ? `;background:${tickColor}` : ""}`;
          const labelColor = tick.major && tick.label ? labelColorFor(value) : null;
          const labelStyle = `left:${tick.pos}%${labelColor ? `;color:${labelColor}` : ""}`;
          return html`
            <div class="tick ${tick.major ? "major" : ""}" style=${tickStyle}></div>
            ${tick.major && tick.label ? html`<div class="label" style=${labelStyle}>${tick.label}</div>` : nothing}
          `;
        })}
      </div>
    `;
  }

  private _renderBarColorField(params: {
    colorQuant: ColorQuantization;
    segmentMode: SegmentMode;
    trackWidth: number;
    segWidth: number;
    segmentBoundaries: number[];
    min: number;
    max: number;
    range: number;
    levels: Array<{ value: number; color: string }>;
    colorAtValue: (value: number) => string;
    gradId: string;
  }) {
    const { colorQuant, segmentMode, segmentBoundaries, min, max, levels, colorAtValue, gradId } = params;
    const rects = buildQuantizedBarColorRects({
      colorQuant,
      segmentMode,
      segmentBoundaries,
      min,
      max,
      levels,
      colorAtValue,
    });
    if (!rects || rects.length === 0) {
      return svg`<rect x="0" y="0" width="100%" height="100%" fill=${`url(#${gradId})`}></rect>`;
    }
    return rects.map(
      (rect) => svg`<rect x="${rect.start}%" y="0" width="${rect.end - rect.start}%" height="100%" fill=${rect.color}></rect>`
    );
  }

  private _renderBarGapRects(params: {
    segmentMode: SegmentMode;
    fixedGapRects: FixedGapRect[];
    gapPx: number;
    levelGaps: number[];
    trackBg: string;
  }) {
    const { segmentMode, fixedGapRects, gapPx, levelGaps, trackBg } = params;
    if (segmentMode === "fixed" && fixedGapRects.length) {
      return fixedGapRects.map(
        (r) => svg`<rect x="${r.x}%" y="0" width="${r.width}%" height="100%" fill=${trackBg}></rect>`
      );
    }
    if (segmentMode === "level" && gapPx > 0) {
      return levelGaps.map((pct) => svg`<rect x="${pct}%" y="0" width=${gapPx} height="100%" fill=${trackBg}></rect>`);
    }
    return nothing;
  }

  private _renderBarSvg(params: BarSvgRenderParams) {
    if (params.hideBar) return nothing;

    const colorField = this._renderBarColorField({
      colorQuant: params.colorQuant,
      segmentMode: params.segmentMode,
      trackWidth: params.trackWidth,
      segWidth: params.segWidth,
      segmentBoundaries: params.segmentBoundaries,
      min: params.min,
      max: params.max,
      range: params.range,
      levels: params.levels,
      colorAtValue: params.colorAtValue,
      gradId: params.gradId,
    });
    const gapRects = this._renderBarGapRects({
      segmentMode: params.segmentMode,
      fixedGapRects: params.fixedGapRects,
      gapPx: params.gapPx,
      levelGaps: params.levelGaps,
      trackBg: params.trackBg,
    });

    return svg`<svg
      class="bar-svg"
      width="100%"
      height=${params.height}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <clipPath id=${params.barClipId}>
          <rect x="0" y="0" width="100%" height="100%" rx=${params.radius} ry=${params.radius}></rect>
        </clipPath>
        <clipPath id=${params.fillClipId}>
          <rect
            x="${params.fillStartPct}%"
            y="0"
            width="${Math.max(0, params.fillPct - params.fillStartPct)}%"
            height="100%"
          ></rect>
        </clipPath>
        <linearGradient id=${params.gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          ${params.gradStops.map((s) => svg`<stop offset="${s.offset}%" stop-color="${s.color}"></stop>`)}
        </linearGradient>
      </defs>
      <g clip-path=${`url(#${params.barClipId})`}>
        <rect x="0" y="0" width="100%" height="100%" fill=${params.trackBg}></rect>
        ${params.trackOpacity > 0 ? svg`<g opacity=${params.trackOpacity}>${colorField} ${gapRects}</g>` : nothing}
        ${params.fillPct > params.fillStartPct
          ? svg`<g clip-path=${`url(#${params.fillClipId})`}>${colorField} ${gapRects}</g>`
          : nothing}
      </g>
    </svg>`;
  }

  protected renderSegmentGauge() {
    const c = this._config!;
    const content = c.content ?? DEFAULTS.content;
    const data = c.data ?? DEFAULTS.data;
    const pointer = c.pointer ?? DEFAULTS.pointer;
    const layout = c.layout ?? DEFAULTS.layout;
    const s = this._stateObj;
    const unavailable = isUnavailable(s, this._valueNum);

    const userName = content.name;
    const friendlyName = (s?.attributes as any)?.friendly_name;
    const name = userName && String(userName).trim().length > 0 ? userName : friendlyName ?? c.entity;
    const unit = getUnit(c, s);
    const stateText = unavailable
      ? "unavailable"
      : `${formatValue(this._valueNum as number, (data.precision ?? null) as any)}${unit ? " " + unit : ""}`;
    const baseSpacing = this._themePx(
      "--segment-gauge-content-gap",
      CONTENT_BASE_SPACING_FALLBACK
    );
    const cardPadding = this._themePx(
      "--segment-gauge-padding",
      this._themePx("--ha-card-padding", 10)
    );
    const showIcon = content.show_icon ?? DEFAULTS.content.show_icon;
    const showName = content.show_name ?? DEFAULTS.content.show_name;
    const showState = content.show_state ?? DEFAULTS.content.show_state;
    const showText = showName || showState;
    const gaugeEdgeInsetPx = Math.max(0, Math.round(cardPadding + (showIcon ? INLINE_ICON_SLOT_MARGIN_PX : 0)));
    const contentSpacingRaw = Number(
      (layout as any).content_spacing ?? (DEFAULTS.layout as any).content_spacing ?? 0
    );
    const contentSpacing = Number.isFinite(contentSpacingRaw)
      ? clamp(contentSpacingRaw, -48, 48)
      : 0;
    const model = deriveRuntimeModel({
      config: c,
      valueNum: this._valueNum,
      unavailable,
      trackWidth: this._trackWidth,
      measuredInsetLeft: this._insetLeft,
      measuredInsetRight: this._insetRight,
      baseSpacing,
      gaugeEdgeInsetPx,
    });
    const textShift = model.layoutClass === "stacked" ? 0 : contentSpacing;
    const textStyle = textShift !== 0 ? `margin-left:${textShift}px;` : "";

    const inlineVariant =
      model.layoutClass !== "inline"
        ? ""
        : showIcon && showText
          ? " inline-icon-text"
          : showIcon
            ? " inline-icon-only"
            : showText
              ? " inline-text-only"
              : " inline-bar-only";
    const wrapClass = `wrap ${model.layoutClass}${inlineVariant}${model.debugLayout ? " debug-layout" : ""} ${
      unavailable ? "unavailable" : ""
    }${hasAnyAction(c) ? " interactive" : ""}`;

    const rootStyles = getComputedStyle(this);
    const colorAtValue = (value: number): string =>
      colorForMode(model.colorMode, value, model.levels, model.min, model.max, model.currentColor);

    const cardBgResolved =
      model.tickMode === "contrast"
        ? resolveCssColor(rootStyles, "var(--ha-card-background, var(--card-background-color, #000))")
        : "";
    const cardBgRgb = model.tickMode === "contrast" ? parseRgbColor(cardBgResolved) : null;
    const trackBgResolved = model.tickMode === "contrast" ? resolveCssColor(rootStyles, model.trackBg) : model.trackBg;
    const trackBgRgb = model.tickMode === "contrast" ? parseRgbColor(trackBgResolved) : null;
    const { tickColorFor, labelColorFor } = createScaleColorResolvers({
      tickMode: model.tickMode,
      labelMode: model.labelMode,
      tickCustom: model.tickCustom,
      labelCustom: model.labelCustom,
      levels: model.levels,
      min: model.min,
      max: model.max,
      currentColor: model.currentColor,
      fillWindow: model.fillWindow,
      scaleLayout: model.scaleLayout,
      scaleOffset: model.scaleOffset,
      showBar: model.showBar,
      barHeight: model.height,
      barTop: model.pointerPadTop,
      trackIntensity: model.trackIntensity,
      cardBgRgb,
      trackBgRgb,
      colorAtValue,
    });

    const scaleTemplate = this._renderScaleTemplate({
      showScale: model.scaleShow,
      scaleLayout: model.scaleLayout,
      min: model.min,
      range: model.range,
      tickColorFor,
      labelColorFor,
    });

    const styleAttr = Object.entries(model.styleVars).map(([k, v]) => `${k}:${v}`).join(";");
    const svgId = this._svgId ?? (this._svgId = `mb-${Math.random().toString(36).slice(2, 10)}`);
    const gradId = `${svgId}-grad`;
    const barClipId = `${svgId}-bar-clip`;
    const fillClipId = `${svgId}-fill-clip`;

    const showPointer = pointer.show ?? DEFAULTS.pointer.show;

    return html`
      <div class=${wrapClass} style=${styleAttr}>
        ${showIcon
          ? html`<div class="icon">${this._renderIcon(s, c, model)}</div>`
          : nothing}
        ${showText
          ? html`<div class="text" style=${textStyle}>
              ${showName ? html`<div class="name">${name}</div>` : nothing}
              ${showState ? html`<div class="state">${stateText}</div>` : nothing}
            </div>`
          : nothing}

        <div class="bar">
          <div
            class="bar-stack"
            style=${`--mb-scale-gap:${model.scaleGap}px; --mb-scale-offset:${model.scaleOffset}px; --mb-scale-reserve:${model.scaleReserve}px;`}
          >
            <div class="inner">
                  <div class="track-wrap">
                    <div
                      class="track"
                      style=${`height:${model.height}px; border-radius:${model.radius}px;${model.hideBar ? "background:transparent; box-shadow:none;" : ""}`}
                    >
                      ${this._renderBarSvg({
                        hideBar: model.hideBar,
                        height: model.height,
                        radius: model.radius,
                        fillStartPct: model.fillWindow.start,
                        fillPct: model.fillWindow.end,
                        barClipId,
                        fillClipId,
                        gradId,
                        gradStops: model.gradStops,
                        trackBg: model.trackBg,
                        trackOpacity: model.trackOpacity,
                        colorQuant: model.colorQuant,
                        segmentMode: model.segmentMode,
                        trackWidth: this._trackWidth,
                        segWidth: model.segWidth,
                        segmentBoundaries: model.segmentBoundaries,
                        min: model.min,
                        max: model.max,
                        range: model.range,
                        levels: model.levels,
                        colorAtValue,
                        fixedGapRects: model.fixedGapRects,
                        gapPx: model.gapPx,
                        levelGaps: model.levelGaps,
                      })}
                    </div>
                    ${unavailable || !showPointer
                      ? nothing
                      : html`<div class="pointer triangle" style="left:${model.pointerLeft}%;"></div>`}
                  </div>
              ${scaleTemplate}
            </div>
          </div>
          ${model.scaleShow ? this._renderScaleMeasurers(c, model.min, model.max) : nothing}
        </div>
      </div>
    `;
  }

  getCardSize() {
    const layout = normalizeLayoutMode((this._config ?? DEFAULTS).layout?.mode);
    return layout === "horizontal" ? 1 : 2;
  }

  static styles = css`
    :host {
      display: block;
    }

    .wrap {
      display: grid;
      cursor: default;
      gap: 8px;
      align-items: center;
    }

    .wrap.inline.inline-icon-text {
      grid-template-columns: var(--mb-grid-cols, auto minmax(0, 1fr) minmax(0, 3fr));
      grid-template-areas: "icon text bar";
    }

    .wrap.inline.inline-icon-only {
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-areas: "icon bar";
    }

    .wrap.inline.inline-text-only {
      grid-template-columns: var(--mb-grid-cols-text-only, minmax(0, 1fr) minmax(0, 3fr));
      grid-template-areas: "text bar";
    }

    .wrap.inline.inline-bar-only {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: "bar";
    }

    .wrap.inline,
    .wrap.below {
      column-gap: var(--mb-content-gap, 10px);
    }

    .wrap.interactive {
      cursor: pointer;
    }

    .wrap.debug-layout {
      outline: 1px dashed rgba(255, 255, 255, 0.35);
      outline-offset: -1px;
      background: rgba(255, 255, 255, 0.02);
    }

    .wrap.below {
      grid-template-columns: auto 1fr;
      grid-template-areas:
        "icon text"
        "bar bar";
    }

    .wrap.stacked {
      grid-template-columns: 1fr;
      grid-template-areas:
        "icon"
        "text"
        "bar";
      justify-items: center;
    }

    .wrap.inline .icon,
    .wrap.below .icon {
      width: 36px;
      height: 36px;
      margin: ${INLINE_ICON_SLOT_MARGIN_PX}px;
    }

    .icon {
      grid-area: icon;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .wrap.debug-layout .icon {
      outline: 1px solid rgba(0, 200, 255, 0.9);
      outline-offset: -1px;
      background: rgba(0, 200, 255, 0.08);
    }

    .text {
      grid-area: text;
      min-width: 0;
    }

    .wrap.debug-layout .text {
      outline: 1px solid rgba(255, 208, 64, 0.9);
      outline-offset: -1px;
      background: rgba(255, 208, 64, 0.08);
    }


    .wrap.stacked .text {
      text-align: center;
    }

    .name {
      font-size: 14px;
      font-weight: 500;
      line-height: 1.2;
      color: var(--primary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .state {
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.2;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar {
      grid-area: bar;
      position: relative;
      box-sizing: border-box;
      padding-left: var(--mb-edge-inset, 0px);
      padding-right: var(--mb-edge-inset, 0px);
    }

    .wrap.debug-layout .bar {
      outline: 1px solid rgba(255, 128, 32, 0.9);
      outline-offset: -1px;
      background: rgba(255, 128, 32, 0.06);
    }

    .wrap.below .bar,
    .wrap.stacked .bar {
      justify-self: stretch;
      width: 100%;
    }

    .wrap.inline .bar {
      padding-right: var(--mb-inline-trailing-inset, 0px);
    }

    .bar-stack {
      display: flex;
      flex-direction: column;
      position: relative;
      padding-bottom: var(--mb-scale-reserve, 0px);
      box-sizing: border-box;
    }

    .wrap.debug-layout .bar-stack {
      outline: 1px dashed rgba(180, 120, 255, 0.9);
      outline-offset: -1px;
      background: rgba(180, 120, 255, 0.05);
    }

    .inner {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--mb-scale-gap, 6px);
      width: 100%;
      padding-left: var(--mb-inset-left, 0px);
      padding-right: var(--mb-inset-right, 0px);
      box-sizing: border-box;
    }

    .wrap.debug-layout .inner {
      outline: 1px dashed rgba(0, 255, 170, 0.9);
      outline-offset: -1px;
      background: rgba(0, 255, 170, 0.05);
    }

    .track-wrap {
      position: relative;
      width: 100%;
      padding-top: var(--mb-pointer-pad-top, 0px);
      padding-bottom: var(--mb-pointer-pad-bottom, 0px);
    }

    .wrap.debug-layout .track-wrap {
      outline: 1px dashed rgba(80, 200, 255, 0.8);
      outline-offset: -1px;
    }

    .track {
      position: relative;
      width: 100%;
      overflow: hidden;
      background: var(--mb-track-bg, var(--divider-color));
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
    }

    .wrap.debug-layout .track {
      outline: 1px solid rgba(255, 96, 96, 0.95);
      outline-offset: -1px;
    }

    .bar-svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    .pointer {
      position: absolute;
      top: var(--mb-pointer-top, -6px);
      transform: translateX(-50%);
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.25));
      pointer-events: none;
      z-index: 3;
    }

    .pointer.triangle {
      width: 0;
      height: 0;
      border-left: var(--mb-pointer-half-base) solid transparent;
      border-right: var(--mb-pointer-half-base) solid transparent;
      border-top: var(--mb-pointer-height) solid var(--mb-pointer-color);
    }


    .unavailable {
      opacity: 0.55;
      filter: grayscale(0.2);
    }

    .scale {
      width: 100%;
      position: relative;
      height: var(--mb-scale-height, 20px);
      color: var(--mb-scale-color, var(--secondary-text-color));
      font-size: var(--mb-label-font-size, ${DEFAULT_LABEL_FONT_SIZE}px);
      line-height: var(--mb-label-line-height, ${LABEL_LINE_HEIGHT});
      pointer-events: none;
      box-sizing: border-box;
      padding: 0;
      transform: translateY(var(--mb-scale-offset, 0px));
    }

    .wrap.debug-layout .scale {
      outline: 1px dashed rgba(120, 220, 255, 0.9);
      outline-offset: -1px;
      background: rgba(120, 220, 255, 0.04);
    }

    .scale.center,
    .scale.bottom,
    .scale.top {
      position: absolute;
      left: var(--mb-inset-left, 0px);
      right: var(--mb-inset-right, 0px);
      top: 0;
      width: auto;
      height: var(--mb-scale-height, 20px);
      overflow: visible;
    }

    .scale-line {
      position: absolute;
      left: 0;
      right: 0;
      top: var(--mb-scale-line-top, 10px);
      height: 2px;
      background: var(--divider-color);
      opacity: 0.7;
    }

    .tick {
      position: absolute;
      transform: translateX(-50%);
      width: 1px;
      background: var(--mb-scale-color, var(--secondary-text-color));
      height: var(--mb-tick-height, 8px);
      top: var(--mb-tick-top, 6px);
      opacity: 0.9;
    }

    .tick.major {
      width: 2px;
      background: var(--mb-scale-color-strong, var(--primary-text-color));
      height: var(--mb-tick-height-major, 12px);
      top: var(--mb-tick-top-major, 4px);
    }

    .label {
      position: absolute;
      top: var(--mb-label-top, 18px);
      white-space: nowrap;
      color: var(--mb-scale-color, var(--secondary-text-color));
      text-shadow: var(--mb-scale-shadow, none);
      transform: translateX(-50%);
    }

    .wrap.debug-layout .label {
      outline: 1px dotted rgba(255, 255, 255, 0.35);
      outline-offset: 0;
    }

    .measure {
      position: absolute;
      visibility: hidden;
      white-space: nowrap;
      pointer-events: none;
      font-size: var(--mb-label-font-size, ${DEFAULT_LABEL_FONT_SIZE}px);
      line-height: var(--mb-label-line-height, ${LABEL_LINE_HEIGHT});
      font-weight: normal;
      letter-spacing: normal;
      left: 0;
      top: 0;
    }
  `;
}
