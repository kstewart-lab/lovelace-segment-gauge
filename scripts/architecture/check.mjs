import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PURE_RUNTIME_FILES = [
  "src/runtime/validate.ts",
  "src/runtime/normalize.ts",
  "src/runtime/model.ts",
];

const PURE_CORE_FILES = ["src/shared.ts", "src/segment-utils.ts"];

const RUNTIME_MEASURE_FILES = ["src/runtime/measure.ts"];

const EDITOR_HELPER_FILES = [
  "src/editor/fields.ts",
  "src/editor/levels.ts",
  "src/editor/updates.ts",
  "src/editor/normalize.ts",
];

const HOST_FILE_PATTERNS = [
  /^src\/segment-gauge-(?:base|card|row)\.ts$/,
  /^src\/editor\.ts$/,
];

const FORBIDDEN_IMPORT_SPECS = [/^lit(?:\/|$)/, /^lit-html(?:\/|$)/, /^@material\//];

const FORBIDDEN_GLOBAL_TOKENS = [
  /\bwindow\b/,
  /\bdocument\b/,
  /\bResizeObserver\b/,
  /\brequestAnimationFrame\b/,
  /\bcancelAnimationFrame\b/,
  /\bHTMLElement\b/,
  /\bcustomElements\b/,
];

const FORBIDDEN_EDITOR_HELPER_TOKENS = [/\bLitElement\b/, /\bhtml`/];

const ALL_RULE_FILES = [
  ...PURE_RUNTIME_FILES,
  ...PURE_CORE_FILES,
  ...RUNTIME_MEASURE_FILES,
  ...EDITOR_HELPER_FILES,
];

function toPosix(filePath) {
  return filePath.replace(/\\/g, "/");
}

function extractImportSpecifiers(source) {
  const specs = [];
  const staticImport = /(?:import|export)\s+[^;]*?from\s+["']([^"']+)["']/g;
  const sideEffectImport = /import\s+["']([^"']+)["']/g;
  const dynamicImport = /import\(\s*["']([^"']+)["']\s*\)/g;
  let match;
  while ((match = staticImport.exec(source)) !== null) {
    specs.push(match[1]);
  }
  while ((match = sideEffectImport.exec(source)) !== null) {
    specs.push(match[1]);
  }
  while ((match = dynamicImport.exec(source)) !== null) {
    specs.push(match[1]);
  }
  return specs;
}

function resolveRelativeImport(rootDir, sourceFile, specifier) {
  if (!specifier.startsWith(".")) return null;
  const base = path.resolve(rootDir, path.dirname(sourceFile));
  const raw = path.resolve(base, specifier);
  const candidates = [
    `${raw}.ts`,
    `${raw}.js`,
    path.join(raw, "index.ts"),
    path.join(raw, "index.js"),
    raw,
  ];
  const existing = candidates.find((candidate) => {
    if (!fs.existsSync(candidate)) return false;
    try {
      return fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
  const resolved = existing ?? candidates[0];
  return toPosix(path.relative(rootDir, resolved));
}

function checkForbiddenImportSpec(filePath, specifier, errors) {
  for (const pattern of FORBIDDEN_IMPORT_SPECS) {
    if (pattern.test(specifier)) {
      errors.push(`${filePath}: forbidden import \"${specifier}\"`);
    }
  }
}

function checkForbiddenResolvedImport(filePath, resolved, errors) {
  if (!resolved) return;
  for (const pattern of HOST_FILE_PATTERNS) {
    if (pattern.test(resolved)) {
      errors.push(`${filePath}: pure/helper module must not import host file \"${resolved}\"`);
    }
  }
}

function checkRuntimePureSource(filePath, source, specifiers, resolvedBySpecifier) {
  const errors = [];
  for (const specifier of specifiers) {
    checkForbiddenImportSpec(filePath, specifier, errors);
    checkForbiddenResolvedImport(filePath, resolvedBySpecifier.get(specifier), errors);
    if (resolvedBySpecifier.get(specifier) === "src/runtime/measure.ts") {
      errors.push(`${filePath}: pure runtime module must not import measurement adapter \"src/runtime/measure.ts\"`);
    }
  }
  for (const token of FORBIDDEN_GLOBAL_TOKENS) {
    if (token.test(source)) {
      errors.push(`${filePath}: pure runtime module uses forbidden global token ${token}`);
    }
  }
  return errors;
}

function checkCorePureSource(filePath, source, specifiers, resolvedBySpecifier) {
  const errors = [];
  for (const specifier of specifiers) {
    checkForbiddenImportSpec(filePath, specifier, errors);
    checkForbiddenResolvedImport(filePath, resolvedBySpecifier.get(specifier), errors);
    if (resolvedBySpecifier.get(specifier) === "src/runtime/measure.ts") {
      errors.push(`${filePath}: pure core module must not import measurement adapter \"src/runtime/measure.ts\"`);
    }
  }
  for (const token of FORBIDDEN_GLOBAL_TOKENS) {
    if (token.test(source)) {
      errors.push(`${filePath}: pure core module uses forbidden global token ${token}`);
    }
  }
  return errors;
}

function checkEditorHelperSource(filePath, source, specifiers, resolvedBySpecifier) {
  const errors = [];
  for (const specifier of specifiers) {
    checkForbiddenImportSpec(filePath, specifier, errors);
    checkForbiddenResolvedImport(filePath, resolvedBySpecifier.get(specifier), errors);
    if (resolvedBySpecifier.get(specifier) === "src/runtime/measure.ts") {
      errors.push(`${filePath}: editor helper module must not import measurement adapter \"src/runtime/measure.ts\"`);
    }
  }
  for (const token of FORBIDDEN_EDITOR_HELPER_TOKENS) {
    if (token.test(source)) {
      errors.push(`${filePath}: editor helper module uses forbidden token ${token}`);
    }
  }
  return errors;
}

function checkRuntimeMeasureSource(filePath, _source, specifiers, resolvedBySpecifier) {
  const errors = [];
  for (const specifier of specifiers) {
    checkForbiddenImportSpec(filePath, specifier, errors);
    checkForbiddenResolvedImport(filePath, resolvedBySpecifier.get(specifier), errors);
  }
  return errors;
}

export function checkSourceAgainstArchitectureRules(filePath, source, rootDir = process.cwd()) {
  const normalizedPath = toPosix(filePath);
  const specifiers = extractImportSpecifiers(source);
  const resolvedBySpecifier = new Map(
    specifiers.map((specifier) => [specifier, resolveRelativeImport(rootDir, normalizedPath, specifier)])
  );

  if (PURE_RUNTIME_FILES.includes(normalizedPath)) {
    return checkRuntimePureSource(normalizedPath, source, specifiers, resolvedBySpecifier);
  }
  if (PURE_CORE_FILES.includes(normalizedPath)) {
    return checkCorePureSource(normalizedPath, source, specifiers, resolvedBySpecifier);
  }
  if (EDITOR_HELPER_FILES.includes(normalizedPath)) {
    return checkEditorHelperSource(normalizedPath, source, specifiers, resolvedBySpecifier);
  }
  if (RUNTIME_MEASURE_FILES.includes(normalizedPath)) {
    return checkRuntimeMeasureSource(normalizedPath, source, specifiers, resolvedBySpecifier);
  }
  return [];
}

export function runArchitectureCheck(rootDir = process.cwd()) {
  const errors = [];
  for (const relativePath of ALL_RULE_FILES) {
    const absolutePath = path.resolve(rootDir, relativePath);
    if (!fs.existsSync(absolutePath)) {
      errors.push(`missing file for architecture check: ${relativePath}`);
      continue;
    }
    const source = fs.readFileSync(absolutePath, "utf8");
    errors.push(...checkSourceAgainstArchitectureRules(relativePath, source, rootDir));
  }
  return {
    ok: errors.length === 0,
    errors,
    checkedFiles: ALL_RULE_FILES.length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runArchitectureCheck(process.cwd());
  if (!result.ok) {
    for (const error of result.errors) {
      console.error(`architecture: ${error}`);
    }
    process.exit(1);
  }
  console.log(`Architecture check passed (${result.checkedFiles} files).`);
}
