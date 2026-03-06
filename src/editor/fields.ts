/**
 * Responsibility: Convert editor event payloads into typed scalar values and patch fragments.
 * Allowed dependencies: editor patch type definitions and local coercion helpers.
 * Forbidden concerns: Lit rendering, DOM querying, config ordering, event emission.
 */
import type { SegmentGaugePatch } from "./updates";

type EventLike = {
  detail?: { value?: unknown };
  target?: { value?: unknown; checked?: unknown };
};

export interface NumericFieldOptions {
  min?: number;
  max?: number;
  round?: boolean;
}

export function readEventValue(event: unknown): unknown {
  const e = event as EventLike | undefined;
  if (e?.detail && "value" in e.detail) return e.detail.value;
  return e?.target?.value;
}

export function readEventChecked(event: unknown): boolean {
  const e = event as EventLike | undefined;
  if (typeof e?.target?.checked === "boolean") return e.target.checked;
  if (typeof e?.detail?.value === "boolean") return e.detail.value;
  return Boolean(readEventValue(event));
}

export function readEventNumberOrNull(event: unknown): number | null {
  return asNumberOrNull(readEventValue(event));
}

export function asNumberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function coerceNumericValue(value: number, options: NumericFieldOptions = {}): number {
  let next = value;
  if (options.round) next = Math.round(next);
  if (typeof options.min === "number") next = Math.max(options.min, next);
  if (typeof options.max === "number") next = Math.min(options.max, next);
  return next;
}

export function asOptionalString(value: unknown): string | undefined {
  const s = String(value ?? "");
  return s === "" ? undefined : s;
}

export function asString(value: unknown): string {
  return String(value ?? "");
}

export function buildPatch(path: readonly string[], value: unknown): SegmentGaugePatch {
  if (path.length === 0) return {} as SegmentGaugePatch;
  let acc: Record<string, unknown> = { [path[path.length - 1]]: value };
  for (let i = path.length - 2; i >= 0; i -= 1) {
    acc = { [path[i]]: acc };
  }
  return acc as SegmentGaugePatch;
}
