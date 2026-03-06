import "./styles.css";
import { registerHaStubs } from "./ha-stubs";
import type { SegmentGaugeConfig } from "../src/ha-types";
import { DEFAULT_HARNESS_CONFIG } from "./scenarios";

registerHaStubs();

type LogLevel = "event" | "service" | "error";
type LogEntry = { ts: string; level: LogLevel; message: string };

type MockState = {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
};

type MockHass = {
  states: Record<string, MockState>;
  themes: {
    default_theme: string;
    themes: Record<string, Record<string, string>>;
  };
  selectedTheme: string;
  locale: { language: string; number_format: string; time_format: string };
  language: string;
  config: {
    location_name: string;
    unit_system: { length: string; mass: string; temperature: string; volume: string };
    time_zone: string;
  };
  user: { id: string; name: string; is_admin: boolean };
  callService: (domain: string, service: string, data?: Record<string, unknown>) => void;
  localize: (key: string, ...args: unknown[]) => string;
};

const THEME_VARS: Record<string, Record<string, string>> = {
  "Harness Dark": {
    "--ha-card-background": "#1b1f24",
    "--card-background-color": "#1b1f24",
    "--primary-text-color": "#e6e6e6",
    "--secondary-text-color": "#9aa4b1",
    "--divider-color": "rgba(255, 255, 255, 0.16)",
    "--primary-color": "#03a9f4",
    "--state-icon-color": "#03a9f4",
  },
  "Harness Light": {
    "--ha-card-background": "#ffffff",
    "--card-background-color": "#ffffff",
    "--primary-text-color": "#1f2933",
    "--secondary-text-color": "#52606d",
    "--divider-color": "rgba(15, 23, 42, 0.18)",
    "--primary-color": "#006bd6",
    "--state-icon-color": "#006bd6",
  },
  "Harness Blue": {
    "--ha-card-background": "#152332",
    "--card-background-color": "#152332",
    "--primary-text-color": "#d9ecff",
    "--secondary-text-color": "#90b4d9",
    "--divider-color": "rgba(150, 210, 255, 0.25)",
    "--primary-color": "#44b9ff",
    "--state-icon-color": "#44b9ff",
  },
};

const model = {
  config: deepClone(DEFAULT_HARNESS_CONFIG),
  logs: [] as LogEntry[],
};

const mockHass: MockHass = {
  states: {
    "sensor.speedtest_download": {
      entity_id: "sensor.speedtest_download",
      state: "897.63",
      attributes: {
        friendly_name: "SpeedTest Download",
        unit_of_measurement: "Mbit/s",
        icon: "mdi:speedometer",
      },
    },
    "sensor.battery_level": {
      entity_id: "sensor.battery_level",
      state: "62",
      attributes: {
        friendly_name: "Phone Battery",
        unit_of_measurement: "%",
        icon: "mdi:battery-60",
      },
    },
    "sensor.cabinet_temperature": {
      entity_id: "sensor.cabinet_temperature",
      state: "23.4",
      attributes: {
        friendly_name: "Cabinet Temperature",
        unit_of_measurement: "degC",
        icon: "mdi:thermometer",
      },
    },
  },
  themes: {
    default_theme: "Harness Dark",
    themes: THEME_VARS,
  },
  selectedTheme: "Harness Dark",
  locale: {
    language: "en",
    number_format: "language",
    time_format: "24",
  },
  language: "en",
  config: {
    location_name: "Harness",
    unit_system: {
      length: "km",
      mass: "kg",
      temperature: "degC",
      volume: "L",
    },
    time_zone: "Europe/London",
  },
  user: {
    id: "dev-harness",
    name: "Dev Harness",
    is_admin: true,
  },
  callService(domain, service, data = {}) {
    addLog("service", `${domain}.${service}(${JSON.stringify(data)})`);
  },
  localize(key: string) {
    return key;
  },
};

const lovelace = {
  editMode: true,
  current_view: 0,
  config: {
    title: "Dev Harness",
    views: [{ title: "Harness" }],
  },
};

const app = document.querySelector("#app") as HTMLElement;
app.innerHTML = `
  <div class="shell">
    <header class="shell-header">
      <div>
        <h1>Segment Gauge Dev Harness</h1>
        <p>Local Lovelace-like runtime for card + editor.</p>
      </div>
      <div class="toolbar">
        <label>
          Theme
          <select id="theme-select"></select>
        </label>
        <button id="reset-config" type="button">Reset config</button>
        <button id="clear-log" type="button">Clear log</button>
      </div>
    </header>

    <section class="workspace">
      <div class="pane" id="editor-pane">
        <h2>Editor</h2>
        <div id="editor-host" class="pane-body"></div>
      </div>

      <div class="pane" id="preview-pane">
        <h2>Preview</h2>
        <div class="preview-shell">
          <div class="preview-card-wrap" id="preview-host"></div>
        </div>
      </div>
    </section>

    <section class="controls">
      <div class="control-card">
        <h3>Card Config (JSON)</h3>
        <textarea id="config-json" spellcheck="false"></textarea>
        <div class="control-actions">
          <button id="apply-config" type="button">Apply config</button>
          <button id="format-config" type="button">Format JSON</button>
        </div>
      </div>

      <div class="control-card">
        <h3>Entity States</h3>
        <div id="state-list" class="state-list"></div>
        <div class="add-state">
          <input id="new-entity-id" type="text" placeholder="entity_id" />
          <input id="new-entity-state" type="text" placeholder="state" />
          <button id="add-state" type="button">Add/Update</button>
        </div>
      </div>

      <div class="control-card">
        <h3>Runtime Log</h3>
        <div id="log-panel" class="log-panel" aria-live="polite"></div>
      </div>
    </section>
  </div>
`;

const themeSelect = document.querySelector("#theme-select") as HTMLSelectElement;
const configJson = document.querySelector("#config-json") as HTMLTextAreaElement;
const applyConfigBtn = document.querySelector("#apply-config") as HTMLButtonElement;
const formatConfigBtn = document.querySelector("#format-config") as HTMLButtonElement;
const resetConfigBtn = document.querySelector("#reset-config") as HTMLButtonElement;
const clearLogBtn = document.querySelector("#clear-log") as HTMLButtonElement;
const stateList = document.querySelector("#state-list") as HTMLElement;
const addStateBtn = document.querySelector("#add-state") as HTMLButtonElement;
const newEntityIdInput = document.querySelector("#new-entity-id") as HTMLInputElement;
const newEntityStateInput = document.querySelector("#new-entity-state") as HTMLInputElement;
const logPanel = document.querySelector("#log-panel") as HTMLElement;
const editorHost = document.querySelector("#editor-host") as HTMLElement;
const previewHost = document.querySelector("#preview-host") as HTMLElement;

let editorEl: any;
let previewEl: any;
let initialized = false;

function nowStamp(): string {
  return new Date().toISOString().slice(11, 19);
}

function addLog(level: LogLevel, message: string) {
  model.logs.push({ ts: nowStamp(), level, message });
  if (model.logs.length > 300) model.logs.splice(0, model.logs.length - 300);
  renderLogs();
}

function renderLogs() {
  logPanel.innerHTML = model.logs
    .map((entry) => `<div class="log-line ${entry.level}">[${entry.ts}] ${entry.level.toUpperCase()}: ${escapeHtml(entry.message)}</div>`)
    .join("");
  logPanel.scrollTop = logPanel.scrollHeight;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function setTheme(themeName: string) {
  const vars = THEME_VARS[themeName] ?? THEME_VARS["Harness Dark"];
  for (const [key, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(key, value);
  }
  mockHass.selectedTheme = themeName;
  themeSelect.value = themeName;
}

function ensureConfigType(config: SegmentGaugeConfig): SegmentGaugeConfig {
  return {
    ...config,
    type: "custom:segment-gauge",
  };
}

function applyConfig(nextConfig: SegmentGaugeConfig, source: "editor" | "json" | "reset") {
  model.config = ensureConfigType(deepClone(nextConfig));
  configJson.value = JSON.stringify(model.config, null, 2);

  if (editorEl && typeof editorEl.setConfig === "function") {
    editorEl.setConfig(deepClone(model.config));
  }
  if (previewEl && typeof previewEl.setConfig === "function") {
    previewEl.setConfig(deepClone(model.config));
  }

  const entityId = model.config.entity;
  if (entityId && !mockHass.states[entityId]) {
    mockHass.states[entityId] = {
      entity_id: entityId,
      state: "0",
      attributes: {
        friendly_name: entityId,
      },
    };
    renderStateList();
  }

  addLog("event", `config applied (${source})`);
}

function applyHass() {
  if (editorEl) {
    editorEl.hass = mockHass;
    editorEl.lovelace = lovelace;
  }
  if (previewEl) {
    previewEl.hass = mockHass;
    previewEl.lovelace = lovelace;
  }
}

function renderStateList() {
  const ids = Object.keys(mockHass.states).sort();
  stateList.innerHTML = ids
    .map((entityId) => {
      const state = mockHass.states[entityId];
      return `
        <div class="state-row" data-entity-id="${escapeHtml(entityId)}">
          <code>${escapeHtml(entityId)}</code>
          <input type="text" value="${escapeHtml(String(state.state))}" data-role="state" />
          <button type="button" data-role="remove">Remove</button>
        </div>
      `;
    })
    .join("");
}

function installRuntimeHooks() {
  window.addEventListener("error", (event) => {
    addLog("error", event.message || "Unknown runtime error");
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    addLog("error", `Unhandled rejection: ${String(reason)}`);
  });
}

function createEditorElement(config: SegmentGaugeConfig): HTMLElement {
  const cardCtor: any = customElements.get("segment-gauge");
  let element: any;

  if (cardCtor && typeof cardCtor.getConfigElement === "function") {
    element = cardCtor.getConfigElement();
  } else {
    element = document.createElement("segment-gauge-editor");
  }

  element.hass = mockHass;
  element.lovelace = lovelace;
  if (typeof element.setConfig === "function") {
    element.setConfig(deepClone(config));
  }
  element.addEventListener("config-changed", (event: Event) => {
    const detail = (event as CustomEvent).detail as { config?: SegmentGaugeConfig } | undefined;
    if (!detail?.config) return;
    addLog("event", "config-changed event received");
    applyConfig(detail.config, "editor");
  });

  return element;
}

function createPreviewElement(config: SegmentGaugeConfig): HTMLElement {
  const element: any = document.createElement("segment-gauge");
  element.hass = mockHass;
  element.lovelace = lovelace;
  element.setConfig(deepClone(config));
  element.addEventListener("hass-more-info", (event: Event) => {
    const detail = (event as any).detail;
    addLog("event", `hass-more-info: ${JSON.stringify(detail ?? {})}`);
  });
  return element;
}

function initialize() {
  if (initialized) return;
  initialized = true;
  themeSelect.innerHTML = Object.keys(THEME_VARS)
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("");
  setTheme(mockHass.selectedTheme);

  configJson.value = JSON.stringify(model.config, null, 2);
  renderStateList();

  editorEl = createEditorElement(model.config);
  previewEl = createPreviewElement(model.config);
  editorHost.replaceChildren(editorEl);
  previewHost.replaceChildren(previewEl);

  applyHass();
  installRuntimeHooks();
  addLog("event", "harness initialized");
}

themeSelect.addEventListener("change", () => {
  setTheme(themeSelect.value);
  applyHass();
  addLog("event", `theme changed: ${themeSelect.value}`);
});

applyConfigBtn.addEventListener("click", () => {
  try {
    const parsed = JSON.parse(configJson.value);
    applyConfig(parsed as SegmentGaugeConfig, "json");
    applyHass();
  } catch (err) {
    addLog("error", `Config JSON parse failed: ${String(err)}`);
  }
});

formatConfigBtn.addEventListener("click", () => {
  try {
    const parsed = JSON.parse(configJson.value);
    configJson.value = JSON.stringify(parsed, null, 2);
  } catch (err) {
    addLog("error", `Format failed: ${String(err)}`);
  }
});

resetConfigBtn.addEventListener("click", () => {
  applyConfig(DEFAULT_CONFIG, "reset");
  applyHass();
});

clearLogBtn.addEventListener("click", () => {
  model.logs = [];
  renderLogs();
});

stateList.addEventListener("input", (event) => {
  const target = event.target as HTMLInputElement;
  if (!target || target.dataset.role !== "state") return;
  const row = target.closest(".state-row") as HTMLElement | null;
  const entityId = row?.dataset.entityId;
  if (!entityId || !mockHass.states[entityId]) return;
  mockHass.states[entityId].state = target.value;
  applyHass();
});

stateList.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  if (!(target instanceof HTMLButtonElement) || target.dataset.role !== "remove") return;
  const row = target.closest(".state-row") as HTMLElement | null;
  const entityId = row?.dataset.entityId;
  if (!entityId) return;
  delete mockHass.states[entityId];
  renderStateList();
  applyHass();
  addLog("event", `entity removed: ${entityId}`);
});

addStateBtn.addEventListener("click", () => {
  const entityId = newEntityIdInput.value.trim();
  const state = newEntityStateInput.value.trim();
  if (!entityId) {
    addLog("error", "Entity id is required");
    return;
  }
  mockHass.states[entityId] = {
    entity_id: entityId,
    state: state || "0",
    attributes: {
      friendly_name: entityId,
    },
  };
  renderStateList();
  applyHass();
  addLog("event", `entity upserted: ${entityId}`);
});

async function bootstrap() {
  try {
    await import("../src/index.ts");
    initialize();
  } catch (err) {
    addLog("error", `Harness bootstrap failed: ${String(err)}`);
    throw err;
  }
}

void bootstrap();
