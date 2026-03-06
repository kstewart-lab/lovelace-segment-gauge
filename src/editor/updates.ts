/**
 * Responsibility: Central editor patch application, config ordering, and config-changed emission.
 * Allowed dependencies: config types, pure patch helpers, and validation.
 * Forbidden concerns: Lit section rendering, DOM querying, runtime measurement/geometry logic.
 */
import type { ActionConfig, Level, SegmentGaugeConfig } from "../ha-types";
import { applyPatch } from "../shared";
import { validateConfig } from "../runtime/validate";

export type SegmentGaugeActionKey = "tap_action" | "hold_action" | "double_tap_action";

type DeepPartial<T> = T extends (infer U)[]
  ? Array<DeepPartial<U>>
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type SegmentGaugePatch = DeepPartial<SegmentGaugeConfig>;

export interface EditorConfigUpdate {
  config: SegmentGaugeConfig;
  warnings: readonly string[];
}

function orderObject<T extends Record<string, unknown>>(
  obj: T | undefined,
  preferred: string[],
  nested: Record<string, (value: unknown) => unknown> = {}
): T | undefined {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out: Record<string, unknown> = {};
  const preferredSet = new Set(preferred);
  for (const key of preferred) {
    const value = obj[key];
    if (value === undefined) continue;
    out[key] = nested[key] ? nested[key](value) : value;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || preferredSet.has(key)) continue;
    out[key] = nested[key] ? nested[key](value) : value;
  }
  return out as T;
}

export function orderEditorConfig(cfg: SegmentGaugeConfig): SegmentGaugeConfig {
  const orderContent = (v: any) =>
    orderObject(v, ["name", "show_icon", "show_name", "show_state", "icon", "icon_color"], {
      icon_color: (c: any) => orderObject(c, ["mode", "value"]),
    });
  const orderData = (v: any) => orderObject(v, ["min", "max", "precision", "unit"]);
  const orderLayout = (v: any) => orderObject(v, ["mode", "split_pct", "gauge_alignment", "content_spacing"]);
  const orderBar = (v: any) =>
    orderObject(v, ["show", "height", "edge", "radius", "color_mode", "fill_mode", "track", "segments", "snapping"], {
      track: (t: any) => orderObject(t, ["background", "intensity"]),
      segments: (s: any) => orderObject(s, ["mode", "width", "gap", "segments_per_level"]),
      snapping: (s: any) => orderObject(s, ["fill", "color"]),
    });
  const orderPointer = (v: any) => orderObject(v, ["show", "size", "angle", "y_offset", "color_mode", "color"]);
  const orderScale = (v: any) =>
    orderObject(v, ["show", "placement", "y_offset", "spacing", "ticks", "labels"], {
      ticks: (t: any) => orderObject(t, ["color_mode", "color", "major_count", "minor_per_major", "height_major", "height_minor"]),
      labels: (l: any) => orderObject(l, ["show", "precision", "size", "y_offset", "color_mode", "color"]),
    });
  const orderActions = (v: any) => orderObject(v, ["tap_action", "hold_action", "double_tap_action"]);
  const orderStyle = (v: any) => orderObject(v, ["card", "debug_layout"]);

  return (
    orderObject(cfg as any, ["type", "entity", "content", "style", "layout", "data", "levels", "bar", "pointer", "scale", "actions"], {
      content: orderContent,
      data: orderData,
      layout: orderLayout,
      bar: orderBar,
      pointer: orderPointer,
      scale: orderScale,
      actions: orderActions,
      style: orderStyle,
    }) ?? cfg
  );
}

function toUpdate(config: SegmentGaugeConfig): EditorConfigUpdate {
  const ordered = orderEditorConfig(config);
  return {
    config: ordered,
    warnings: validateConfig(ordered).warnings,
  };
}

export function applyEditorPatch(config: SegmentGaugeConfig, patch: SegmentGaugePatch): EditorConfigUpdate {
  return toUpdate(applyPatch(config, patch));
}

function defaultAction(which: SegmentGaugeActionKey): ActionConfig {
  if (which === "tap_action") return { action: "more-info" };
  return { action: "none" };
}

export function ensureAction(which: SegmentGaugeActionKey, obj: any): ActionConfig {
  if (!obj || typeof obj !== "object") return defaultAction(which);
  if (typeof obj.action !== "string") return defaultAction(which);
  return obj as ActionConfig;
}

export function applyEditorActionPatch(
  config: SegmentGaugeConfig,
  which: SegmentGaugeActionKey,
  patch: Partial<ActionConfig>
): EditorConfigUpdate {
  const current = ensureAction(which, (config as any).actions?.[which]);
  const next = { ...current, ...patch } as ActionConfig;
  return applyEditorPatch(config, { actions: { [which]: next } } as SegmentGaugePatch);
}

export function replaceEditorLevels(config: SegmentGaugeConfig, levels: Level[]): EditorConfigUpdate {
  return applyEditorPatch(config, { levels });
}

export function emitConfigChanged(host: HTMLElement, config: SegmentGaugeConfig): void {
  host.dispatchEvent(
    new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    })
  );
}
