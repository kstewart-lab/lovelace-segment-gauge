/**
 * Responsibility: Validate raw card configuration and return warnings only.
 * Allowed dependencies: shared type definitions and local pure helpers.
 * Forbidden concerns: config mutation, DOM access, Lit/HA UI imports, rendering behavior.
 */
export interface ValidationResult {
  warnings: readonly string[];
}

const TOP_LEVEL_KEYS = new Set([
  "type",
  "entity",
  "content",
  "style",
  "layout",
  "data",
  "levels",
  "bar",
  "pointer",
  "scale",
  "actions",
  // Lovelace host fields that can appear on custom cards and should not warn.
  "grid_options",
  "view_layout",
  "visibility",
]);

const LAYOUT_KEYS = new Set(["mode", "split_pct", "gauge_alignment", "content_spacing"]);
const POINTER_KEYS = new Set(["show", "size", "angle", "y_offset", "color_mode", "color"]);
const SCALE_KEYS = new Set(["show", "placement", "spacing", "y_offset", "ticks", "labels"]);
const SCALE_TICK_KEYS = new Set(["major_count", "minor_per_major", "height_minor", "height_major", "color_mode", "color"]);
const SCALE_LABEL_KEYS = new Set(["show", "precision", "size", "y_offset", "color_mode", "color"]);
const SEGMENT_KEYS = new Set(["mode", "width", "gap", "segments_per_level"]);
const LEVEL_KEYS = new Set(["value", "color", "icon"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function pushUnknownKeys(
  prefix: string,
  obj: Record<string, unknown>,
  allowed: Set<string>,
  warnings: string[],
  ignored?: Set<string>
) {
  for (const key of Object.keys(obj)) {
    if (ignored?.has(key)) continue;
    if (!allowed.has(key)) {
      warnings.push(`Unknown field "${prefix}${key}"`);
    }
  }
}

function pushInvalidEnum(path: string, value: unknown, allowed: readonly string[], warnings: string[]) {
  if (value === undefined || value === null) return;
  if (typeof value !== "string" || !allowed.includes(value)) {
    warnings.push(`Invalid value "${String(value)}" for ${path} (allowed: ${allowed.join(" | ")})`);
  }
}

export function validateConfig(config: unknown): ValidationResult {
  const warnings: string[] = [];
  if (!isObject(config)) return { warnings };

  for (const key of Object.keys(config)) {
    if (!TOP_LEVEL_KEYS.has(key)) {
      warnings.push(`Unknown field "${key}"`);
    }
  }

  const layout = isObject(config.layout) ? config.layout : undefined;
  if (layout) {
    pushUnknownKeys("layout.", layout, LAYOUT_KEYS, warnings);
    pushInvalidEnum("layout.mode", layout.mode, ["horizontal", "vertical", "stacked"], warnings);
    pushInvalidEnum("layout.gauge_alignment", layout.gauge_alignment, ["center_bar", "center_labels"], warnings);
  }

  const pointer = isObject(config.pointer) ? config.pointer : undefined;
  if (pointer) {
    pushUnknownKeys("pointer.", pointer, POINTER_KEYS, warnings);
    pushInvalidEnum("pointer.color_mode", pointer.color_mode, ["gradient", "level", "custom"], warnings);
  }

  const bar = isObject(config.bar) ? config.bar : undefined;
  if (bar) {
    pushInvalidEnum("bar.edge", bar.edge, ["rounded", "square"], warnings);
    pushInvalidEnum("bar.color_mode", bar.color_mode, ["stepped", "gradient", "current_level"], warnings);
    pushInvalidEnum("bar.fill_mode", bar.fill_mode, ["cumulative", "current_segment"], warnings);

    const segments = isObject(bar.segments) ? bar.segments : undefined;
    if (segments) {
      pushUnknownKeys("segments.", segments, SEGMENT_KEYS, warnings, new Set(["subdivisions_per_level"]));
      if ("subdivisions_per_level" in segments) {
        warnings.push(`Removed legacy field "subdivisions_per_level"`);
      }
      pushInvalidEnum("segments.mode", segments.mode, ["off", "level", "fixed"], warnings);
    }

    const snapping = isObject(bar.snapping) ? bar.snapping : undefined;
    if (snapping) {
      pushInvalidEnum("snapping.fill", snapping.fill, ["off", "down", "nearest", "up"], warnings);
      pushInvalidEnum("snapping.color", snapping.color, ["off", "level", "midpoint", "high", "low"], warnings);
    }
  }

  const scale = isObject(config.scale) ? config.scale : undefined;
  if (scale) {
    pushUnknownKeys("scale.", scale, SCALE_KEYS, warnings, new Set(["gap"]));
    if ("gap" in scale) {
      warnings.push(`Removed legacy field "scale.gap"`);
    }
    pushInvalidEnum("scale.placement", scale.placement, ["below", "bottom", "center", "top"], warnings);
    pushInvalidEnum("scale.spacing", scale.spacing, ["even", "levels"], warnings);

    const ticks = isObject(scale.ticks) ? scale.ticks : undefined;
    if (ticks) {
      pushUnknownKeys("scale.ticks.", ticks, SCALE_TICK_KEYS, warnings);
      pushInvalidEnum("scale.ticks.color_mode", ticks.color_mode, ["theme", "gradient", "stepped", "level", "custom", "contrast"], warnings);
    }

    const labels = isObject(scale.labels) ? scale.labels : undefined;
    if (labels) {
      pushUnknownKeys("scale.labels.", labels, SCALE_LABEL_KEYS, warnings);
      pushInvalidEnum("scale.labels.color_mode", labels.color_mode, ["theme", "gradient", "stepped", "level", "custom"], warnings);
    }
  }

  const levels = config.levels;
  if (Array.isArray(levels)) {
    levels.forEach((level, index) => {
      if (!isObject(level)) return;
      for (const key of Object.keys(level)) {
        if (!LEVEL_KEYS.has(key)) {
          warnings.push(`Unknown field "levels[${index}].${key}"`);
        }
      }
    });
  }

  const content = isObject(config.content) ? config.content : undefined;
  if (content && isObject(content.icon_color)) {
    pushInvalidEnum("content.icon_color.mode", content.icon_color.mode, ["theme", "state", "level", "custom"], warnings);
  }

  const style = isObject(config.style) ? config.style : undefined;
  if (style) {
    pushInvalidEnum("style.card", style.card, ["default", "plain"], warnings);
  }

  const actions = isObject(config.actions) ? config.actions : undefined;
  if (actions) {
    const actionAllowed = ["none", "more-info", "toggle", "navigate", "url", "call-service"] as const;
    const tap = isObject(actions.tap_action) ? actions.tap_action : undefined;
    const hold = isObject(actions.hold_action) ? actions.hold_action : undefined;
    const dbl = isObject(actions.double_tap_action) ? actions.double_tap_action : undefined;
    if (tap) pushInvalidEnum("actions.tap_action.action", tap.action, actionAllowed, warnings);
    if (hold) pushInvalidEnum("actions.hold_action.action", hold.action, actionAllowed, warnings);
    if (dbl) pushInvalidEnum("actions.double_tap_action.action", dbl.action, actionAllowed, warnings);
  }

  return { warnings };
}
