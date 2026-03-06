/**
 * Responsibility: Build the derived runtime model and shared color/layout policy helpers.
 * Allowed dependencies: canonical config/types, pure math utilities, and segment utilities.
 * Forbidden concerns: DOM access, Lit/HA imports, browser measurement side effects.
 */
import type {
  ColorMode,
  ColorQuantization,
  FillQuantization,
  Level,
  ScaleColorMode,
  SegmentGaugeConfig,
  SegmentMode,
  TickColorMode,
  BarFillMode,
} from "../ha-types";
import {
  clamp,
  computeRadius,
  DEFAULTS,
  formatValue,
  normalizeBarColorMode,
  normalizeBarFillMode,
  normalizeColorSnappingMode,
  normalizeFillSnappingMode,
  normalizeGaugeAlignmentMode,
  normalizeIconColorMode,
  normalizeLayoutMode,
  normalizeScalePlacementMode,
  normalizeScaleTickSpacingMode,
  normalizeStops,
  stopColorForValue,
} from "../shared";
import { computeFixedBoundaries, computeLevelBoundaries, snapToBoundary } from "../segment-utils";

const DEFAULT_LABEL_FONT_SIZE = 12;
const LABEL_LINE_HEIGHT = 1.2;
const LABEL_BOTTOM_MARGIN = 2;
const SCALE_BELOW_GAP_PX = 4;

export type Rgb = { r: number; g: number; b: number };
type BarColorMode = ColorMode;

export type GradientStopDef = { offset: number; color: string };
export type FixedGapRect = { x: number; width: number };
export type ScaleTick = { pos: number; major: boolean; label?: string };

export type ScaleLayout = {
  ticks: ScaleTick[];
  style: string;
  className: string;
  height: number;
  mode: "below" | "center" | "bottom" | "top";
  labelsOn: boolean;
  tickTop: number;
  tickHeight: number;
  tickTopMajor: number;
  tickHeightMajor: number;
};

export type QuantizedColorRect = { start: number; end: number; color: string };

type SegmentRenderState = {
  blockSizePx: number;
  gapPx: number;
  striped: boolean;
  levelGaps: number[];
  segmentBoundaries: number[];
  fillPct: number;
};

export interface DeriveRuntimeModelInput {
  readonly config: SegmentGaugeConfig;
  readonly valueNum: number | null;
  readonly unavailable: boolean;
  readonly trackWidth: number;
  readonly measuredInsetLeft: number;
  readonly measuredInsetRight: number;
  readonly baseSpacing: number;
  readonly gaugeEdgeInsetPx: number;
}

export interface DerivedRuntimeModel {
  layoutClass: "inline" | "below" | "stacked";
  gaugeAlignment: "center_bar" | "center_labels";
  debugLayout: boolean;
  min: number;
  max: number;
  range: number;
  pointerLeft: number;
  splitPct: number;
  legendFr: number;
  barFr: number;
  showBar: boolean;
  hideBar: boolean;
  rawHeight: number;
  height: number;
  radius: number;
  levels: Level[];
  colorMode: BarColorMode;
  currentColor: string;
  gradStops: GradientStopDef[];
  pointerSize: number;
  pointerHeight: number;
  pointerHalfBase: number;
  pointerTop: number;
  pointerPadTop: number;
  pointerPadBottom: number;
  pointerColor: string;
  scaleShow: boolean;
  scaleLayout: ScaleLayout;
  scaleGap: number;
  scaleOffset: number;
  scaleReserve: number;
  insetLeft: number;
  insetRight: number;
  segmentMode: SegmentMode;
  fillMode: BarFillMode;
  fillQuant: FillQuantization;
  colorQuant: ColorQuantization;
  segWidth: number;
  gapPx: number;
  levelGaps: number[];
  segmentBoundaries: number[];
  fillWindow: { start: number; end: number };
  fixedGapRects: FixedGapRect[];
  trackBg: string;
  trackIntensity: number;
  trackOpacity: number;
  gapColor: string;
  tickMode: TickColorMode;
  labelMode: ScaleColorMode;
  tickCustom: string | undefined;
  labelCustom: string | undefined;
  styleVars: Record<string, string>;
}

function computeFillWindow(
  fillMode: BarFillMode,
  segmentMode: SegmentMode,
  segmentBoundaries: number[],
  fillPctRaw: number
): { start: number; end: number } {
  const end = clamp(fillPctRaw, 0, 100);
  if (fillMode !== "current_segment" || segmentMode === "off" || segmentBoundaries.length < 2) {
    return { start: 0, end };
  }
  const bounds = [...segmentBoundaries].sort((a, b) => a - b);
  if (end <= bounds[0]) return { start: bounds[0], end: bounds[1] };
  if (end >= bounds[bounds.length - 1]) return { start: bounds[bounds.length - 2], end: bounds[bounds.length - 1] };
  for (let i = 0; i < bounds.length - 1; i++) {
    const a = bounds[i];
    const b = bounds[i + 1];
    if (end <= b) return { start: a, end: b };
  }
  return { start: 0, end };
}

function buildGradientStops(
  levels: Array<{ value: number; color: string }>,
  min: number,
  max: number,
  currentColor: string,
  colorMode: BarColorMode
): GradientStopDef[] {
  if (levels.length === 0) return [{ offset: 0, color: currentColor }, { offset: 100, color: currentColor }];
  const range = max - min || 1;
  const pct = (v: number) => clamp(((v - min) / range) * 100, 0, 100);
  if (colorMode === "gradient") return levels.map((s) => ({ offset: pct(s.value), color: s.color }));
  if (colorMode === "current_level") return [{ offset: 0, color: currentColor }, { offset: 100, color: currentColor }];
  const stops: GradientStopDef[] = [];
  for (let i = 0; i < levels.length - 1; i++) {
    const a = levels[i];
    const b = levels[i + 1];
    const ap = pct(a.value);
    const bp = pct(b.value);
    stops.push({ offset: ap, color: a.color }, { offset: bp, color: a.color });
  }
  const last = levels[levels.length - 1];
  stops.push({ offset: pct(last.value), color: last.color });
  return stops;
}

export function splitTopLevelCssArgs(input: string): [string, string] {
  let depth = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === "," && depth === 0) return [input.slice(0, i).trim(), input.slice(i + 1).trim()];
  }
  return [input.trim(), ""];
}

export function resolveCssVarValue(styles: { getPropertyValue(name: string): string }, value: string, depth = 0): string {
  const trimmed = value.trim();
  if (!trimmed || depth > 8 || !trimmed.startsWith("var(") || !trimmed.endsWith(")")) return trimmed;
  const inner = trimmed.slice(4, -1).trim();
  const [name, fallback] = splitTopLevelCssArgs(inner);
  if (name.startsWith("--")) {
    const resolved = styles.getPropertyValue(name).trim();
    if (resolved) return resolveCssVarValue(styles, resolved, depth + 1);
  }
  return fallback ? resolveCssVarValue(styles, fallback, depth + 1) : trimmed;
}

export function resolveCssColor(styles: { getPropertyValue(name: string): string }, color: string): string {
  if (!color || !color.includes("var(")) return color;
  return resolveCssVarValue(styles, color);
}

export function parseRgbColor(color: string): Rgb | null {
  const c = color.trim();
  if (c.startsWith("#")) {
    const hex = c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;
    if (hex.length === 7) {
      return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
      };
    }
  }
  const rgbMatch = c.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(",").map((p) => Number(p.trim()));
    if (parts.length >= 3 && parts.every((n) => Number.isFinite(n))) {
      return { r: parts[0], g: parts[1], b: parts[2] };
    }
  }
  return null;
}

export function blendRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

export function contrastColorForRgb(bg: Rgb | null): string | null {
  if (!bg) return null;
  const lum = (0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b) / 255;
  return lum > 0.5 ? "#000000" : "#ffffff";
}

function interpolateLevelColor(
  levels: Array<{ value: number; color: string }>,
  min: number,
  max: number,
  currentColor: string,
  value: number
): string {
  const stops = levels.length ? levels : [{ value: min, color: currentColor }, { value: max, color: currentColor }];
  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (value >= stops[i].value && value <= stops[i + 1].value) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }
  const a = parseRgbColor(lower.color);
  const b = parseRgbColor(upper.color);
  if (!a || !b) return stopColorForValue(levels, value, currentColor);
  const t = upper.value === lower.value ? 0 : (value - lower.value) / (upper.value - lower.value);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
  const r = mix(a.r, b.r).toString(16).padStart(2, "0");
  const g = mix(a.g, b.g).toString(16).padStart(2, "0");
  const b2 = mix(a.b, b.b).toString(16).padStart(2, "0");
  return `#${r}${g}${b2}`;
}

export function colorForMode(
  mode: string,
  value: number,
  levels: Array<{ value: number; color: string }>,
  min: number,
  max: number,
  currentColor: string
): string {
  if (mode === "current_level" || mode === "level") return currentColor;
  if (mode === "stepped") return stopColorForValue(levels, value, currentColor);
  if (mode === "gradient") return interpolateLevelColor(levels, min, max, currentColor, value);
  return currentColor;
}

export interface IconPolicyInput {
  content: SegmentGaugeConfig["content"] | undefined;
  levels: Array<{ value: number; color: string; icon?: string }>;
  min: number;
  max: number;
  valueNum: number | null;
}

export interface IconPolicyResult {
  icon?: string;
  source: "theme" | "state" | "level" | "custom";
  styleColor?: string;
}

export function deriveIconPolicy(input: IconPolicyInput): IconPolicyResult {
  const { content, levels, min, max, valueNum } = input;
  const source = normalizeIconColorMode(content?.icon_color?.mode);
  const clamped = Number.isFinite(valueNum) ? clamp(valueNum as number, min, max) : min;

  let active: (typeof levels)[number] | undefined;
  for (const level of levels) {
    if (clamped >= level.value) active = level;
    else break;
  }
  const icon = active?.icon ?? content?.icon;

  let styleColor: string | undefined;
  if (source === "custom" && content?.icon_color?.value) {
    styleColor = String(content.icon_color.value);
  } else if (source === "theme") {
    styleColor = "var(--primary-color)";
  } else if (source === "level") {
    styleColor = stopColorForValue(levels, clamped, "var(--primary-color)");
  }

  return { icon, source, styleColor };
}

function intervalColorLevelMode(params: {
  levels: Array<{ value: number; color: string }>;
  min: number;
  max: number;
  lowValue: number;
  highValue: number;
  fallbackColor: string;
}): string {
  const { levels, min, max, lowValue, highValue, fallbackColor } = params;
  if (levels.length < 2) return fallbackColor;

  const valueToPct = (value: number) => ((value - min) / (max - min || 1)) * 100;
  const levelRanges: Array<{ start: number; end: number; color: string; leftPct: number }> = [];
  for (let i = 0; i < levels.length - 1; i++) {
    const start = levels[i].value;
    const end = levels[i + 1].value;
    if (end <= start) continue;
    levelRanges.push({
      start,
      end,
      color: levels[i].color,
      leftPct: Math.min(valueToPct(start), valueToPct(end)),
    });
  }

  let bestOverlap = -1;
  let bestLeftPct = Number.POSITIVE_INFINITY;
  let bestColor: string | null = null;
  for (const levelRange of levelRanges) {
    const overlap = Math.max(0, Math.min(highValue, levelRange.end) - Math.max(lowValue, levelRange.start));
    if (overlap > bestOverlap || (Math.abs(overlap - bestOverlap) < 1e-9 && levelRange.leftPct < bestLeftPct)) {
      bestOverlap = overlap;
      bestLeftPct = levelRange.leftPct;
      bestColor = levelRange.color;
    }
  }
  return bestColor ?? fallbackColor;
}

export interface QuantizedBarColorInput {
  colorQuant: ColorQuantization;
  segmentMode: SegmentMode;
  segmentBoundaries: number[];
  min: number;
  max: number;
  levels: Level[];
  colorAtValue: (value: number) => string;
}

export function buildQuantizedBarColorRects(input: QuantizedBarColorInput): QuantizedColorRect[] | null {
  const { colorQuant, segmentMode, segmentBoundaries, min, max, levels, colorAtValue } = input;
  if (colorQuant === "off" || segmentMode === "off") return null;

  const intervals: Array<{ a: number; b: number }> = [];
  for (let i = 0; i < segmentBoundaries.length - 1; i++) {
    const a = segmentBoundaries[i];
    const b = segmentBoundaries[i + 1];
    if (b > a) intervals.push({ a, b });
  }
  if (intervals.length === 0) return null;

  const pctToValue = (pct: number) => min + (max - min || 1) * (pct / 100);
  return intervals.map(({ a, b }) => {
    const va = pctToValue(a);
    const vb = pctToValue(b);
    const lowValue = Math.max(Math.min(va, vb), Math.min(min, max));
    const highValue = Math.min(Math.max(va, vb), Math.max(min, max));
    const midpoint = (lowValue + highValue) / 2;

    let color = colorAtValue(midpoint);
    if (colorQuant === "low") {
      color = colorAtValue(lowValue);
    } else if (colorQuant === "high") {
      color = colorAtValue(highValue);
    } else if (colorQuant === "level") {
      color = intervalColorLevelMode({
        levels,
        min,
        max,
        lowValue,
        highValue,
        fallbackColor: colorAtValue(midpoint),
      });
    }

    return { start: a, end: b, color };
  });
}

export interface ScaleColorPolicyContext {
  tickMode: TickColorMode;
  labelMode: ScaleColorMode;
  tickCustom?: string;
  labelCustom?: string;
  levels: Level[];
  min: number;
  max: number;
  currentColor: string;
  fillWindow: { start: number; end: number };
  scaleLayout: ScaleLayout;
  scaleOffset: number;
  showBar: boolean;
  barHeight: number;
  barTop: number;
  trackIntensity: number;
  cardBgRgb: Rgb | null;
  trackBgRgb: Rgb | null;
  colorAtValue: (value: number) => string;
}

export interface ScaleColorResolvers {
  tickColorFor: (value: number, pos: number, major: boolean) => string | null;
  labelColorFor: (value: number) => string | null;
}

export function createScaleColorResolvers(context: ScaleColorPolicyContext): ScaleColorResolvers {
  const {
    tickMode,
    labelMode,
    tickCustom,
    labelCustom,
    levels,
    min,
    max,
    currentColor,
    fillWindow,
    scaleLayout,
    scaleOffset,
    showBar,
    barHeight,
    barTop,
    trackIntensity,
    cardBgRgb,
    trackBgRgb,
    colorAtValue,
  } = context;
  const currentRgb = tickMode === "contrast" ? parseRgbColor(currentColor) : null;
  const trackRgb =
    tickMode === "contrast" && trackBgRgb && currentRgb
      ? blendRgb(trackBgRgb, currentRgb, trackIntensity / 100)
      : trackBgRgb ?? currentRgb;

  const tickIsOverBar = (major: boolean): boolean => {
    if (!showBar || barHeight <= 0 || scaleLayout.mode === "below") return false;
    const tickTop = major ? scaleLayout.tickTopMajor : scaleLayout.tickTop;
    const tickHeight = major ? scaleLayout.tickHeightMajor : scaleLayout.tickHeight;
    const tickMidY = tickTop + tickHeight / 2 + scaleOffset;
    return tickMidY >= barTop && tickMidY <= barTop + barHeight;
  };

  return {
    tickColorFor: (value, pos, major) => {
      if (tickMode === "theme") return null;
      if (tickMode === "custom") return tickCustom || null;
      if (tickMode === "contrast") {
        if (!tickIsOverBar(major)) {
          return contrastColorForRgb(cardBgRgb ?? trackBgRgb ?? currentRgb) ?? null;
        }
        const inFill = pos >= fillWindow.start && pos <= fillWindow.end;
        const bgRgb = inFill ? parseRgbColor(colorAtValue(value)) ?? currentRgb : trackRgb ?? currentRgb;
        return contrastColorForRgb(bgRgb) ?? null;
      }
      return colorForMode(tickMode, value, levels, min, max, currentColor);
    },
    labelColorFor: (value) => {
      if (labelMode === "theme") return null;
      if (labelMode === "custom") return labelCustom || null;
      return colorForMode(labelMode, value, levels, min, max, currentColor);
    },
  };
}

function computeSegmentRenderState(params: {
  segmentMode: string;
  levels: Array<{ value: number; color: string }>;
  min: number;
  max: number;
  trackWidth: number;
  segWidthRaw: number;
  gapWidthRaw: number;
  subdivisionsPerLevelRaw: number;
  pointerLeft: number;
  fillQuant: string;
}): SegmentRenderState {
  const { segmentMode, levels, min, max, trackWidth, segWidthRaw, gapWidthRaw, subdivisionsPerLevelRaw, pointerLeft, fillQuant } = params;
  const subdivisionsPerLevel = clamp(Math.floor(Number(subdivisionsPerLevelRaw) || 1), 1, 200);
  const segWidth = Math.max(0, segWidthRaw);
  const gapWidth = Math.max(0, gapWidthRaw);
  let blockSizePx = 0;
  let gapPx = 0;
  let striped = false;
  let levelGaps: number[] = [];
  let segmentBoundaries: number[] = [0, 100];

  if (segmentMode === "fixed" && segWidth > 0) {
    gapPx = Math.min(gapWidth, Math.max(0, segWidth - 1));
    blockSizePx = segWidth - gapPx;
    striped = blockSizePx > 0 && gapPx > 0;
    if (trackWidth > 0) segmentBoundaries = computeFixedBoundaries(trackWidth, segWidth);
  } else if (segmentMode === "level" && levels.length > 1) {
    segmentBoundaries = computeLevelBoundaries(levels, min, max, subdivisionsPerLevel);
    if (gapWidth > 0) {
      gapPx = gapWidth;
      levelGaps = segmentBoundaries.slice(1, -1);
    }
  }

  const snapped = (() => {
    if (fillQuant === "off" || segmentMode === "off") return pointerLeft;
    if (segmentMode === "fixed" && trackWidth <= 0) return pointerLeft;
    return snapToBoundary(pointerLeft, segmentBoundaries, fillQuant as any);
  })();

  return {
    blockSizePx,
    gapPx,
    striped,
    levelGaps,
    segmentBoundaries,
    fillPct: clamp(snapped, 0, 100),
  };
}

export function computeFixedGapRects(
  segmentMode: string,
  striped: boolean,
  trackWidth: number,
  gapPx: number,
  segmentBoundaries: number[]
): FixedGapRect[] {
  if (!(segmentMode === "fixed" && striped && trackWidth > 0 && gapPx > 0)) return [];
  const gapPct = (gapPx / trackWidth) * 100;
  return segmentBoundaries
    .slice(1)
    .map((boundary) => {
      const x = Math.max(0, boundary - gapPct);
      const width = Math.min(gapPct, 100 - x);
      return width > 0 ? { x, width } : null;
    })
    .filter((r): r is FixedGapRect => !!r);
}

export function computeScaleLayout(params: {
  config: SegmentGaugeConfig;
  min: number;
  max: number;
  barHeight: number;
  barTop: number;
  barVisible: boolean;
  trackHeight: number;
}): ScaleLayout {
  const { config, min, max, barHeight, barTop, barVisible, trackHeight } = params;
  const scale = config.scale ?? DEFAULTS.scale;
  const data = config.data ?? DEFAULTS.data;
  const ticksCfg = scale.ticks ?? DEFAULTS.scale.ticks;
  const labelsCfg = scale.labels ?? DEFAULTS.scale.labels;

  if (!scale.show) {
    return {
      ticks: [],
      style: "",
      className: "",
      height: 0,
      mode: "below",
      labelsOn: false,
      tickTop: 0,
      tickHeight: 0,
      tickTopMajor: 0,
      tickHeightMajor: 0,
    };
  }

  const majorTicks = Math.max(
    2,
    Math.min(40, Math.round(Number((ticksCfg as any).major_count ?? (DEFAULTS.scale.ticks as any).major_count) || 0))
  );
  const minorTicks = Math.max(
    0,
    Math.min(9, Math.round(Number((ticksCfg as any).minor_per_major ?? (DEFAULTS.scale.ticks as any).minor_per_major) || 0))
  );
  const range = max - min || 1;
  const labelsOn = labelsCfg.show !== false;
  const labelPrecision = (labelsCfg.precision ?? data.precision ?? null) as any;
  const labelFontSize = Math.max(8, Math.round(Number(labelsCfg.size ?? DEFAULTS.scale.labels.size ?? DEFAULT_LABEL_FONT_SIZE)));
  const labelLinePx = Math.ceil(labelFontSize * LABEL_LINE_HEIGHT);
  const ticks: ScaleTick[] = [];

  const tickSpacing = normalizeScaleTickSpacingMode((scale as any).spacing ?? (DEFAULTS.scale as any).spacing);
  if (tickSpacing === "levels" && (config.levels?.length ?? 0) > 0) {
    const raw = (config.levels ?? [])
      .map((s) => ({ value: Number((s as any)?.value) }))
      .filter((s) => Number.isFinite(s.value))
      .map((s) => s.value as number)
      .filter((v) => v >= min && v <= max)
      .concat([min, max])
      .sort((a, b) => a - b);
    const unique = raw.filter((v, idx) => idx === 0 || v !== raw[idx - 1]).map((value) => ({ value }));
    if (unique.length === 0) {
      for (let i = 0; i < majorTicks; i++) {
        const ratio = majorTicks === 1 ? 0 : i / (majorTicks - 1);
        const value = min + ratio * range;
        ticks.push({ pos: ratio * 100, major: true, label: labelsOn ? formatValue(value, labelPrecision) : undefined });
        if (i < majorTicks - 1 && minorTicks > 0) {
          for (let m = 1; m <= minorTicks; m++) {
            const r = (i + m / (minorTicks + 1)) / (majorTicks - 1);
            ticks.push({ pos: r * 100, major: false });
          }
        }
      }
    } else {
      for (let i = 0; i < unique.length; i++) {
        const value = unique[i].value;
        const ratio = range === 0 ? 0 : (value - min) / range;
        ticks.push({
          pos: clamp(ratio, 0, 1) * 100,
          major: true,
          label: labelsOn ? formatValue(value, labelPrecision) : undefined,
        });
        if (i < unique.length - 1 && minorTicks > 0) {
          const next = unique[i + 1].value;
          const span = next - value;
          for (let m = 1; m <= minorTicks; m++) {
            const v = value + (span * m) / (minorTicks + 1);
            const r = range === 0 ? 0 : (v - min) / range;
            ticks.push({ pos: clamp(r, 0, 1) * 100, major: false });
          }
        }
      }
    }
  } else {
    for (let i = 0; i < majorTicks; i++) {
      const ratio = majorTicks === 1 ? 0 : i / (majorTicks - 1);
      const value = min + ratio * range;
      ticks.push({ pos: ratio * 100, major: true, label: labelsOn ? formatValue(value, labelPrecision) : undefined });
      if (i < majorTicks - 1 && minorTicks > 0) {
        for (let m = 1; m <= minorTicks; m++) {
          const r = (i + m / (minorTicks + 1)) / (majorTicks - 1);
          ticks.push({ pos: r * 100, major: false });
        }
      }
    }
  }

  const placement = normalizeScalePlacementMode(scale.placement ?? DEFAULTS.scale.placement);
  const isCenter = placement === "center";
  const isBottom = placement === "bottom";
  const isTop = placement === "top";
  const barOffset = placement === "below" ? 0 : barTop;

  const scaleColor = isCenter ? "var(--primary-text-color)" : "var(--secondary-text-color)";
  const scaleStrong = isCenter ? scaleColor : "var(--primary-text-color)";
  const scaleShadow = isCenter ? "0 0 4px rgba(0,0,0,0.6)" : "none";

  const labelMargin = 3;
  const lineHeight = 2;
  let tickHeight = Math.max(1, Math.round(Number((ticksCfg as any).height_minor ?? (DEFAULTS.scale.ticks as any).height_minor)));
  let tickHeightMajor = Math.max(1, Math.round(Number((ticksCfg as any).height_major ?? (DEFAULTS.scale.ticks as any).height_major)));
  let lineTop = 0;
  let tickTop = 0;
  let tickTopMajor = 0;
  let labelTop = 0;

  if (placement === "below") {
    const anchor = Math.round(Math.max(tickHeight, tickHeightMajor) / 2 + 4);
    lineTop = Math.max(0, Math.round(anchor - lineHeight / 2));
    tickTop = Math.max(0, Math.round(anchor - tickHeight / 2));
    tickTopMajor = Math.max(0, Math.round(anchor - tickHeightMajor / 2));
    labelTop = anchor + labelMargin;
  } else if (isBottom) {
    const anchor = barVisible ? barOffset + barHeight : Math.max(barOffset + barHeight, tickHeight, tickHeightMajor);
    lineTop = Math.max(0, Math.round(anchor - lineHeight));
    tickTop = Math.max(0, Math.round(anchor - tickHeight));
    tickTopMajor = Math.max(0, Math.round(anchor - tickHeightMajor));
    labelTop = anchor + labelMargin;
  } else if (isTop) {
    const anchor = barOffset;
    lineTop = Math.max(0, Math.round(anchor));
    tickTop = Math.max(0, Math.round(anchor));
    tickTopMajor = Math.max(0, Math.round(anchor));
    labelTop = barOffset + barHeight + labelMargin;
  } else if (isCenter) {
    const anchor = barVisible
      ? Math.round(barOffset + barHeight / 2)
      : Math.max(Math.round(barOffset + barHeight / 2), Math.round(Math.max(tickHeight, tickHeightMajor) / 2));
    lineTop = Math.max(0, Math.round(anchor - lineHeight / 2));
    tickTop = Math.max(0, Math.round(anchor - tickHeight / 2));
    tickTopMajor = Math.max(0, Math.round(anchor - tickHeightMajor / 2));
    labelTop = barOffset + barHeight + labelMargin;
  }

  const lowestPart = Math.max(lineTop + lineHeight, tickTop + tickHeight, tickTopMajor + tickHeightMajor);
  const barBottom = barOffset + barHeight;
  const baseLabelTop = (isTop || isCenter) && barVisible ? barBottom + labelMargin : lowestPart + labelMargin;
  labelTop = Math.round(baseLabelTop);
  const labelOffset = Number((labelsCfg as any).y_offset ?? (DEFAULTS.scale.labels as any).y_offset ?? 0);
  if (Number.isFinite(labelOffset)) labelTop = Math.round(labelTop + labelOffset);

  const labelBlock = labelsOn ? labelLinePx + LABEL_BOTTOM_MARGIN : 0;
  let scaleHeight = labelsOn
    ? Math.max(lineTop + tickHeightMajor, labelTop + labelBlock)
    : Math.max(lineTop + tickHeightMajor, tickTop + tickHeightMajor);

  if (!barVisible && placement !== "below" && trackHeight > 0) {
    const blockTop = Math.min(lineTop, tickTop, tickTopMajor, labelTop);
    const blockBottom = Math.max(
      lineTop + lineHeight,
      tickTop + tickHeight,
      tickTopMajor + tickHeightMajor,
      labelsOn ? labelTop + labelBlock : 0
    );
    const blockHeight = blockBottom - blockTop;
    const targetTop = (trackHeight - blockHeight) / 2;
    const delta = Math.round(targetTop - blockTop);
    lineTop += delta;
    tickTop += delta;
    tickTopMajor += delta;
    labelTop += delta;
    scaleHeight = Math.max(
      lineTop + lineHeight,
      tickTop + tickHeight,
      tickTopMajor + tickHeightMajor,
      labelsOn ? labelTop + labelBlock : 0
    );
  }

  const scaleClass = placement === "below" ? "" : placement;
  const style = [
    `--mb-scale-color:${scaleColor}`,
    `--mb-scale-color-strong:${scaleStrong}`,
    `--mb-scale-shadow:${scaleShadow}`,
    `--mb-scale-height:${scaleHeight}px`,
    `--mb-scale-line-top:${lineTop}px`,
    `--mb-tick-top:${tickTop}px`,
    `--mb-tick-height:${tickHeight}px`,
    `--mb-tick-height-major:${tickHeightMajor}px`,
    `--mb-tick-top-major:${tickTopMajor}px`,
    `--mb-label-top:${labelTop}px`,
    `--mb-label-font-size:${labelFontSize}px`,
    `--mb-label-line-height:${LABEL_LINE_HEIGHT}`,
  ].join(";");

  return {
    ticks,
    style,
    className: scaleClass,
    height: scaleHeight,
    mode: placement,
    labelsOn,
    tickTop,
    tickHeight,
    tickTopMajor,
    tickHeightMajor,
  };
}

export function deriveRuntimeModel(input: DeriveRuntimeModelInput): DerivedRuntimeModel {
  const { config: c, valueNum, unavailable, trackWidth, measuredInsetLeft, measuredInsetRight, baseSpacing, gaugeEdgeInsetPx } = input;
  const layout = c.layout ?? DEFAULTS.layout;
  const layoutMode = normalizeLayoutMode(layout.mode);
  const layoutClass = layoutMode === "horizontal" ? "inline" : layoutMode === "vertical" ? "below" : "stacked";
  const gaugeAlignment =
    layoutMode === "horizontal" ? "center_labels" : normalizeGaugeAlignmentMode((layout as any).gauge_alignment);
  const style = c.style ?? DEFAULTS.style;
  const debugLayout = !!(style as any).debug_layout;
  const bar = c.bar ?? DEFAULTS.bar;
  const pointer = c.pointer ?? DEFAULTS.pointer;
  const scale = c.scale ?? DEFAULTS.scale;
  const data = c.data ?? DEFAULTS.data;

  const min = Number(data.min ?? 0);
  const max = Number(data.max ?? 100);
  const range = max - min;
  const pct = unavailable || range === 0 ? 0 : clamp(((valueNum as number) - min) / range, 0, 1);
  const pointerLeft = pct * 100;

  const rawHeight = Number(bar.height ?? DEFAULTS.bar.height);
  const edgeStyle = (bar.edge ?? DEFAULTS.bar.edge) as any;
  const showBar = bar.show ?? DEFAULTS.bar.show;
  const height = showBar ? rawHeight : 0;
  const radius = computeRadius(rawHeight, edgeStyle, (bar.radius ?? null) as any);

  const levelsRaw = (c.levels ?? []) as any[];
  const levels = normalizeStops(levelsRaw as any, min, max);
  const colorMode = normalizeBarColorMode(bar.color_mode);
  const currentColor = stopColorForValue(levels, valueNum ?? min, "var(--info-color)");
  const gradStops = buildGradientStops(levels, min, max, currentColor, colorMode);

  const pointerSize = clamp(Number(pointer.size ?? DEFAULTS.pointer.size), 0, 100);
  const pointerHeight = Math.max(4, Math.round(pointerSize * 0.6));
  const pointerAngleRaw = Number(pointer.angle ?? DEFAULTS.pointer.angle ?? 30);
  const pointerAngle = clamp(pointerAngleRaw, 10, 90);
  const pointerOffsetRaw = Number((pointer as any).y_offset ?? (DEFAULTS.pointer as any).y_offset ?? 0);
  const pointerOffset = clamp(pointerOffsetRaw, -100, 100);
  const pointerHalfBase = Math.max(1, Math.tan((pointerAngle * Math.PI) / 360) * pointerHeight);
  const pointerTopRaw = -pointerHeight + pointerOffset;
  const basePointerTopRaw = -pointerHeight;
  const pointerPadTop = Math.max(0, -basePointerTopRaw);
  const pointerPadBottom = Math.max(0, basePointerTopRaw + pointerHeight - height);
  const pointerTop = pointerTopRaw + pointerPadTop;
  const pointerColorMode = pointer.color_mode ?? DEFAULTS.pointer.color_mode ?? "custom";
  const pointerColor = (() => {
    if (pointerColorMode === "custom") return String(pointer.color ?? DEFAULTS.pointer.color ?? "#ffffff");
    if (pointerColorMode === "gradient") {
      const value = valueNum ?? min;
      const stops = levels.length
        ? levels
        : [{ value: min, color: "var(--primary-text-color)" }, { value: max, color: "var(--primary-text-color)" }];
      let lower = stops[0];
      let upper = stops[stops.length - 1];
      for (let i = 0; i < stops.length - 1; i++) {
        if (value >= stops[i].value && value <= stops[i + 1].value) {
          lower = stops[i];
          upper = stops[i + 1];
          break;
        }
      }
      const parseHex = (cstr: string) => {
        const c = cstr.trim();
        if (c.startsWith("#") && c.length === 7) {
          return { r: parseInt(c.slice(1, 3), 16), g: parseInt(c.slice(3, 5), 16), b: parseInt(c.slice(5, 7), 16) };
        }
        return null;
      };
      const a = parseHex(lower.color);
      const b = parseHex(upper.color);
      if (!a || !b) return stopColorForValue(levels, value, "var(--primary-text-color)");
      const t = upper.value === lower.value ? 0 : (value - lower.value) / (upper.value - lower.value);
      const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
      const r = mix(a.r, b.r).toString(16).padStart(2, "0");
      const g = mix(a.g, b.g).toString(16).padStart(2, "0");
      const b2 = mix(a.b, b.b).toString(16).padStart(2, "0");
      return `#${r}${g}${b2}`;
    }
    return stopColorForValue(levels, valueNum ?? min, "var(--primary-text-color)");
  })();

  const splitPctRaw = Number(layout.split_pct ?? DEFAULTS.layout.split_pct);
  const splitPct = Number.isFinite(splitPctRaw) ? clamp(splitPctRaw, 5, 95) : DEFAULTS.layout.split_pct;
  const legendFr = Number((splitPct / 100).toFixed(4));
  const barFr = Number(((100 - splitPct) / 100).toFixed(4));

  const showScale = !!scale.show;
  const trackHeight = pointerPadTop + height + pointerPadBottom;
  const scaleLayout = computeScaleLayout({
    config: c,
    min,
    max,
    barHeight: height,
    barTop: pointerPadTop,
    barVisible: !!showBar,
    trackHeight,
  });
  const scaleGap = showScale && scaleLayout.mode === "below" ? SCALE_BELOW_GAP_PX : 0;
  const scaleOffset = showScale ? Number((scale as any).y_offset ?? (DEFAULTS.scale as any).y_offset ?? 0) : 0;
  const scaleReserve =
    showScale && scaleLayout.labelsOn && scaleLayout.mode !== "below"
      ? Math.max(scaleLayout.height - (height + pointerPadTop), 0)
      : 0;

  let insetLeft = 0;
  let insetRight = 0;
  if (showScale && scaleLayout.labelsOn) {
    if (gaugeAlignment === "center_bar") {
      const insetBase = Math.max(measuredInsetLeft, measuredInsetRight);
      insetLeft = insetBase;
      insetRight = insetBase;
    } else {
      insetLeft = measuredInsetLeft;
      insetRight = measuredInsetRight;
    }
  }

  const segments = bar.segments ?? DEFAULTS.bar.segments;
  const snapping = (bar as any).snapping ?? (DEFAULTS.bar as any).snapping;
  const fillMode = normalizeBarFillMode((bar as any).fill_mode ?? (DEFAULTS.bar as any).fill_mode);
  const track = bar.track ?? DEFAULTS.bar.track;
  const segmentMode = segments.mode ?? DEFAULTS.bar.segments.mode;
  const segWidthRaw = Number(segments.width ?? DEFAULTS.bar.segments.width);
  const gapWidthRaw = Number(segments.gap ?? DEFAULTS.bar.segments.gap);
  const subdivisionsPerLevelRaw = Number((segments as any).segments_per_level ?? (DEFAULTS.bar.segments as any).segments_per_level ?? 1);
  const fillQuant = normalizeFillSnappingMode((snapping.fill as any) ?? (DEFAULTS.bar as any).snapping.fill ?? "off");
  const colorQuant = normalizeColorSnappingMode((snapping.color as any) ?? (DEFAULTS.bar as any).snapping.color ?? "off");
  const trackBg = track.background ?? "var(--ha-card-background, var(--card-background-color, #000))";
  const trackIntensity = Math.max(0, Math.min(100, Number(track.intensity ?? DEFAULTS.bar.track.intensity)));
  const gapColor = trackBg;
  const trackOpacity = Math.max(0, Math.min(1, trackIntensity / 100));
  const segWidth = Math.max(0, segWidthRaw);
  const segmentState = computeSegmentRenderState({
    segmentMode,
    levels,
    min,
    max,
    trackWidth,
    segWidthRaw,
    gapWidthRaw,
    subdivisionsPerLevelRaw,
    pointerLeft,
    fillQuant,
  });
  const { blockSizePx, gapPx, striped, levelGaps, segmentBoundaries, fillPct } = segmentState;
  const fillWindow = computeFillWindow(fillMode, segmentMode, segmentBoundaries, fillPct);
  const fixedGapRects = computeFixedGapRects(segmentMode, striped, trackWidth, gapPx, segmentBoundaries);

  const ticksCfg = scale.ticks ?? DEFAULTS.scale.ticks;
  const labelsCfg = scale.labels ?? DEFAULTS.scale.labels;
  const tickMode = (ticksCfg.color_mode ?? DEFAULTS.scale.ticks.color_mode ?? "theme") as TickColorMode;
  const labelMode = (labelsCfg.color_mode ?? DEFAULTS.scale.labels.color_mode ?? "theme") as ScaleColorMode;
  const tickCustom = ticksCfg.color;
  const labelCustom = labelsCfg.color;

  const styleVars = {
    "--mb-block-size": `${blockSizePx}px`,
    "--mb-block-gap": `${gapPx}px`,
    "--mb-gap-color": gapColor,
    "--mb-track-bg": trackBg,
    "--mb-pointer-size": `${pointerSize}px`,
    "--mb-pointer-height": `${pointerHeight}px`,
    "--mb-pointer-half-base": `${pointerHalfBase}px`,
    "--mb-pointer-color": pointerColor,
    "--mb-pointer-top": `${pointerTop}px`,
    "--mb-pointer-pad-top": `${pointerPadTop}px`,
    "--mb-pointer-pad-bottom": `${pointerPadBottom}px`,
    "--mb-edge-inset": `${layoutClass === "below" || layoutClass === "stacked" ? gaugeEdgeInsetPx : 0}px`,
    "--mb-inline-trailing-inset": `${layoutClass === "inline" ? gaugeEdgeInsetPx : 0}px`,
    "--mb-grid-cols": `auto minmax(0, ${legendFr}fr) minmax(0, ${barFr}fr)`,
    "--mb-grid-cols-text-only": `minmax(0, ${legendFr}fr) minmax(0, ${barFr}fr)`,
    "--mb-content-gap": `${Math.max(0, Math.round(baseSpacing))}px`,
    "--mb-inset-left": `${insetLeft}px`,
    "--mb-inset-right": `${insetRight}px`,
    "--mb-radius": `${radius}px`,
    "--mb-label-font-size": `${Math.max(
      8,
      Math.round(Number((scale.labels ?? DEFAULTS.scale.labels).size ?? DEFAULTS.scale.labels.size ?? DEFAULT_LABEL_FONT_SIZE))
    )}px`,
    "--mb-label-line-height": `${LABEL_LINE_HEIGHT}`,
  } as Record<string, string>;

  return {
    layoutClass,
    gaugeAlignment,
    debugLayout,
    min,
    max,
    range,
    pointerLeft,
    splitPct,
    legendFr,
    barFr,
    showBar,
    hideBar: !showBar,
    rawHeight,
    height,
    radius,
    levels,
    colorMode,
    currentColor,
    gradStops,
    pointerSize,
    pointerHeight,
    pointerHalfBase,
    pointerTop,
    pointerPadTop,
    pointerPadBottom,
    pointerColor,
    scaleShow: showScale,
    scaleLayout,
    scaleGap,
    scaleOffset,
    scaleReserve,
    insetLeft,
    insetRight,
    segmentMode,
    fillMode,
    fillQuant,
    colorQuant,
    segWidth,
    gapPx,
    levelGaps,
    segmentBoundaries,
    fillWindow,
    fixedGapRects,
    trackBg,
    trackIntensity,
    trackOpacity,
    gapColor,
    tickMode,
    labelMode,
    tickCustom,
    labelCustom,
    styleVars,
  };
}
