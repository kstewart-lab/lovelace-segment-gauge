/**
 * Responsibility: Normalize editor-side config values to canonical model values.
 * Allowed dependencies: shared normalization utilities and config types.
 * Forbidden concerns: DOM access, Lit rendering, runtime derivation, config-changed emission.
 */
import type { SegmentGaugeConfig } from "../ha-types";
import {
  normalizeBarColorMode,
  normalizeBarFillMode,
  normalizeColorSnappingMode,
  normalizeFillSnappingMode,
  normalizeGaugeAlignmentMode,
  normalizeIconColorMode,
  normalizeLayoutMode,
  normalizePointerColorMode,
  normalizeScaleColorMode,
  normalizeScalePlacementMode,
  normalizeTickColorMode,
  normalizeScaleTickSpacingMode,
} from "../shared";

function asRecord(value: unknown): Record<string, any> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, any>;
}

export function normalizeEditorConfig(config: SegmentGaugeConfig): SegmentGaugeConfig {
  const contentRaw = asRecord(config.content) ? { ...(config.content as any) } : {};
  const layoutRaw = asRecord(config.layout) ? { ...(config.layout as any) } : {};
  const dataRaw = asRecord(config.data) ? { ...(config.data as any) } : {};
  const barRaw = asRecord(config.bar) ? { ...(config.bar as any) } : undefined;
  const pointerRaw = asRecord(config.pointer) ? { ...(config.pointer as any) } : undefined;
  const scaleRaw = asRecord(config.scale) ? { ...(config.scale as any) } : undefined;

  if (asRecord((contentRaw as any).icon_color)) {
    (contentRaw as any).icon_color = { ...(contentRaw as any).icon_color };
    (contentRaw as any).icon_color.mode = normalizeIconColorMode((contentRaw as any).icon_color.mode as any);
  }

  if (barRaw) {
    barRaw.color_mode = normalizeBarColorMode(barRaw.color_mode as any);
    (barRaw as any).fill_mode = normalizeBarFillMode((barRaw as any).fill_mode);
    if (asRecord(barRaw.segments)) {
      (barRaw as any).segments = { ...(barRaw.segments as any) };
      delete (barRaw as any).segments.subdivisions_per_level;
    }
  }

  if (barRaw?.snapping) {
    barRaw.snapping = {
      ...barRaw.snapping,
      fill: normalizeFillSnappingMode(barRaw.snapping.fill as any),
      color: normalizeColorSnappingMode(barRaw.snapping.color as any),
    };
  }

  if (pointerRaw) {
    pointerRaw.color_mode = normalizePointerColorMode(pointerRaw.color_mode as any);
  }

  const layout = {
    ...layoutRaw,
    mode: normalizeLayoutMode(layoutRaw.mode as any),
    gauge_alignment: normalizeGaugeAlignmentMode(layoutRaw.gauge_alignment as any),
  };

  const ticksRaw =
    asRecord(scaleRaw?.ticks)
      ? { ...(scaleRaw?.ticks as any), color_mode: normalizeTickColorMode((scaleRaw?.ticks as any).color_mode) }
      : scaleRaw?.ticks;
  const labelsRaw =
    asRecord(scaleRaw?.labels)
      ? { ...(scaleRaw?.labels as any), color_mode: normalizeScaleColorMode((scaleRaw?.labels as any).color_mode) }
      : scaleRaw?.labels;

  const { gap: _unusedGap, ...scaleRest } = (scaleRaw ?? {}) as any;
  const scale = {
    ...scaleRest,
    placement: normalizeScalePlacementMode(scaleRaw?.placement as any),
    spacing: normalizeScaleTickSpacingMode(scaleRaw?.spacing as any),
    ticks: ticksRaw as any,
    labels: labelsRaw as any,
  };

  return {
    ...config,
    content: contentRaw as any,
    data: dataRaw as any,
    layout,
    bar: barRaw as any,
    pointer: pointerRaw as any,
    scale,
  } as SegmentGaugeConfig;
}
