import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { fixture, html } from "@open-wc/testing";
import {
  normalizeBarColorMode,
  normalizeBarFillMode,
  normalizeColorSnappingMode,
  normalizeFillSnappingMode,
  normalizeGaugeAlignmentMode,
  normalizeIconColorMode,
  normalizeLayoutMode,
  normalizeScalePlacementMode,
  normalizeScaleTickSpacingMode,
} from "../src/shared";
import { validateConfig } from "../src/runtime/validate";
import "../src/segment-gauge-card";
import "../src/segment-gauge-row";

type AnyConfig = Record<string, any>;

const README_PATH = resolve(process.cwd(), "README.md");
const GUI_DOC_PATH = resolve(process.cwd(), "docs/gui.md");
const ALL_OPTIONS_PATH = resolve(process.cwd(), "docs/all-options.yaml");

function extractYamlBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const re = /```yaml\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) !== null) {
    const body = match[1]?.trim();
    if (body) blocks.push(body);
  }
  return blocks;
}

type YamlLine = { indent: number; text: string; lineNo: number };

function stripYamlComment(text: string): string {
  let inSingle = false;
  let inDouble = false;
  let prev = "";

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === "\"" && !inSingle && prev !== "\\") inDouble = !inDouble;
    else if (ch === "#" && !inSingle && !inDouble) return text.slice(0, i).trimEnd();
    prev = ch;
  }
  return text.trimEnd();
}

function parseYamlScalar(raw: string): any {
  const v = raw.trim();
  if (v === "") return "";
  if (v === "null" || v === "~") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(v)) return Number(v);
  if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function parseMapEntry(lines: YamlLine[], i: number, indent: number, out: Record<string, any>): number {
  const line = lines[i];
  if (!line || line.indent !== indent || line.text.startsWith("- ")) {
    throw new Error(`Invalid mapping entry near line ${line?.lineNo ?? "EOF"}`);
  }
  const colon = line.text.indexOf(":");
  if (colon <= 0) throw new Error(`Invalid key/value at line ${line.lineNo}: ${line.text}`);

  const key = line.text.slice(0, colon).trim();
  const rest = line.text.slice(colon + 1).trim();
  i += 1;

  if (rest !== "") {
    out[key] = parseYamlScalar(rest);
    return i;
  }

  if (i < lines.length && lines[i].indent > indent) {
    const [child, next] = parseYamlNode(lines, i, lines[i].indent);
    out[key] = child;
    return next;
  }

  out[key] = null;
  return i;
}

function parseYamlMap(lines: YamlLine[], i: number, indent: number): [Record<string, any>, number] {
  const out: Record<string, any> = {};
  while (i < lines.length) {
    const line = lines[i];
    if (line.indent < indent || line.text.startsWith("- ")) break;
    if (line.indent > indent) {
      throw new Error(`Unexpected indentation at line ${line.lineNo}`);
    }
    i = parseMapEntry(lines, i, indent, out);
  }
  return [out, i];
}

function parseYamlSeq(lines: YamlLine[], i: number, indent: number): [any[], number] {
  const out: any[] = [];

  while (i < lines.length) {
    const line = lines[i];
    if (line.indent < indent || !line.text.startsWith("- ")) break;
    if (line.indent > indent) {
      throw new Error(`Unexpected indentation at line ${line.lineNo}`);
    }

    const itemText = line.text.slice(2).trim();
    i += 1;

    if (itemText === "") {
      if (i < lines.length && lines[i].indent > indent) {
        const [child, next] = parseYamlNode(lines, i, lines[i].indent);
        out.push(child);
        i = next;
      } else {
        out.push(null);
      }
      continue;
    }

    const colon = itemText.indexOf(":");
    if (colon > 0) {
      const itemObj: Record<string, any> = {};
      const firstKey = itemText.slice(0, colon).trim();
      const firstRest = itemText.slice(colon + 1).trim();

      if (firstRest !== "") {
        itemObj[firstKey] = parseYamlScalar(firstRest);
      } else if (i < lines.length && lines[i].indent > indent) {
        const [child, next] = parseYamlNode(lines, i, lines[i].indent);
        itemObj[firstKey] = child;
        i = next;
      } else {
        itemObj[firstKey] = null;
      }

      while (i < lines.length && lines[i].indent > indent && !lines[i].text.startsWith("- ")) {
        const entryIndent = lines[i].indent;
        i = parseMapEntry(lines, i, entryIndent, itemObj);
      }
      out.push(itemObj);
      continue;
    }

    out.push(parseYamlScalar(itemText));
    while (i < lines.length && lines[i].indent > indent) i += 1;
  }

  return [out, i];
}

function parseYamlNode(lines: YamlLine[], i: number, indent: number): [any, number] {
  if (i >= lines.length) return [null, i];
  if (lines[i].text.startsWith("- ")) return parseYamlSeq(lines, i, indent);
  return parseYamlMap(lines, i, indent);
}

function parseYaml(yamlText: string): AnyConfig {
  const lines: YamlLine[] = [];

  for (const [index, rawLine] of yamlText.split(/\r?\n/).entries()) {
    const commented = stripYamlComment(rawLine);
    if (!commented.trim()) continue;
    const indent = rawLine.match(/^ */)?.[0].length ?? 0;
    lines.push({ indent, text: commented.slice(indent).trimEnd(), lineNo: index + 1 });
  }

  if (lines.length === 0) return {};
  const [parsed, next] = parseYamlNode(lines, 0, lines[0].indent);
  if (next !== lines.length) {
    throw new Error(`Failed to parse YAML block fully (stopped at line ${lines[next]?.lineNo ?? "EOF"})`);
  }
  return parsed as AnyConfig;
}

function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepClone<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => deepClone(v)) as T;
  if (isObject(value)) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepClone(v);
    return out as T;
  }
  return value;
}

function deepMerge(base: AnyConfig, override: AnyConfig): AnyConfig {
  const out = deepClone(base);
  for (const [key, value] of Object.entries(override)) {
    if (isObject(value) && isObject(out[key])) {
      out[key] = deepMerge(out[key], value);
      continue;
    }
    out[key] = deepClone(value);
  }
  return out;
}

function collectGaugeConfigs(doc: AnyConfig): AnyConfig[] {
  if (!doc || typeof doc !== "object") return [];
  if (doc.type === "custom:segment-gauge" || doc.type === "custom:segment-gauge-row") {
    return [doc];
  }
  if (doc.type === "entities" && Array.isArray(doc.entities)) {
    return doc.entities.filter(
      (e: AnyConfig) => e && typeof e === "object" && (e.type === "custom:segment-gauge" || e.type === "custom:segment-gauge-row")
    );
  }
  return [];
}

const makeHass = (entityId: string, value = "42") => ({
  states: {
    [entityId]: {
      entity_id: entityId,
      state: value,
      attributes: {},
    },
  },
});

describe("README YAML examples", () => {
  const readme = readFileSync(README_PATH, "utf8");
  const guiDoc = readFileSync(GUI_DOC_PATH, "utf8");
  const allOptionsConfig = existsSync(ALL_OPTIONS_PATH)
    ? parseYaml(readFileSync(ALL_OPTIONS_PATH, "utf8"))
    : null;

  const readmeBlocks = extractYamlBlocks(readme);
  const guiBlocks = extractYamlBlocks(guiDoc);
  const parsedReadmeDocs = readmeBlocks.map(parseYaml);
  const parsedGuiDocs = guiBlocks.map(parseYaml);
  const guiSeedConfig =
    allOptionsConfig ??
    parsedGuiDocs.find((doc) => collectGaugeConfigs(doc).length > 0) ??
    null;

  const gaugeConfigs = [
    ...parsedReadmeDocs.flatMap(collectGaugeConfigs),
    ...parsedGuiDocs.flatMap((snippet) => {
      const direct = collectGaugeConfigs(snippet);
      if (direct.length > 0) return direct;
      if (!guiSeedConfig) return [];
      return collectGaugeConfigs(deepMerge(guiSeedConfig, snippet));
    }),
  ];

  it("contains YAML blocks that parse successfully", () => {
    expect(readmeBlocks.length).toBeGreaterThan(0);
    expect(guiBlocks.length).toBeGreaterThan(0);
    expect(parsedReadmeDocs.length).toBe(readmeBlocks.length);
    expect(parsedGuiDocs.length).toBe(guiBlocks.length);
  });

  it("contains segment gauge configs that normalize and render without errors", async () => {
    expect(gaugeConfigs.length).toBeGreaterThan(0);

    for (const cfg of gaugeConfigs) {
      const el = await fixture<any>(
        cfg.type === "custom:segment-gauge-row"
          ? html`<segment-gauge-row></segment-gauge-row>`
          : html`<segment-gauge></segment-gauge>`
      );
      el.setConfig(cfg);
      if (cfg.entity) el.hass = makeHass(cfg.entity);
      await el.updateComplete;

      const normalized = (el as any)._config as AnyConfig;
      expect(normalized).toBeTruthy();
      expect(normalized.type).toBe(cfg.type);

      if (cfg.layout?.mode !== undefined) {
        expect(normalized.layout.mode).toBe(normalizeLayoutMode(cfg.layout.mode));
      }
      if (cfg.layout?.gauge_alignment !== undefined) {
        expect(normalized.layout.gauge_alignment).toBe(
          normalizeGaugeAlignmentMode(cfg.layout.gauge_alignment)
        );
      }
      if (cfg.content?.icon_color?.mode !== undefined) {
        expect(normalized.content.icon_color.mode).toBe(
          normalizeIconColorMode(cfg.content.icon_color.mode)
        );
      }
      if (cfg.bar?.snapping?.fill !== undefined) {
        expect(normalized.bar.snapping.fill).toBe(
          normalizeFillSnappingMode(cfg.bar.snapping.fill)
        );
      }
      if (cfg.bar?.color_mode !== undefined) {
        expect(normalized.bar.color_mode).toBe(normalizeBarColorMode(cfg.bar.color_mode));
      }
      if (cfg.bar?.fill_mode !== undefined) {
        expect(normalized.bar.fill_mode).toBe(normalizeBarFillMode(cfg.bar.fill_mode));
      }
      if (cfg.bar?.snapping?.color !== undefined) {
        expect(normalized.bar.snapping.color).toBe(
          normalizeColorSnappingMode(cfg.bar.snapping.color)
        );
      }
      if (cfg.scale?.placement !== undefined) {
        expect(normalized.scale.placement).toBe(
          normalizeScalePlacementMode(cfg.scale.placement)
        );
      }
      if (cfg.scale?.spacing !== undefined) {
        expect(normalized.scale.spacing).toBe(
          normalizeScaleTickSpacingMode(cfg.scale.spacing)
        );
      }

      const validation = validateConfig(cfg);
      expect(validation.warnings).toEqual([]);
    }
  });
});
