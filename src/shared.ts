import type {
  BarFillMode,
  ColorMode,
  ColorSource,
  Level,
  HassEntity,
  PointerColorMode,
  ScaleColorMode,
  SegmentGaugeConfig,
  SegmentGaugeResolvedConfig,
  TickColorMode,
} from "./ha-types";

type DeepPartial<T> = T extends (infer U)[]
  ? Array<DeepPartial<U>>
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type SegmentGaugeDefaults = SegmentGaugeResolvedConfig;

export const DEFAULTS: SegmentGaugeDefaults = {
	type: "custom:segment-gauge",
	entity: "",
	content: {
		name: "",
		show_name: true,
		show_state: true,
		show_icon: true,
		icon: undefined,
		icon_color: {
			mode: "theme",
			value: undefined,
		},
	},
	data: {
		min: 0,
		max: 100,
		precision: null,
		unit: "",
	},
	layout: {
		mode: "horizontal",
		split_pct: 50,
		gauge_alignment: "center_bar",
		content_spacing: 0,
	},
	style: {
		card: "default",
		debug_layout: false,
	},
	levels: [] as Level[],
		bar: {
			show: true,
			height: 8,
			edge: "rounded",
			radius: null,
			color_mode: "stepped",
			fill_mode: "cumulative",
			track: {
				background: undefined,
				intensity: 50,
		},
		segments: {
			mode: "off",
			width: 0,
			gap: 0,
			segments_per_level: 1,
		},
		snapping: {
			fill: "off",
			color: "off",
		},
	},
	pointer: {
		show: true,
		size: 8,
		color_mode: "custom",
		color: "#ffffff",
		angle: 90,
		y_offset: 0,
	},
	scale: {
		show: false,
		placement: "below",
		spacing: "even",
		y_offset: 0,
		ticks: {
			major_count: 5,
			minor_per_major: 0,
			height_major: 12,
			height_minor: 8,
			color_mode: "theme",
			color: undefined,
		},
		labels: {
			show: true,
			precision: null,
			size: 12,
			y_offset: 0,
			color_mode: "theme",
			color: undefined,
		},
	},
	actions: {
		tap_action: { action: "more-info" },
		hold_action: { action: "none" },
		double_tap_action: { action: "none" },
	},
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object" && !Array.isArray(value);
}

export function mergeDefaults<T>(defaults: T, config?: DeepPartial<T>): T {
	if (!isPlainObject(defaults)) {
		return (config === undefined ? defaults : (config as T));
	}
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(defaults)) {
		if (isPlainObject(value)) {
			result[key] = mergeDefaults(value as any, undefined);
		} else if (Array.isArray(value)) {
			result[key] = [...value];
		} else {
			result[key] = value as any;
		}
	}
	if (!isPlainObject(config)) return result as T;

	for (const [key, value] of Object.entries(config)) {
		if (value === undefined) continue;
		const baseVal = (defaults as any)[key];
		if (isPlainObject(baseVal) && isPlainObject(value)) {
			result[key] = mergeDefaults(baseVal, value as any);
		} else {
			result[key] = value as any;
		}
	}
	return result as T;
}

export function applyPatch<T>(base: T, patch?: DeepPartial<T>): T {
	if (!isPlainObject(base)) {
		return (patch === undefined ? base : (patch as T));
	}
	const result: Record<string, unknown> = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
	if (!isPlainObject(patch)) return result as T;

	for (const [key, value] of Object.entries(patch)) {
		const baseVal = (base as any)[key];
		if (isPlainObject(baseVal) && isPlainObject(value)) {
			result[key] = applyPatch(baseVal, value as any);
		} else {
			result[key] = value as any;
		}
	}
	return result as T;
}

export function clamp(v: number, lo: number, hi: number): number {
  if (Number.isNaN(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

export function normalizeLayoutMode(layout?: string): "horizontal" | "vertical" | "stacked" {
  const v = (layout ?? "").toString().trim().toLowerCase();
  if (v === "horizontal") return "horizontal";
  if (v === "vertical") return "vertical";
  if (v === "stacked") return "stacked";
  return "horizontal";
}

export function normalizeScalePlacementMode(mode?: string): "below" | "center" | "bottom" | "top" {
  const v = (mode ?? "").toString().trim().toLowerCase();
  if (v === "center" || v === "bottom" || v === "below" || v === "top") return v;
  return "below";
}

export function normalizeScaleTickSpacingMode(mode?: string): "even" | "levels" {
  const v = (mode ?? "").toString().trim().toLowerCase();
  if (v === "levels") return "levels";
  if (v === "even") return "even";
  return "even";
}

export function normalizeGaugeAlignmentMode(mode?: string): "center_bar" | "center_labels" {
  const v = (mode ?? "").toString().trim().toLowerCase();
  if (v === "center_labels") return "center_labels";
  if (v === "center_bar") return "center_bar";
  return "center_bar";
}

export function normalizeIconColorMode(mode?: string): ColorSource {
  const v = (mode ?? "").toString().trim().toLowerCase();
  if (v === "theme") return "theme";
  if (v === "state") return "state";
  if (v === "level") return "level";
  if (v === "custom") return "custom";
  return "theme";
}

export function normalizePointerColorMode(mode?: string): PointerColorMode {
  const v = (mode ?? "").toString().trim().toLowerCase();
  if (v === "gradient") return "gradient";
  if (v === "level") return "level";
  if (v === "custom") return "custom";
  return (DEFAULTS.pointer.color_mode as any) ?? "custom";
}

export function normalizeScaleColorMode(mode?: string): ScaleColorMode {
  const v = (mode ?? "").toString().trim().toLowerCase();
  if (v === "theme") return "theme";
  if (v === "gradient") return "gradient";
  if (v === "stepped") return "stepped";
  if (v === "level") return "level";
  if (v === "custom") return "custom";
  return (DEFAULTS.scale.labels.color_mode as any) ?? "theme";
}

export function normalizeTickColorMode(mode?: string): TickColorMode {
  const v = (mode ?? "").toString().trim().toLowerCase();
  if (v === "contrast") return "contrast";
  return normalizeScaleColorMode(v) as TickColorMode;
}

export function normalizeBarColorMode(mode?: string): ColorMode {
  const v = (mode ?? "").toString().trim().toLowerCase();
  if (v === "gradient") return "gradient";
  if (v === "stepped") return "stepped";
  if (v === "current_level") return "current_level";
  return DEFAULTS.bar.color_mode ?? "stepped";
}

export function normalizeBarFillMode(mode?: string): BarFillMode {
  const v = (mode ?? "").toString().trim().toLowerCase();
  if (v === "current_segment") return "current_segment";
  if (v === "cumulative") return "cumulative";
  return (DEFAULTS.bar as any).fill_mode ?? "cumulative";
}

export function normalizeFillSnappingMode(mode?: string): "off" | "down" | "nearest" | "up" {
  const v = (mode ?? "").toString().trim().toLowerCase();
  if (v === "off") return "off";
  if (v === "down") return "down";
  if (v === "nearest") return "nearest";
  if (v === "up") return "up";
  return "off";
}

export function normalizeColorSnappingMode(mode?: string): "off" | "level" | "midpoint" | "high" | "low" {
  const v = (mode ?? "").toString().trim().toLowerCase();
  if (v === "off") return "off";
  if (v === "level") return "level";
  if (v === "midpoint") return "midpoint";
  if (v === "high") return "high";
  if (v === "low") return "low";
  return "off";
}

export function asNumber(x: unknown): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

export function normalizeStops(stops: Level[], min: number, max: number): Level[] {
  const out = (stops ?? [])
    .map((s) => ({
      value: asNumber((s as any)?.value),
      color: String((s as any)?.color ?? "").trim(),
      icon: String((s as any)?.icon ?? "").trim() || undefined,
    }))
    .filter((s) => s.value !== null && s.color.length > 0)
    .map((s) => ({ value: s.value as number, color: s.color, icon: s.icon }))
    .sort((a, b) => a.value - b.value);

  if (out.length === 0) return [];
  if (out[0].value > min) out.unshift({ value: min, color: out[0].color, icon: out[0].icon });
  if (out[out.length - 1].value < max)
    out.push({ value: max, color: out[out.length - 1].color, icon: out[out.length - 1].icon });
  return out;
}

export function stopsToGradient(stops: Level[], min: number, max: number, smooth: boolean): string | null {
  const norm = normalizeStops(stops, min, max);
  if (norm.length === 0) return null;

  const range = max - min;
  const pct = (v: number) => (range === 0 ? 0 : ((v - min) / range) * 100);

  const parts: string[] = [];
  for (let i = 0; i < norm.length - 1; i++) {
    const a = norm[i];
    const b = norm[i + 1];
    const ap = clamp(pct(a.value), 0, 100);
    const bp = clamp(pct(b.value), 0, 100);

    if (smooth) {
      parts.push(`${a.color} ${ap.toFixed(3)}%`, `${b.color} ${bp.toFixed(3)}%`);
    } else {
      parts.push(`${a.color} ${ap.toFixed(3)}%`, `${a.color} ${bp.toFixed(3)}%`);
    }
  }

  const cleaned: string[] = [];
  for (const p of parts) {
    if (cleaned.length === 0 || cleaned[cleaned.length - 1] !== p) cleaned.push(p);
  }

  return `linear-gradient(90deg, ${cleaned.join(", ")})`;
}

export function stopColorForValue(stops: Level[] | undefined, value: number, fallback: string): string {
  if (!stops || stops.length === 0) return fallback;
  // Editor should persist sorted; sort defensively anyway.
  const sorted = [...stops].sort((a, b) => a.value - b.value);
  let color = sorted[0]?.color ?? fallback;
  for (const s of sorted) {
    if (value >= s.value) color = s.color;
    else break;
  }
  return color;
}

export function formatValue(value: number, precision: number | null): string {
  if (precision === null || precision === undefined) {
    const isInt = Math.abs(value - Math.round(value)) < 1e-9;
    precision = isInt ? 0 : 1;
  }
  return value.toFixed(precision);
}

export function getUnit(config: SegmentGaugeConfig, stateObj?: HassEntity): string {
  const unit = (config.data as any)?.unit;
  if (unit !== undefined && unit !== null && String(unit).length > 0) {
    return String(unit);
  }
  return String((stateObj?.attributes as any)?.unit_of_measurement ?? "");
}

export function computeRadius(height: number, edgeStyle: "rounded" | "square", radius: number | null): number {
  if (radius !== null && radius !== undefined) return Number(radius);
  return edgeStyle === "rounded" ? Math.round(height / 2) : 0;
}

export function isUnavailable(stateObj?: HassEntity, valueNum?: number | null): boolean {
  if (!stateObj) return true;
  if (stateObj.state === "unavailable" || stateObj.state === "unknown") return true;
  if (valueNum === null || valueNum === undefined) return true;
  return false;
}
