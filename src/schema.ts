import { DEFAULTS } from "./shared";

export type SegmentGaugeConfigField = {
  key: string;
  label: string;
  description?: string;
  group: "basic" | "advanced" | "actions";
  kind: "entity" | "text" | "number" | "boolean" | "select";
  options?: Array<{ value: any; label: string }>;
  default?: unknown;
};

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: any = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[part];
  }
  return cur;
}

function cloneDefaultValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => cloneDefaultValue(v)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = cloneDefaultValue(v);
    }
    return out as T;
  }
  return value;
}

function withDefault(field: Omit<SegmentGaugeConfigField, "default">): SegmentGaugeConfigField {
  const value = getByPath(DEFAULTS, field.key);
  return value === undefined ? field : { ...field, default: cloneDefaultValue(value) };
}

/**
 * Internal schema used for documentation and to keep the editor/config surface consistent.
 * This is intentionally lightweight (not HA selector-schema), to avoid coupling to frontend internals.
 */
export const SEGMENT_GAUGE_CONFIG_SCHEMA: SegmentGaugeConfigField[] = [
  withDefault({ key: "entity", label: "Entity", group: "basic", kind: "entity" }),
  withDefault({ key: "content.name", label: "Name", group: "basic", kind: "text" }),
  withDefault({
    key: "layout.mode",
    label: "Layout mode",
    group: "basic",
    kind: "select",
    options: [
      { value: "horizontal", label: "Horizontal" },
      { value: "vertical", label: "Vertical" },
      { value: "stacked", label: "Stacked" },
    ],
  }),
  withDefault({
    key: "layout.gauge_alignment",
    label: "Gauge alignment",
    group: "basic",
    kind: "select",
    options: [
      { value: "center_bar", label: "Center (bar)" },
      { value: "center_labels", label: "Center (labels)" },
    ],
  }),
  withDefault({ key: "bar.height", label: "Bar height", group: "basic", kind: "number" }),

  withDefault({ key: "content.show_name", label: "Show name", group: "basic", kind: "boolean" }),
  withDefault({ key: "content.show_state", label: "Show state", group: "basic", kind: "boolean" }),
  withDefault({ key: "content.show_icon", label: "Show icon", group: "basic", kind: "boolean" }),
  withDefault({ key: "content.icon", label: "Icon", group: "basic", kind: "text" }),
  withDefault({ key: "layout.content_spacing", label: "Content spacing", group: "basic", kind: "number" }),
  withDefault({
    key: "content.icon_color.mode",
    label: "Icon color mode",
    group: "basic",
    kind: "select",
    options: [
      { value: "theme", label: "Theme" },
      { value: "state", label: "State" },
      { value: "level", label: "Level color" },
      { value: "custom", label: "Custom" },
    ],
  }),
  withDefault({ key: "content.icon_color.value", label: "Icon color", group: "basic", kind: "text" }),
  withDefault({ key: "style.debug_layout", label: "Debug layout", group: "basic", kind: "boolean" }),

  // Advanced
  withDefault({ key: "pointer.size", label: "Pointer size", group: "advanced", kind: "number" }),
  withDefault({ key: "pointer.color", label: "Pointer color", group: "advanced", kind: "text" }),
  withDefault({ key: "data.precision", label: "Precision", group: "advanced", kind: "number" }),
  withDefault({ key: "data.unit", label: "Unit override", group: "advanced", kind: "text" }),
  withDefault({ key: "data.min", label: "Min", group: "advanced", kind: "number" }),
  withDefault({ key: "data.max", label: "Max", group: "advanced", kind: "number" }),
  withDefault({ key: "scale.show", label: "Show scale", group: "advanced", kind: "boolean" }),
  withDefault({ key: "scale.ticks.major_count", label: "Scale major ticks", group: "advanced", kind: "number" }),
  withDefault({ key: "scale.ticks.minor_per_major", label: "Scale minor ticks", group: "advanced", kind: "number" }),
  withDefault({ key: "scale.labels.show", label: "Scale labels", group: "advanced", kind: "boolean" }),
  withDefault({ key: "scale.placement", label: "Scale placement", group: "advanced", kind: "text" }),
  withDefault({ key: "scale.spacing", label: "Scale tick spacing", group: "advanced", kind: "text" }),
  withDefault({ key: "bar.segments.segments_per_level", label: "Segments per level", group: "advanced", kind: "number" }),

  // Actions
  withDefault({ key: "actions.tap_action", label: "Tap action", group: "actions", kind: "text" }),
  withDefault({ key: "actions.hold_action", label: "Hold action", group: "actions", kind: "text" }),
  withDefault({ key: "actions.double_tap_action", label: "Double tap action", group: "actions", kind: "text" }),
];
