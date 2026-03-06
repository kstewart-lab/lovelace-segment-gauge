# Development

Build and test instructions for Segment Gauge.

## Prerequisites

- Node.js 20+ (recommended)
- npm

## Install Dependencies

```bash
npm ci
```

## Local Checks

Run tests:

```bash
npm test
```

Run typecheck:

```bash
npm run typecheck
```

Build the bundle:

```bash
npm run build
```

Regenerate autogen tables in the YAML reference:

```bash
npm run docs:generate
```

Check docs are up to date with metadata:

```bash
npm run docs:check
```

Run architecture boundary checks:

```bash
npm run arch:check
```

Output:
- `segment-gauge.js`
- `segment-gauge.js.map`
- `dist/segment-gauge.js`
- `dist/segment-gauge.js.map`

## Architecture

### Runtime Pipeline

`validate -> normalize -> derive -> render`

- `src/runtime/validate.ts`: warnings only, no mutation
- `src/runtime/normalize.ts`: canonical runtime config
- `src/runtime/model.ts`: derived runtime model and color/contrast policy
- `src/segment-gauge-base.ts`: host render/orchestration

### Editor Pipeline

`validate -> normalize -> field helpers / level helpers -> updates -> config-changed`

- `src/editor/normalize.ts`: canonical editor config values
- `src/editor/fields.ts`: event/value coercion and patch fragments
- `src/editor/levels.ts`: level add/remove/update logic
- `src/editor/updates.ts`: patch application, ordering, warnings, event emission
- `src/editor.ts`: host editor orchestration and section composition

### Dependency Direction and Boundaries

- Pure modules (`src/runtime/validate.ts`, `src/runtime/normalize.ts`, `src/runtime/model.ts`, `src/shared.ts`, `src/segment-utils.ts`, `src/editor/fields.ts`, `src/editor/levels.ts`, `src/editor/updates.ts`, `src/editor/normalize.ts`) must not import Lit, host files, or browser measurement adapters.
- Host/orchestration files (`src/segment-gauge-base.ts`, `src/segment-gauge-card.ts`, `src/segment-gauge-row.ts`, `src/editor.ts`, `src/runtime/measure.ts`, `src/actions.ts`) can depend on pure modules.
- Reverse dependencies are forbidden: pure modules must never depend on host/orchestration files.

See `docs/maintainer.md` for the short maintenance playbook.

## Watch Build

```bash
npm run build:watch
```

## Manual Home Assistant Deployment (dev)

Copy the built bundle to your HA instance (example path):

- `/config/www/community/segment-gauge/segment-gauge.js`

Lovelace resource URL:

- `/local/community/segment-gauge/segment-gauge.js?v=dev1`

Increase the `v=` query string after rebuilds to avoid browser caching.

## Release Checklist (Suggested)

1. `npm test`
2. `npm run typecheck`
3. `npm run build`
4. Verify `segment-gauge.js` loads in HA (HACS artifact)
5. Update docs/screenshots if needed
6. Push tag `vX.Y.Z` to trigger `.github/workflows/release.yml`
7. Confirm GitHub Release contains `segment-gauge.js` asset
