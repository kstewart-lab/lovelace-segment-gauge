import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const srcBundle = resolve(root, "dist/segment-gauge.js");
const srcMap = resolve(root, "dist/segment-gauge.js.map");
const dstBundle = resolve(root, "segment-gauge.js");
const dstMap = resolve(root, "segment-gauge.js.map");

copyFileSync(srcBundle, dstBundle);
copyFileSync(srcMap, dstMap);

console.log("Synced HACS bundle to repository root.");
