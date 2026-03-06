# Maintainer Guide

This is the short checklist for adding and maintaining Segment Gauge behavior without re-coupling modules.

## Where to Add New Config Fields

1. **Type boundary**: add the field to `src/ha-types.ts`.
2. **Default source of truth**: add the default in `src/shared.ts` (`DEFAULTS`).
3. **Validation**: add warning/enum checks in `src/runtime/validate.ts` (warnings only, no mutation).
4. **Normalization**:
   - Runtime canonicalization in `src/runtime/normalize.ts`.
   - Editor canonicalization in `src/editor/normalize.ts`.
5. **Runtime derivation/render use**: add derived behavior in `src/runtime/model.ts`, then consume it in `src/segment-gauge-base.ts`.
6. **Editor wiring**:
   - Event coercion helpers in `src/editor/fields.ts`.
   - Level list behavior in `src/editor/levels.ts`.
   - Patch ordering/emission in `src/editor/updates.ts`.
   - UI wiring only in `src/editor.ts`.
7. **Docs and checks**:
   - Update `docs/configuration.tables.json`.
   - Run `npm run docs:generate`.
   - Keep README examples canonical and warning-free.

## Validate vs Normalize vs Derive

- **validate** (`src/runtime/validate.ts`): detect unknown keys/invalid enums/removed fields and return warnings.
- **normalize** (`src/runtime/normalize.ts`, `src/editor/normalize.ts`): map accepted input to canonical model values.
- **derive** (`src/runtime/model.ts`): compute runtime geometry/color/layout policy from normalized config + scalar runtime inputs.

Validation must never mutate config. Normalization must stay canonical. Derivation must stay pure.

## Editor Update Flow

`ui event -> fields/levels helper -> updates.apply* -> orderEditorConfig -> validateConfig -> emit config-changed`

Keep section renderers thin. Avoid inline nested object mutation in `src/editor.ts`.

## Boundary Rules

- Pure modules: no Lit, no `window`/`document`, no measurement APIs, no host imports.
- Host files can consume pure modules, never the reverse.
- Keep measurement logic behind `src/runtime/measure.ts`.

Use `npm run arch:check` before merging.

## Where Logic Should Not Go

- Do not add config migration/normalization logic inside render templates.
- Do not add DOM measurement code to pure runtime modules.
- Do not add patch ordering or config-changed emission logic directly inside section callbacks.
- Do not add harness-specific branches to production files.
