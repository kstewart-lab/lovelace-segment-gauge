/**
 * Responsibility: Normalize runtime config into canonical values without changing behavior.
 * Allowed dependencies: shared normalization utilities and config types.
 * Forbidden concerns: DOM access, Lit/HA imports, runtime measurement, rendering.
 */
import type { SegmentGaugeConfig } from "../ha-types";
import {
  DEFAULTS,
  mergeDefaults,
  normalizeBarColorMode,
  normalizeColorSnappingMode,
  normalizeBarFillMode,
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

export function normalizeRuntimeConfig(config: SegmentGaugeConfig): SegmentGaugeConfig {
  const merged = mergeDefaults(DEFAULTS, config);

  const layoutRaw = merged.layout ?? DEFAULTS.layout;
  const layoutMode = normalizeLayoutMode(layoutRaw.mode);
  const gaugeAlignment = normalizeGaugeAlignmentMode(layoutRaw.gauge_alignment);
  merged.layout = {
    ...layoutRaw,
    mode: layoutMode,
    gauge_alignment: gaugeAlignment,
  };

  if (merged.content?.icon_color) {
    merged.content.icon_color.mode = normalizeIconColorMode(merged.content.icon_color.mode as any);
  }

  if (merged.pointer) {
    merged.pointer.color_mode = normalizePointerColorMode(merged.pointer.color_mode as any);
  }

  if (merged.bar) {
    merged.bar.color_mode = normalizeBarColorMode(merged.bar.color_mode as any);
    merged.bar.fill_mode = normalizeBarFillMode((merged.bar as any).fill_mode);
  }

  if (merged.bar?.snapping) {
    merged.bar.snapping.fill = normalizeFillSnappingMode(merged.bar.snapping.fill as any);
    merged.bar.snapping.color = normalizeColorSnappingMode(merged.bar.snapping.color as any);
  }
  if (merged.bar?.segments) {
    delete (merged.bar.segments as any).subdivisions_per_level;
  }

  const scaleRaw = merged.scale ?? DEFAULTS.scale;
  const { gap: _unusedGap, ...scaleRest } = scaleRaw as any;
  const scalePlacement = normalizeScalePlacementMode(scaleRaw.placement);
  const scaleSpacing = normalizeScaleTickSpacingMode(scaleRaw.spacing);
  merged.scale = {
    ...scaleRest,
    placement: scalePlacement,
    spacing: scaleSpacing,
  };

  if (merged.scale?.ticks) {
    merged.scale.ticks.color_mode = normalizeTickColorMode(merged.scale.ticks.color_mode as any);
  }
  if (merged.scale?.labels) {
    merged.scale.labels.color_mode = normalizeScaleColorMode(merged.scale.labels.color_mode as any);
  }

  return merged;
}
