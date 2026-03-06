/**
 * Responsibility: Pure level list editing operations and default level generation.
 * Allowed dependencies: config level types and local color helpers.
 * Forbidden concerns: Lit rendering, DOM access, editor event dispatch, HA APIs.
 */
import type { Level } from "../ha-types";

export interface AddLevelOptions {
  min: number;
  max: number;
  precision?: number | null;
  random?: () => number;
}

function cssColorToHex(color: string | undefined | null): string | undefined {
  if (!color) return undefined;
  const c = color.trim();
  if (!c) return undefined;
  if (c.startsWith("#")) {
    if (c.length === 4) {
      const r = c[1];
      const g = c[2];
      const b = c[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    if (c.length === 7) return c.toLowerCase();
  }
  const m = c.match(/rgba?\\((\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)(?:\\s*,\\s*([\\d\\.]+))?\\)/i);
  if (m) {
    const toHex = (v: string) => {
      const n = Math.min(255, Math.max(0, parseInt(v, 10) || 0));
      return n.toString(16).padStart(2, "0");
    };
    return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`;
  }
  return undefined;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().toLowerCase();
  if (!h.startsWith("#")) return null;
  const full = h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
  if (full.length !== 7) return null;
  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);
  if (![r, g, b].every((v) => Number.isFinite(v))) return null;
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh >= 0 && hh < 1) {
    r = c;
    g = x;
  } else if (hh < 2) {
    r = x;
    g = c;
  } else if (hh < 3) {
    g = c;
    b = x;
  } else if (hh < 4) {
    g = x;
    b = c;
  } else if (hh < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const m = l - c / 2;
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function randomLightColor(random: () => number): string {
  const h = Math.floor(random() * 360);
  const s = 65 + random() * 20;
  const l = 55 + random() * 15;
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function extrapolateColor(prev: string, last: string, random: () => number): string {
  const a = hexToRgb(prev);
  const b = hexToRgb(last);
  if (!a || !b) return randomLightColor(random);
  const hslA = rgbToHsl(a.r, a.g, a.b);
  const hslB = rgbToHsl(b.r, b.g, b.b);
  let dh = hslB.h - hslA.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const h = (hslB.h + dh + 360) % 360;
  const s = Math.min(90, Math.max(40, hslB.s));
  const l = Math.min(75, Math.max(35, hslB.l));
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function nextLevelColor(levels: Level[], random: () => number): string {
  if (levels.length === 0) return "#00ff00";
  if (levels.length === 1) return randomLightColor(random);
  const prev = cssColorToHex(levels[levels.length - 2]?.color) ?? "#00ff00";
  const last = cssColorToHex(levels[levels.length - 1]?.color) ?? "#00ff00";
  return extrapolateColor(prev, last, random);
}

export function listLevels(levels: unknown): Level[] {
  return Array.isArray(levels) ? (levels as Level[]) : [];
}

export function addLevel(levels: Level[], options: AddLevelOptions): Level[] {
  const random = options.random ?? Math.random;
  const min = Number.isFinite(options.min) ? options.min : 0;
  const max = Number.isFinite(options.max) ? options.max : 100;
  const precision = Number(options.precision);
  const nextLevels = levels.slice();
  const base = nextLevels.reduce((acc, level) => (Number.isFinite(level.value) ? Math.max(acc, level.value) : acc), min);
  const range = max - min;
  let nextValue = nextLevels.length === 0 ? min : base + (range > 0 ? range * 0.2 : 0);

  if (Number.isFinite(precision) && precision >= 0) {
    const factor = 10 ** precision;
    nextValue = Math.floor(nextValue * factor) / factor;
  }

  if (Number.isFinite(min) && Number.isFinite(max)) {
    nextValue = Math.max(min, Math.min(max, nextValue));
  }

  nextLevels.push({ value: nextValue, color: nextLevelColor(nextLevels, random) });
  return nextLevels;
}

export function removeLevel(levels: Level[], index: number): Level[] {
  const nextLevels = levels.slice();
  nextLevels.splice(index, 1);
  return nextLevels;
}

export function updateLevel(levels: Level[], index: number, patch: Partial<Level>): Level[] {
  const nextLevels = levels.slice();
  const current = nextLevels[index] ?? { value: 0, color: "#00ff00" };
  nextLevels[index] = { ...current, ...patch };
  return nextLevels;
}
