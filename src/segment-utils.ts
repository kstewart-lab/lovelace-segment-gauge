import type { Level } from "./ha-types";
import { clamp } from "./shared";

export type FillQuantization =
  | "off"
  | "down"
  | "nearest"
  | "up";

export function computeFixedBoundaries(trackWidth: number, segmentWidth: number): number[] {
  if (trackWidth <= 0 || segmentWidth <= 0) return [0, 100];
  const segPct = (segmentWidth / trackWidth) * 100;
  if (segPct <= 0) return [0, 100];
  const bounds: number[] = [0];
  for (let p = segPct; p < 100; p += segPct) bounds.push(p);
  bounds.push(100);
  return bounds;
}

export function computeLevelBoundaries(levels: Level[], min: number, max: number, subdivisionsPerLevelRaw = 1): number[] {
  if (!levels || levels.length < 2) return [0, 100];
  const subdivisionsPerLevel = Math.max(1, Math.floor(Number(subdivisionsPerLevelRaw) || 1));
  const minVal = Number.isFinite(min) ? min : levels[0]?.value ?? 0;
  const maxVal = Number.isFinite(max) ? max : levels[levels.length - 1]?.value ?? 100;
  const lo = Math.min(minVal, maxVal);
  const hi = Math.max(minVal, maxVal);
  const rng = hi - lo || 1;
  const majorBoundaries = levels
    .map((s) => s.value)
    .filter((v) => Number.isFinite(v) && v > lo && v < hi)
    .map((v) => clamp(((v - lo) / rng) * 100, 0, 100))
    .filter((p) => p > 0 && p < 100)
    .sort((a, b) => a - b);
  const deduped = majorBoundaries.filter((p, i) => i === 0 || p !== majorBoundaries[i - 1]);
  const base = [0, ...deduped, 100];
  if (subdivisionsPerLevel <= 1) return base;

  const expanded: number[] = [0];
  for (let i = 0; i < base.length - 1; i++) {
    const a = base[i];
    const b = base[i + 1];
    const step = (b - a) / subdivisionsPerLevel;
    for (let k = 1; k < subdivisionsPerLevel; k++) {
      expanded.push(a + step * k);
    }
    expanded.push(b);
  }

  return expanded
    .map((p) => clamp(p, 0, 100))
    .sort((a, b) => a - b)
    .filter((p, i, arr) => i === 0 || Math.abs(p - arr[i - 1]) > 1e-9);
}

export function snapToBoundary(pct: number, bounds: number[], mode: FillQuantization): number {
  if (!bounds || bounds.length === 0) return pct;
  const sorted = [...bounds].sort((a, b) => a - b);
  if (mode === "down") {
    return sorted.filter((b) => b <= pct).pop() ?? 0;
  }
  if (mode === "up") {
    return sorted.find((b) => b >= pct) ?? 100;
  }
  if (mode === "nearest") {
    let best = sorted[0];
    let bestDist = Math.abs(pct - best);
    for (const b of sorted) {
      const d = Math.abs(pct - b);
      if (d < bestDist) {
        bestDist = d;
        best = b;
      }
    }
    return best;
  }
  return pct;
}
