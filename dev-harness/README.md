# Dev Harness

Minimal local Lovelace-like runtime for `segment-gauge` development.

It renders the card editor and a live preview side-by-side without Home Assistant.

## Run

From repo root:

```bash
npm run harness:dev
```

Then open:

- `http://localhost:5174`

## What it provides

- Left pane: card editor (`getConfigElement()` when available)
- Right pane: live card preview (`custom:segment-gauge`)
- Shared config model between editor and preview
- Mocked `hass` object:
  - `states`
  - `themes`
  - `locale` / `language`
  - `config`
  - `user`
  - `callService()` stub (logged)
  - `localize()` stub
- Minimal mocked `lovelace` object with `editMode`
- Runtime controls for:
  - card config JSON
  - entity states
  - theme selection
- Log panel for:
  - runtime errors
  - service calls
  - `config-changed` events

## Notes

- Harness code is isolated under `dev-harness/`.
- Production card/editor logic is not modified.
- The harness imports the local source module from `src/index.ts`.
