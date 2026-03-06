import { describe, expect, it } from "vitest";
import { checkSourceAgainstArchitectureRules, runArchitectureCheck } from "../scripts/architecture/check.mjs";

describe("architecture boundaries", () => {
  it("passes the architecture check for the current repository", () => {
    const result = runArchitectureCheck(process.cwd());
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.checkedFiles).toBeGreaterThanOrEqual(10);
  });

  it("rejects forbidden imports in pure runtime modules", () => {
    const errors = checkSourceAgainstArchitectureRules(
      "src/runtime/model.ts",
      "import { html } from 'lit';\nconst x = window.location;\nexport const v = x;",
      process.cwd()
    );
    expect(errors.some((error) => error.includes("forbidden import \"lit\""))).toBe(true);
    expect(errors.some((error) => error.includes("forbidden global token"))).toBe(true);
  });

  it("rejects helper modules that import host files", () => {
    const errors = checkSourceAgainstArchitectureRules(
      "src/editor/fields.ts",
      "import '../editor';\nexport const x = 1;",
      process.cwd()
    );
    expect(errors.some((error) => error.includes("must not import host file"))).toBe(true);
  });

  it("rejects forbidden imports in pure core modules", () => {
    const errors = checkSourceAgainstArchitectureRules(
      "src/shared.ts",
      "import { css } from 'lit';\nexport const x = 1;",
      process.cwd()
    );
    expect(errors.some((error) => error.includes("forbidden import \"lit\""))).toBe(true);
  });

  it("rejects forbidden browser globals in pure core modules", () => {
    const errors = checkSourceAgainstArchitectureRules(
      "src/segment-utils.ts",
      "export const x = () => document.body;",
      process.cwd()
    );
    expect(errors.some((error) => error.includes("forbidden global token"))).toBe(true);
  });
});
