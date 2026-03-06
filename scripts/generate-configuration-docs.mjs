import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const docPath = resolve(process.cwd(), "docs/configuration.md");
const metaPath = resolve(process.cwd(), "docs/configuration.tables.json");

const doc = readFileSync(docPath, "utf8");
const meta = JSON.parse(readFileSync(metaPath, "utf8"));

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>");
}

function renderTable(headers, rows) {
  const head = `| ${headers.map(escapeCell).join(" | ")} |`;
  const sep = `|${headers.map(() => "---").join("|")}|`;
  const body = rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`).join("\n");
  return [head, sep, body].filter(Boolean).join("\n");
}

function renderEnumBlock(enumDef) {
  const name = String(enumDef.name ?? "").trim();
  const values = Array.isArray(enumDef.values) ? enumDef.values : [];
  const lines = [`Enum values for \`${name}\`:`];
  for (const item of values) {
    const value = escapeCell(item?.[0] ?? "");
    const description = escapeCell(item?.[1] ?? "");
    lines.push(`- \`${value}\`: ${description}`);
  }
  return lines.join("\n");
}

let nextDoc = doc;
for (const table of meta.tables ?? []) {
  const id = table.id;
  const start = `<!-- AUTOGEN:${id}:START -->`;
  const end = `<!-- AUTOGEN:${id}:END -->`;
  const re = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  if (!re.test(nextDoc)) {
    throw new Error(`Missing marker block for table id: ${id}`);
  }
  const rendered = `${start}\n${renderTable(table.headers ?? [], table.rows ?? [])}\n${end}`;
  nextDoc = nextDoc.replace(re, rendered);
}

for (const enumDef of meta.enums ?? []) {
  const id = enumDef.id;
  const start = `<!-- AUTOGEN:${id}:START -->`;
  const end = `<!-- AUTOGEN:${id}:END -->`;
  const re = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  if (!re.test(nextDoc)) {
    throw new Error(`Missing marker block for enum id: ${id}`);
  }
  const rendered = `${start}\n${renderEnumBlock(enumDef)}\n${end}`;
  nextDoc = nextDoc.replace(re, rendered);
}

if (nextDoc !== doc) {
  writeFileSync(docPath, nextDoc);
  console.log("Updated docs/configuration.md autogen table sections.");
} else {
  console.log("No changes to docs/configuration.md.");
}
