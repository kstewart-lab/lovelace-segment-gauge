import { LitElement, css, html, nothing } from "lit";
import type { ActionConfig, HomeAssistant, SegmentGaugeConfig, Level } from "./ha-types";
import {
  DEFAULTS,
  clamp,
  mergeDefaults,
  normalizeBarColorMode,
  normalizeBarFillMode,
  normalizeColorSnappingMode,
  normalizeFillSnappingMode,
  normalizeGaugeAlignmentMode,
  normalizeIconColorMode,
  normalizeLayoutMode,
  normalizePointerColorMode,
  normalizeScaleColorMode,
  normalizeScalePlacementMode,
  normalizeTickColorMode,
  normalizeScaleTickSpacingMode,
  stopColorForValue,
} from "./shared";
import { normalizeEditorConfig } from "./editor/normalize";
import {
  asNumberOrNull,
  asOptionalString,
  asString,
  buildPatch,
  coerceNumericValue,
  readEventChecked,
  readEventNumberOrNull,
  readEventValue,
} from "./editor/fields";
import {
  addLevel,
  listLevels,
  removeLevel,
  updateLevel,
} from "./editor/levels";
import {
  applyEditorActionPatch,
  applyEditorPatch,
  emitConfigChanged,
  ensureAction,
  orderEditorConfig,
  replaceEditorLevels,
} from "./editor/updates";
import { validateConfig } from "./runtime/validate";

// Visible editor identifier for cache/version diagnostics in HA edit dialogs.
const BUILD_TAG = "segment-gauge editor";

type SelectOpt = { value: string; label: string };

const LAYOUTS: SelectOpt[] = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
  { value: "stacked", label: "Stacked" },
];

const CARD_STYLES: SelectOpt[] = [
  { value: "default", label: "Default" },
  { value: "plain", label: "Plain" },
];

const SCALE_COLOR_MODES: SelectOpt[] = [
  { value: "theme", label: "Theme" },
  { value: "stepped", label: "Stepped (per level)" },
  { value: "gradient", label: "Smooth gradient" },
  { value: "level", label: "Current level only" },
  { value: "custom", label: "Custom" },
];

const SCALE_TICK_COLOR_MODES: SelectOpt[] = [
  { value: "theme", label: "Theme" },
  { value: "stepped", label: "Stepped (per level)" },
  { value: "gradient", label: "Smooth gradient" },
  { value: "level", label: "Current level only" },
  { value: "contrast", label: "Auto contrast" },
  { value: "custom", label: "Custom" },
];

const EDGES: SelectOpt[] = [
  { value: "rounded", label: "Rounded" },
  { value: "square", label: "Square" },
];

const BAR_COLOR_MODES: SelectOpt[] = [
  { value: "stepped", label: "Stepped (per level)" },
  { value: "gradient", label: "Gradient" },
  { value: "current_level", label: "Current level only" },
];

const BAR_FILL_MODES: SelectOpt[] = [
  { value: "cumulative", label: "Cumulative" },
  { value: "current_segment", label: "Current segment only" },
];

const ACTIONS: SelectOpt[] = [
  { value: "none", label: "None" },
  { value: "more-info", label: "More info" },
  { value: "toggle", label: "Toggle" },
  { value: "navigate", label: "Navigate" },
  { value: "url", label: "Open URL" },
  { value: "call-service", label: "Call service" },
];

/**
 * NOTE: We intentionally avoid ha-select/mwc-select in the editor.
 * In some HA versions/setups the menu "closed" event from MWC bubbles up and
 * can be misinterpreted by the edit-card dialog as a cancel, closing the editor.
 * Native <select> avoids that entire event surface.
 */
export class SegmentGaugeEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _warnings: { state: true },
  };

  hass?: HomeAssistant;
  private _config?: SegmentGaugeConfig;
  private _warnings: string[] = [];
  private _autoEntityPicked = false;
  private _levelsExpanded?: boolean;
  private _barExpanded?: boolean;
  private _pointerExpanded?: boolean;
  private _scaleExpanded?: boolean;

  // Home Assistant dialogs listen for a bubbling/composed "closed" event.
  // MWC menus (used by ha-select/ha-menu in HA and sometimes via other wrappers)
  // also emit "closed" when their dropdown closes. In the card editor context,
  // that "closed" can escape the editor's shadow DOM and unintentionally close
  // the edit-card dialog.
  //
  // We install a capture-phase guard on the editor host to stop propagation of menu
  // close events originating from within this editor.
  private _closeGuardHandler?: (ev: Event) => void;
  private _closeGuardInstalled = false;

  /**
   * Filter out non-numeric entities so the gauge isn't configured with
   * strings/booleans that render as "unavailable".
   */
  private _entityFilter = (entity: any): boolean => {
    if (!this.hass) return true;

    const st =
      entity && typeof entity === "object" && typeof entity.state === "string"
        ? entity
        : this.hass.states?.[typeof entity === "string" ? entity : (entity?.entity_id as string)];

    // If we can't resolve state yet, don't block selection.
    if (!st) return true;

    // Always allow the currently selected entity (even if temporarily non-numeric).
    if (st.entity_id && st.entity_id === this._config?.entity) return true;

    const s = String(st.state ?? "");
    const n = Number(s);
    if (Number.isFinite(n)) return true;

    const domain = (st.entity_id || "").split(".")[0];
    return ["sensor", "number", "input_number"].includes(domain) && Number.isFinite(Number(st.state));
  };

  connectedCallback(): void {
    super.connectedCallback();
    this._installCloseGuard();
  }

  disconnectedCallback(): void {
    this._removeCloseGuard();
    super.disconnectedCallback();
  }

  private _installCloseGuard(): void {
    if (this._closeGuardInstalled) return;
    this._closeGuardInstalled = true;
    const interesting = new Set(["closed"]);

    const handler = (ev: Event) => {
      if (!interesting.has(ev.type)) return;

      const path = (ev as any).composedPath?.() as EventTarget[] | undefined;
      if (!path || !path.length) return;

      // We only want to block "closed" coming from Material menus/selects
      // inside this editor (e.g. ha-select/mwc-select), not the dialog closing itself.
      const origin = path[0] as any;

      const originTag = (origin?.tagName || "").toString().toLowerCase();
      const originClass = (origin?.classList ? Array.from(origin.classList).join(" ") : "").toString();

      const looksLikeMenuSurface =
        originTag.includes("mwc-menu-surface") ||
        originTag.includes("ha-menu") ||
        originClass.includes("mdc-menu-surface");

      if (!looksLikeMenuSurface) return;

      // Sanity: ensure the event actually flowed through this editor
      const includesThis = path.includes(this as any);
      if (!includesThis) return;

      // Stop it before it reaches hui-dialog-edit-card's <ha-wa-dialog @closed=...>
      ev.stopPropagation();
      (ev as any).stopImmediatePropagation?.();
      (ev as any).preventDefault?.();
    };

    // Attach on the editor host; bubble phase so inner components (ha-select) handle close first.
    this.addEventListener("closed", handler as any, { capture: false });

    this._closeGuardHandler = handler;
  }

  private _renderSubheader(text: string) {
    return html`<div class="subheader">${text}</div>`;
  }

  private _renderGroupTitle(text: string) {
    return html`<div class="group-title">${text}</div>`;
  }

  private _renderInlinePanel(title: string, expanded: boolean, content: any) {
    return html`
      <ha-expansion-panel
        class="inline-panel"
        .expanded=${expanded}
        @expanded-changed=${(e: any) => {
          if (e.target !== e.currentTarget) return;
          const next = (e.detail as any)?.value ?? (e.detail as any)?.expanded ?? (e.target as any)?.expanded;
          if (title === "Levels") {
            this._levelsExpanded = !!next;
          } else if (title === "Bar") {
            this._barExpanded = !!next;
          } else if (title === "Pointer") {
            this._pointerExpanded = !!next;
          } else if (title === "Scale") {
            this._scaleExpanded = !!next;
          }
        }}
      >
        <span slot="header" class="inline-panel-header">${title}</span>
        <div class="inline-panel-content">${content}</div>
      </ha-expansion-panel>
    `;
  }

  private _renderGaugeSectionPanel(title: string, expanded: boolean, content: any) {
    return html`
      <ha-expansion-panel
        outlined
        .expanded=${expanded}
        @expanded-changed=${(e: any) => {
          if (e.target !== e.currentTarget) return;
          const next = (e.detail as any)?.value ?? (e.detail as any)?.expanded ?? (e.target as any)?.expanded;
          if (title === "Levels") {
            this._levelsExpanded = !!next;
          } else if (title === "Bar") {
            this._barExpanded = !!next;
          } else if (title === "Pointer") {
            this._pointerExpanded = !!next;
          } else if (title === "Scale") {
            this._scaleExpanded = !!next;
          }
        }}
      >
        <span slot="header" class="panel-header">${title}</span>
        <div class="section-panel-content">${content}</div>
      </ha-expansion-panel>
    `;
  }

  private _removeCloseGuard(): void {
    if (!this._closeGuardHandler) return;
    this.removeEventListener("closed", this._closeGuardHandler, true);
    this._closeGuardHandler = undefined;
    this._closeGuardInstalled = false;
  }

  private _isLevelsModified(c: SegmentGaugeConfig): boolean {
    const levels = (c as any).levels;
    if (!Array.isArray(levels) || levels.length === 0) return false;
    if (levels.length === 1) {
      const only = levels[0] as any;
      const valueOk = Number(only?.value) === 0;
      const color = String(only?.color ?? "").trim().toLowerCase();
      const colorOk = color === "#03a9f4";
      const iconOk = !only?.icon;
      if (valueOk && colorOk && iconOk) return false;
    }
    return true;
  }

  private _isBarModified(c: SegmentGaugeConfig): boolean {
    const bar = (c as any).bar ?? {};
    if (bar.show !== undefined && bar.show !== DEFAULTS.bar.show) return true;
    if (bar.edge !== undefined && bar.edge !== DEFAULTS.bar.edge) return true;
    if (bar.height !== undefined && Number(bar.height) !== Number(DEFAULTS.bar.height)) return true;
    if (bar.color_mode !== undefined && bar.color_mode !== DEFAULTS.bar.color_mode) return true;
    if (bar.fill_mode !== undefined && bar.fill_mode !== (DEFAULTS.bar as any).fill_mode) return true;
    const intensity = bar.track?.intensity;
    if (intensity !== undefined && Number(intensity) !== Number(DEFAULTS.bar.track.intensity)) return true;
    const bg = bar.track?.background;
    if (bg !== undefined) {
      const def = this._gapColorDefault();
      const hex = this._cssColorToHex(bg);
      if (!hex) return true;
      if (hex.toLowerCase() !== def.toLowerCase()) return true;
    }
    const segMode = bar.segments?.mode ?? DEFAULTS.bar.segments.mode;
    if (segMode !== DEFAULTS.bar.segments.mode) return true;
    const segWidth = bar.segments?.width;
    if (segWidth !== undefined && Number(segWidth) !== Number(DEFAULTS.bar.segments.width)) return true;
    const gapWidth = bar.segments?.gap;
    if (gapWidth !== undefined && Number(gapWidth) !== Number(DEFAULTS.bar.segments.gap)) return true;
    const segmentsPerLevel = (bar.segments as any)?.segments_per_level;
    if (
      segmentsPerLevel !== undefined &&
      Number(segmentsPerLevel) !== Number((DEFAULTS.bar.segments as any).segments_per_level)
    )
      return true;
    const snapping = (bar as any).snapping;
    const fillQ = snapping?.fill;
    if (fillQ !== undefined && fillQ !== (DEFAULTS.bar as any).snapping.fill) return true;
    const colorQ = snapping?.color;
    if (colorQ !== undefined && colorQ !== (DEFAULTS.bar as any).snapping.color) return true;
    return false;
  }

  private _isScaleModified(c: SegmentGaugeConfig): boolean {
    const scale = (c as any).scale ?? {};
    if (scale.show !== undefined && scale.show !== DEFAULTS.scale.show) return true;
    if (scale.labels?.show !== undefined && scale.labels.show !== DEFAULTS.scale.labels.show) return true;
    if (scale.placement !== undefined && scale.placement !== DEFAULTS.scale.placement) return true;
    const spacing = scale.spacing;
    if (spacing !== undefined && spacing !== (DEFAULTS.scale as any).spacing) return true;
    const majorCount = scale.ticks?.major_count;
    if (majorCount !== undefined && Number(majorCount) !== Number((DEFAULTS.scale.ticks as any).major_count)) return true;
    const minorPerMajor = scale.ticks?.minor_per_major;
    if (minorPerMajor !== undefined && Number(minorPerMajor) !== Number((DEFAULTS.scale.ticks as any).minor_per_major)) return true;
    const scaleYOffset = scale.y_offset;
    if (scaleYOffset !== undefined && Number(scaleYOffset) !== Number((DEFAULTS.scale as any).y_offset)) return true;
    if (scale.labels?.precision !== undefined && Number(scale.labels.precision) !== Number(DEFAULTS.scale.labels.precision))
      return true;
    if (scale.labels?.size !== undefined && Number(scale.labels.size) !== Number(DEFAULTS.scale.labels.size)) return true;
    const labelYOffset = scale.labels?.y_offset;
    if (labelYOffset !== undefined && Number(labelYOffset) !== Number((DEFAULTS.scale.labels as any).y_offset))
      return true;
    if ((scale.ticks as any)?.height_major !== undefined && Number((scale.ticks as any).height_major) !== Number((DEFAULTS.scale.ticks as any).height_major))
      return true;
    const minorHeight = scale.ticks?.height_minor;
    if (minorHeight !== undefined && Number(minorHeight) !== Number((DEFAULTS.scale.ticks as any).height_minor)) return true;
    if (scale.ticks?.color_mode !== undefined && scale.ticks.color_mode !== DEFAULTS.scale.ticks.color_mode) return true;
    if (scale.ticks?.color !== undefined && String(scale.ticks.color).trim().length > 0) return true;
    if (scale.labels?.color_mode !== undefined && scale.labels.color_mode !== DEFAULTS.scale.labels.color_mode) return true;
    if (scale.labels?.color !== undefined && String(scale.labels.color).trim().length > 0) return true;
    return false;
  }

  private _isPointerModified(c: SegmentGaugeConfig): boolean {
    const pointer = (c as any).pointer ?? {};
    if (pointer.show !== undefined && pointer.show !== DEFAULTS.pointer.show) return true;
    if (pointer.size !== undefined && Number(pointer.size) !== Number(DEFAULTS.pointer.size)) return true;
    if (pointer.color_mode !== undefined && pointer.color_mode !== DEFAULTS.pointer.color_mode) return true;
    if (pointer.color !== undefined && String(pointer.color).trim() !== String(DEFAULTS.pointer.color).trim()) return true;
    if (pointer.angle !== undefined && Number(pointer.angle) !== Number(DEFAULTS.pointer.angle)) return true;
    const pointerYOffset = pointer.y_offset;
    if (pointerYOffset !== undefined && Number(pointerYOffset) !== Number((DEFAULTS.pointer as any).y_offset)) return true;
    return false;
  }


  static styles = css`
    :host {
      display: block;
      padding: 8px;
      color: var(--primary-text-color);
    }

    ha-entity-picker,
    ha-icon-picker,
    ha-textfield {
      width: 100%;
      min-width: 0;
    }

    .section-card {
      background: var(--ha-card-background, var(--card-background-color));
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
      box-shadow: var(--ha-card-box-shadow, none);
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary-text-color);
    }

    .panel-header {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-text-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .subheader {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text-color);
      margin: 4px 0;
    }

    .group-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text-color);
      margin: 6px 0 2px;
    }

    .panel {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 12px;
    }

    ha-expansion-panel {
      --expansion-panel-content-padding: 0 0 12px 0;
      margin-bottom: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      overflow: hidden;
    }

    ha-expansion-panel[expanded] {
      border-color: var(--primary-color);
    }

    ha-expansion-panel.inline-panel {
      --expansion-panel-content-padding: 0;
      --expansion-panel-summary-padding: 0;
      border: none;
      border-radius: 0;
      margin: 0;
      background: transparent;
    }

    ha-expansion-panel.inline-panel[expanded] {
      border-color: transparent;
    }

    .inline-panel-header {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text-color);
      display: flex;
      align-items: center;
      padding: 2px 0;
      line-height: 1.1;
    }

    .inline-panel-content {
      display: grid;
      gap: 8px;
    }

    .section-panel-content {
      padding: 12px;
      display: grid;
      gap: 8px;
    }

    .row2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      align-items: end;
    }

    .row3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      align-items: end;
    }

    .scale-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .scale-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }

    .full {
      grid-column: 1 / -1;
    }

    .span2 {
      grid-column: span 2;
    }

    .slider-block {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }


    .slider-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    .toggle-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .stops {
      display: grid;
      gap: 10px;
      margin-top: 4px;
    }

    .stopRow {
      display: grid;
      grid-template-columns: 120px 100px 160px 32px;
      gap: 2px;
      align-items: start;
      background: var(--ha-card-background, var(--card-background-color));
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      padding: 10px;
    }
    .stopRow .stop-compact {
      width: 120px;
    }
    .stopRow .stop-color {
      width: 100%;
    }
    .stopRow .stop-color ha-textfield {
      width: 100%;
      max-width: 84px;
    }
    .stopRow .stop-color input[type="color"] {
      width: 84px;
      height: 16px;
    }
    .stopRow .stop-icon {
      width: 100%;
    }
    .stopRow .icon-btn {
      justify-self: end;
    }

    @media (max-width: 600px) {
      .row2,
      .row3 {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .scale-grid {
        display: flex;
        flex-direction: column;
      }

      .stopRow {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .stopRow .stop-compact,
      .stopRow .stop-color {
        flex: 1 1 120px;
        min-width: 0;
        max-width: 100%;
      }

      .stopRow .stop-icon {
        flex: 1 1 calc(100% - 40px);
        min-width: 0;
        max-width: 100%;
      }

      .stopRow .stop-color ha-textfield,
      .stopRow .stop-color input[type="color"] {
        width: 100%;
        max-width: 100%;
      }

      .stopRow > * {
        min-width: 0;
      }

      .stopRow .icon-btn {
        flex: 0 0 32px;
        align-self: center;
        margin-left: 0;
      }
    }
    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--error-color);
      cursor: pointer;
      font-size: 22px;
      line-height: 1;
      padding: 0;
      transition: background 120ms ease, transform 120ms ease;
    }
    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: scale(1.02);
    }
    .icon-btn:active {
      transform: scale(0.98);
    }

    .stopActions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-top: 6px;
    }
    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--primary-color);
      background: rgba(0, 0, 0, 0.05);
      color: var(--primary-color);
      cursor: pointer;
      font: inherit;
      transition: background 120ms ease, transform 120ms ease;
    }
    .add-btn:hover {
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    }
    .add-btn:active {
      transform: scale(0.99);
    }

    .danger {
      color: var(--error-color);
    }

    .row-desc,
    .help,
    .small {
      font-size: 12px;
      color: var(--secondary-text-color);
      line-height: 1.3;
    }

    .icon-plus {
      font-size: 18px;
      line-height: 1;
      display: inline-block;
    }

    .build-tag {
      margin-top: 8px;
      font-size: 11px;
      color: var(--secondary-text-color);
      text-align: right;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }
    .field ha-select {
      width: 100%;
    }

    .align-right {
      justify-self: end;
    }

    .color-field {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 6px;
      width: 100%;
    }

    .warnings {
      display: grid;
      gap: 8px;
      margin-bottom: 12px;
    }
  `;

  setConfig(config: SegmentGaugeConfig) {
    const isFirst = !this._config;
    this._warnings = [...validateConfig(config).warnings];
    const nextConfig = orderEditorConfig(normalizeEditorConfig(config));
    this._config = nextConfig;
    if (isFirst) {
      // Latch initial expansion state once on first open; later edits should not
      // auto-collapse/expand subsections unless the user toggles them.
      this._levelsExpanded = this._isLevelsModified(nextConfig);
      this._barExpanded = this._isBarModified(nextConfig);
      this._pointerExpanded = this._isPointerModified(nextConfig);
      this._scaleExpanded = this._isScaleModified(nextConfig);
    }
  }

  protected updated(changedProps: Map<string, unknown>) {
    super.updated(changedProps);

    // Standard Lovelace behavior: pick a reasonable default entity for new cards.
    if (this.hass && this._config && !this._config.entity && !this._autoEntityPicked) {
      const next = this._pickDefaultEntity();
      if (next) {
        this._autoEntityPicked = true;
        this._updatePath(["entity"], next);
      }
    }
  }

  private _splitPct(config: SegmentGaugeConfig): number {
    const pct = Number((config.layout as any)?.split_pct ?? DEFAULTS.layout.split_pct);
    if (!Number.isFinite(pct)) return DEFAULTS.layout.split_pct;
    return Math.round(pct);
  }

  private _onSplitChange(e: CustomEvent) {
    const v = readEventNumberOrNull(e);
    if (v === null) return;
    this._setSplitPct(v);
    e.stopPropagation();
  }

  private _setSplitPct(pct: number) {
    this._updatePath(["layout", "split_pct"], coerceNumericValue(pct, { min: 5, max: 95 }));
  }

  private _pickDefaultEntity(): string | undefined {
    const hass = this.hass;
    if (!hass) return undefined;
    const ids = Object.keys(hass.states).sort();
    for (const id of ids) {
      if (this._entityFilter(id)) return id;
    }
    return undefined;
  }

  private _gapColorDefault(): string {
    const style = getComputedStyle(this);
    const color = style.getPropertyValue("--card-background-color")?.trim();
    const hex = this._cssColorToHex(color);
    return hex ?? "#000000";
  }

  private _primaryColorDefault(): string {
    const style = getComputedStyle(this);
    const color = style.getPropertyValue("--primary-color")?.trim();
    const hex = this._cssColorToHex(color);
    return hex ?? "#03a9f4";
  }

  private _primaryTextColorDefault(): string {
    const style = getComputedStyle(this);
    const color = style.getPropertyValue("--primary-text-color")?.trim();
    const hex = this._cssColorToHex(color);
    return hex ?? "#ffffff";
  }


  private _resolveIconColor(c: SegmentGaugeConfig): string {
    const source = normalizeIconColorMode((c.content as any)?.icon_color?.mode ?? DEFAULTS.content.icon_color.mode);
    if (source === "custom") {
      const custom = this._cssColorToHex((c.content as any)?.icon_color?.value);
      return custom ?? this._primaryColorDefault();
    }
    if (source === "theme") return this._primaryColorDefault();
    if (source === "level") {
      const entityId = (c as any).entity;
      const state = entityId && this.hass ? this.hass.states[entityId] : undefined;
      const valueNum = Number(state?.state);
      const min = Number((c.data as any)?.min ?? DEFAULTS.data.min);
      const max = Number((c.data as any)?.max ?? DEFAULTS.data.max);
      const clamped = Number.isFinite(valueNum) ? Math.min(max, Math.max(min, valueNum)) : min;
      const levels = (c as any).levels ?? DEFAULTS.levels;
      const color = stopColorForValue(levels, clamped, this._primaryColorDefault());
      return this._cssColorToHex(color) ?? this._primaryColorDefault();
    }
    // "state" or unknown: fall back to theme (we can't resolve HA state color here)
    return this._primaryColorDefault();
  }

  private _gapColorValue(c: SegmentGaugeConfig | undefined): string {
    const def = this._gapColorDefault();
    const cur = (c as any)?.bar?.track?.background;
    return this._cssColorToHex(cur)?.trim() || def;
  }

  private _cssColorToHex(color: string | undefined | null): string | undefined {
    if (!color) return undefined;
    const c = color.trim();
    if (!c) return undefined;
    if (c.startsWith("#")) {
      if (c.length === 4) {
        // short hex #rgb
        const r = c[1],
          g = c[2],
          b = c[3];
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

  private _commitUpdate(nextConfig: SegmentGaugeConfig, warnings: readonly string[]) {
    this._config = nextConfig;
    this._warnings = [...warnings];
    emitConfigChanged(this, nextConfig);
  }

  private _update(partial: Partial<SegmentGaugeConfig>) {
    if (!this._config) return;
    const next = applyEditorPatch(this._config, partial);
    this._commitUpdate(next.config, next.warnings);
  }

  private _updatePath(path: readonly string[], value: unknown) {
    this._update(buildPatch(path, value) as any);
  }

  private _onToggle(path: readonly string[]) {
    return (e: unknown) => this._updatePath(path, readEventChecked(e));
  }

  private _onSelect(path: readonly string[]) {
    return (value: string) => this._updatePath(path, value);
  }

  private _onTextInput(path: readonly string[], optional = false) {
    return (e: unknown) => {
      const raw = readEventValue(e);
      this._updatePath(path, optional ? asOptionalString(raw) : asString(raw));
    };
  }

  private _onNumberInput(
    path: readonly string[],
    opts: { fallback?: number | null; min?: number; max?: number; round?: boolean } = {}
  ) {
    return (e: unknown) => {
      const raw = readEventNumberOrNull(e);
      if (raw === null) {
        if (opts.fallback !== undefined) this._updatePath(path, opts.fallback);
        return;
      }
      this._updatePath(path, coerceNumericValue(raw, opts));
    };
  }

  private _updateAction(which: "tap_action" | "hold_action" | "double_tap_action", partial: Partial<ActionConfig>) {
    if (!this._config) return;
    const next = applyEditorActionPatch(this._config, which, partial);
    this._commitUpdate(next.config, next.warnings);
  }

  private _onActionText(
    which: "tap_action" | "hold_action" | "double_tap_action",
    field: "navigation_path" | "url_path" | "service"
  ) {
    return (e: unknown) => this._updateAction(which, { [field]: asString(readEventValue(e)) } as any);
  }

  private _onActionMode(which: "tap_action" | "hold_action" | "double_tap_action") {
    return (value: string) => this._updateAction(which, { action: value as any });
  }

  private _onServiceDataChange(which: "tap_action" | "hold_action" | "double_tap_action", raw: string) {
    raw = String(raw ?? "").trim();
    if (!raw) {
      this._updateAction(which, { service_data: {} } as any);
      return;
    }
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") {
        this._updateAction(which, { service_data: obj } as any);
      }
    } catch {
      // ignore parse errors
    }
  }

  private _stops(): Level[] {
    return listLevels((this._config as any)?.levels);
  }

  private _setStops(stops: Level[]) {
    if (!this._config) return;
    const next = replaceEditorLevels(this._config, stops);
    this._commitUpdate(next.config, next.warnings);
  }

  private _addStop = () => {
    if (!this._config) return;
    const cfg = this._config as any;
    this._setStops(
      addLevel(this._stops(), {
        min: Number(cfg?.data?.min ?? DEFAULTS.data.min),
        max: Number(cfg?.data?.max ?? DEFAULTS.data.max),
        precision: cfg?.data?.precision,
      })
    );
  };

  private _removeStop(idx: number) {
    this._setStops(removeLevel(this._stops(), idx));
  }

  private _updateStop(idx: number, partial: Partial<Level>) {
    this._setStops(updateLevel(this._stops(), idx, partial));
  }

  private _normalizeLayoutValue(raw: string | undefined): "horizontal" | "vertical" | "stacked" {
    return normalizeLayoutMode(raw);
  }

  private _normalizeGaugeAlignment(raw: string | undefined): "center_bar" | "center_labels" {
    return normalizeGaugeAlignmentMode(raw);
  }

  private _normalizeScalePlacement(raw: string | undefined): "top" | "bottom" | "center" | "below" {
    return normalizeScalePlacementMode(raw);
  }

  private _normalizeScaleTickSpacing(raw: string | undefined): "even" | "levels" {
    return normalizeScaleTickSpacingMode(raw);
  }

  private _renderNativeSelect(
    label: string | null,
    value: string,
    opts: SelectOpt[],
    onChange: (v: string) => void,
    disabled = false,
    helperText?: string
  ) {
    const val = opts.some((o) => o.value === value) ? value : opts[0]?.value ?? "";
    return html`
      <div class="field">
        <ha-select
          .label=${label ?? ""}
          .value=${val}
          .disabled=${disabled}
          fixedMenuPosition
          naturalMenuWidth
          @selected=${(e: any) => onChange(e.target.value)}
          @closed=${(e: Event) => e.stopPropagation()}
        >
          ${opts.map((o) => html`<ha-list-item .value=${o.value}>${o.label}</ha-list-item>`)}
        </ha-select>
        ${helperText ? html`<div class="row-desc">${helperText}</div>` : nothing}
      </div>
    `;
  }

  private _renderColorField(label: string, value: string | undefined, disabled: boolean, onChange: (v: string) => void) {
    const def = this._primaryColorDefault();
    const hexRaw = String(value ?? "").trim();
    const hex = hexRaw.startsWith("#") && hexRaw.length === 7 ? hexRaw : def;
    const swatch = hex;
    return html`
      <div class="color-field">
        <input
          type="color"
          aria-label=${label}
          title=${label}
          .value=${swatch}
          ?disabled=${disabled}
          @input=${(e: any) => onChange(e.target.value || def)}
          style="width:22px; height:22px; padding:0; border:0; background:transparent; cursor:pointer;"
        />
        <ha-textfield
          .label=${label}
          .value=${hex}
          placeholder="#03a9f4"
          ?disabled=${disabled}
          @change=${(e: any) => onChange(e.target.value || def)}
        ></ha-textfield>
      </div>
    `;
  }

  private _offsetDisplay(value: number | undefined): string {
    const v = Number(value ?? 0);
    if (!Number.isFinite(v)) return "0";
    return String(v);
  }

  private _offsetFromInput(raw: string, min: number, max: number, fallback: number): number {
    const v = asNumberOrNull(raw);
    if (v === null) return fallback;
    const clamped = Math.max(min, Math.min(max, v));
    return clamped;
  }

  private _renderVerticalColorField(label: string, value: string | undefined, onChange: (v: string) => void) {
    const hexRaw = String(value ?? "").trim();
    const hex = hexRaw.startsWith("#") && hexRaw.length === 7 ? hexRaw : "#000000";
    return html`
      <div style="display:flex; flex-direction:column; align-items:flex-start;">
        <ha-textfield
          .label=${label}
          .value=${hex}
          placeholder="#03a9f4"
          @change=${(e: any) => onChange(e.target.value || undefined)}
        ></ha-textfield>
        <input
          type="color"
          aria-label=${label}
          title=${label}
          .value=${hex}
          @input=${(e: any) => onChange(e.target.value)}
          style="padding:0; border:0; background:transparent; cursor:pointer; margin-top:2px;"
        />
      </div>
    `;
  }

  private _renderActionEditor(which: "tap_action" | "hold_action" | "double_tap_action", label: string) {
    if (!this._config) return nothing;
    const act = ensureAction(which, (this._config as any).actions?.[which]);

    const showNav = act.action === "navigate";
    const showUrl = act.action === "url";
    const showSvc = act.action === "call-service";

    return html`
      <div class="panel">
        ${this._renderNativeSelect("Action", act.action, ACTIONS, this._onActionMode(which))}

        ${showNav
          ? html`<ha-textfield
              label="Navigation path"
              .value=${(act as any).navigation_path ?? ""}
              @input=${this._onActionText(which, "navigation_path")}
            ></ha-textfield>`
          : nothing}

        ${showUrl
          ? html`<ha-textfield
              label="URL"
              .value=${(act as any).url_path ?? ""}
              @input=${this._onActionText(which, "url_path")}
            ></ha-textfield>`
          : nothing}

        ${showSvc
          ? html`<ha-textfield
              label="Service (domain.service)"
              .value=${(act as any).service ?? ""}
              @input=${this._onActionText(which, "service")}
            ></ha-textfield>`
          : nothing}

        ${showSvc
          ? html`<ha-textfield
              label="Service data (JSON)"
              .value=${JSON.stringify((act as any).service_data ?? {}, null, 0)}
              @change=${(e: any) => this._onServiceDataChange(which, asString(readEventValue(e)))}
            ></ha-textfield>`
          : nothing}

      </div>
    `;
  }

  render() {
    if (!this.hass || !this._config) return nothing;

    const c = mergeDefaults(DEFAULTS, this._config);
    const content = c.content ?? DEFAULTS.content;
    const data = c.data ?? DEFAULTS.data;
    const layout = c.layout ?? DEFAULTS.layout;
    const layoutMode = this._normalizeLayoutValue((c.layout as any)?.mode);
    const gaugeAlignmentUiValue = layoutMode === "horizontal" ? "center_labels" : this._normalizeGaugeAlignment((c.layout as any)?.gauge_alignment);
    const bar = c.bar ?? DEFAULTS.bar;
    const pointer = c.pointer ?? DEFAULTS.pointer;
    const scale = c.scale ?? DEFAULTS.scale;

    return html`
      ${this._warnings.length
        ? html`<div class="warnings">
            ${this._warnings.map((w) => html`<ha-alert alert-type="warning">${w}</ha-alert>`)}
          </div>`
        : nothing}

      <div class="section-card">
        <div class="section-title">Entity</div>
        <ha-entity-picker
          .hass=${this.hass}
          .value=${c.entity ?? ""}
          .disabled=${false}
          .entityFilter=${this._entityFilter}
          allow-custom-entity
          @value-changed=${(e: unknown) => this._updatePath(["entity"], readEventValue(e))}
        ></ha-entity-picker>
      </div>

      <ha-expansion-panel expanded outlined>
        <span slot="header" class="panel-header">Content</span>
        <div class="panel">
          <div class="toggle-row">
            <ha-formfield label="Show name">
              <ha-switch
                .checked=${content.show_name ?? true}
                @change=${this._onToggle(["content", "show_name"])}
              ></ha-switch>
            </ha-formfield>

            <ha-formfield label="Show state">
              <ha-switch
                .checked=${content.show_state ?? true}
                @change=${this._onToggle(["content", "show_state"])}
              ></ha-switch>
            </ha-formfield>

            <ha-formfield label="Show icon">
              <ha-switch
                .checked=${content.show_icon ?? DEFAULTS.content.show_icon}
                @change=${this._onToggle(["content", "show_icon"])}
              ></ha-switch>
            </ha-formfield>
          </div>

          <ha-textfield
            label="Name"
            .value=${content.name ?? ""}
            placeholder="Detected from entity"
            .disabled=${!(content.show_name ?? true)}
            @input=${this._onTextInput(["content", "name"], true)}
          ></ha-textfield>

          <div class="row2">
            ${(() => {
              const iconDisabled = !(content.show_icon ?? DEFAULTS.content.show_icon);
              return html`
                <ha-icon-picker
                  label="Icon"
                  .hass=${this.hass}
                  .value=${content.icon ?? ""}
                  .disabled=${iconDisabled}
                  @value-changed=${this._onTextInput(["content", "icon"], true)}
                ></ha-icon-picker>

                ${this._renderNativeSelect(
                  "Icon color",
                  content.icon_color?.mode ?? DEFAULTS.content.icon_color.mode,
                  [
                    { value: "theme", label: "Theme" },
                    { value: "state", label: "State" },
                    { value: "level", label: "Level" },
                    { value: "custom", label: "Custom" },
                  ],
                  (v) => {
                    const next: any = buildPatch(["content", "icon_color", "mode"], v as any);
                    if (v === "custom") {
                      next.content.icon_color.value = this._resolveIconColor(c);
                    }
                    this._update(next);
                  },
                  iconDisabled
                )}

                ${content.icon_color?.mode === "custom"
                  ? this._renderColorField(
                      "Custom",
                      content.icon_color?.value ?? "",
                      iconDisabled,
                      (v) => this._updatePath(["content", "icon_color", "value"], asOptionalString(v))
                    )
                  : html`<div></div>`}
              `;
            })()}
          </div>

          ${this._renderSubheader("Style")}
          <div class="row2">
            ${this._renderNativeSelect(
              "Card style",
              (c.style as any)?.card ?? DEFAULTS.style.card ?? "default",
              CARD_STYLES,
              this._onSelect(["style", "card"])
            )}
            <div></div>
          </div>

          ${this._renderSubheader("Layout")}
          <div class="row3">
            ${this._renderNativeSelect(
              "Content layout",
              layoutMode,
              LAYOUTS,
              this._onSelect(["layout", "mode"])
            )}
            ${layoutMode === "horizontal"
              ? html`
                  <div class="slider-block span2">
                    <label class="slider-label">Icon and text width %</label>
                    <ha-slider
                      labeled
                      pin
                      min="5"
                      max="95"
                      step="1"
                      .value=${this._splitPct(c)}
                      @value-changed=${(e: any) => this._onSplitChange(e)}
                      @change=${(e: any) => this._onSplitChange(e)}
                    ></ha-slider>
                    <div class="row-desc small">The gauge uses the remaining width.</div>
                  </div>
                `
              : html`<div></div><div></div>`}
          </div>
          <div class="row2">
            ${this._renderNativeSelect(
              "Gauge alignment",
              gaugeAlignmentUiValue,
              [
                { value: "center_bar", label: "Center (bar)" },
                { value: "center_labels", label: "Center (labels)" },
              ],
              this._onSelect(["layout", "gauge_alignment"]),
              layoutMode === "horizontal"
            )}
            <ha-textfield
              label="Content spacing (px)"
              type="number"
              .value=${String(
                layout.content_spacing ?? DEFAULTS.layout.content_spacing ?? 0
              )}
              @input=${this._onNumberInput(["layout", "content_spacing"], {
                fallback: (DEFAULTS.layout as any).content_spacing ?? 0,
                min: -48,
                max: 48,
              })}
              @change=${this._onNumberInput(["layout", "content_spacing"], {
                fallback: (DEFAULTS.layout as any).content_spacing ?? 0,
                min: -48,
                max: 48,
              })}
            ></ha-textfield>
          </div>
          <div class="row-desc">Horizontal spacing between icon and text.</div>
        </div>
      </ha-expansion-panel>

      <ha-expansion-panel expanded outlined>
        <span slot="header" class="panel-header">Data</span>
        <div class="panel">
          <div class="row3">
            <ha-textfield
              label="Minimum"
              type="number"
              .value=${String(data.min ?? 0)}
              @change=${this._onNumberInput(["data", "min"], { fallback: 0 })}
            ></ha-textfield>
            <ha-textfield
              label="Maximum"
              type="number"
              .value=${String(data.max ?? 100)}
              @change=${this._onNumberInput(["data", "max"], { fallback: 100 })}
            ></ha-textfield>
            <ha-textfield
              label="Precision"
              type="number"
              .value=${data.precision ?? ""}
              placeholder="Auto"
              @change=${(e: any) => {
                const v = readEventNumberOrNull(e);
                this._updatePath(["data", "precision"], v ?? null);
              }}
            ></ha-textfield>
          </div>
          <ha-textfield
            label="Unit"
            .value=${data.unit ?? ""}
            placeholder="Detected from entity"
            @change=${this._onTextInput(["data", "unit"])}
          ></ha-textfield>
        </div>
      </ha-expansion-panel>

      ${(() => {
        const levelsExpanded = this._levelsExpanded ?? this._isLevelsModified(c);
        return this._renderGaugeSectionPanel(
              "Levels",
              levelsExpanded,
              html`
                <div class="stops">
                  ${this._stops().map(
                    (s, idx) => html`
                      <div class="stopRow">
                        <ha-textfield
                          class="stop-compact"
                          label="Value"
                          type="number"
                          .value=${String(s.value)}
                          @change=${(e: any) => {
                            const v = readEventNumberOrNull(e);
                            if (v !== null) this._updateStop(idx, { value: v });
                          }}
                        ></ha-textfield>

                        <div class="stop-color">
                          ${this._renderVerticalColorField("Color", String(s.color), (v) =>
                            this._updateStop(idx, { color: v })
                          )}
                        </div>

                        <ha-icon-picker
                          class="stop-icon"
                          label="Icon"
                          .hass=${this.hass}
                          .value=${(s as any).icon ?? ""}
                          @value-changed=${(e: unknown) => this._updateStop(idx, { icon: asOptionalString(readEventValue(e)) })}
                        ></ha-icon-picker>

                        <button class="icon-btn danger" aria-label="Remove level" title="Remove level" @click=${() => this._removeStop(idx)}>
                          &#10005;
                        </button>
                      </div>
                    `
                  )}
                </div>

                <div class="stopActions">
                  <div class="row-desc">Use levels to map values to colors and icons (optional). The last level applies to all higher values.</div>
                  <button class="add-btn" aria-label="Add level" title="Add level" @click=${this._addStop}>
                    <span class="icon-plus">+</span> <span>Add level</span>
                  </button>
                </div>
              `
            );
      })()}

      ${(() => {
        const barExpanded = this._barExpanded ?? this._isBarModified(c);
        return this._renderGaugeSectionPanel(
              "Bar",
              barExpanded,
              html`
                <div class="toggle-row">
                  <ha-formfield label="Show bar">
                    <ha-switch
                      .checked=${bar.show ?? DEFAULTS.bar.show}
                      @change=${this._onToggle(["bar", "show"])}
                    ></ha-switch>
                  </ha-formfield>
                </div>
                ${bar.show ?? DEFAULTS.bar.show
                  ? html`
                      <div class="row2">
                        ${this._renderNativeSelect(
                          "End shape",
                          bar.edge ?? DEFAULTS.bar.edge ?? "rounded",
                          EDGES,
                          (v) =>
                            this._update(
                              buildPatch(["bar"], v === "square" ? { edge: v as any, radius: null } : { edge: v as any }) as any
                            )
                        )}
                        <ha-textfield
                          label="End radius (px)"
                          type="number"
                          min="0"
                          max="100"
                          .disabled=${(bar.edge ?? DEFAULTS.bar.edge ?? "rounded") === "square"}
                          .value=${
                            bar.radius === null || bar.radius === undefined ? "" : String(bar.radius)
                          }
                          @change=${(e: any) => {
                            const v = readEventNumberOrNull(e);
                            const next = v !== null ? Math.max(0, Math.min(100, v)) : null;
                            this._updatePath(["bar", "radius"], next);
                          }}
                        ></ha-textfield>
                      </div>
                      <div class="row2">
                        <ha-textfield
                          label="Height (px)"
                          type="number"
                          min="0"
                          max="100"
                          .value=${String(bar.height ?? DEFAULTS.bar.height ?? 8)}
                          @change=${this._onNumberInput(["bar", "height"], { fallback: 8, min: 0, max: 100 })}
                        ></ha-textfield>
                      ${this._renderNativeSelect(
                          "Color mode",
                          normalizeBarColorMode((bar.color_mode ?? DEFAULTS.bar.color_mode) as any),
                          BAR_COLOR_MODES,
                          this._onSelect(["bar", "color_mode"])
                        )}
                      </div>
                      <div class="row-desc small">Leave End radius blank to use End shape default.</div>
                      ${this._renderGroupTitle("Track")}
                      <div class="row-desc">Track is the unfilled portion of the bar.</div>
                      <div class="row3">
                        ${this._renderVerticalColorField("Color", this._gapColorValue(c), (v) => {
                          const def = this._gapColorDefault();
                          this._updatePath(["bar", "track", "background"], v && v !== def ? v : undefined);
                        })}
                        <div class="slider-block span2">
                          <label class="slider-label">Intensity</label>
                          <ha-slider
                            labeled
                            pin
                            min="0"
                            max="100"
                            step="1"
                            .value=${Number(bar.track?.intensity ?? DEFAULTS.bar.track.intensity)}
                            .disabled=${!(bar.show ?? DEFAULTS.bar.show)}
                            @value-changed=${(e: any) => {
                              const v = readEventNumberOrNull(e);
                              if (v !== null) this._updatePath(["bar", "track", "intensity"], coerceNumericValue(v, { min: 0, max: 100 }));
                            }}
                            @change=${(e: any) => {
                              const v = readEventNumberOrNull(e);
                              if (v !== null) this._updatePath(["bar", "track", "intensity"], coerceNumericValue(v, { min: 0, max: 100 }));
                            }}
                          ></ha-slider>
                          <div class="row-desc small">0 = invisible, 100 = bar color</div>
                        </div>
                      </div>
                      ${this._renderGroupTitle("Segments")}
                      ${(() => {
                        const mode = bar.segments?.mode ?? DEFAULTS.bar.segments.mode;
                        const showBar = bar.show ?? DEFAULTS.bar.show;
                        const showSegments = showBar && mode !== "off";
                        return html`
                          <div class="row3">
                            ${this._renderNativeSelect(
                              "Segment mode",
                              mode,
                              [
                                { value: "off", label: "Off" },
                                { value: "level", label: "Level-aligned" },
                                { value: "fixed", label: "Fixed width" },
                              ],
                              this._onSelect(["bar", "segments", "mode"]),
                              !showBar,
                            )}
                            ${mode === "fixed" && showBar
                              ? html`
                                  <ha-textfield
                                    label="Segment width (px)"
                                    type="number"
                                    min="0"
                                    .value=${String(bar.segments?.width ?? DEFAULTS.bar.segments.width)}
                                    @change=${(e: any) => {
                                      const v = readEventNumberOrNull(e);
                                      const seg = v !== null ? Math.max(0, v) : DEFAULTS.bar.segments.width;
                                      // If segment shrinks below gap, clamp gap too.
                                      const maxGap = seg > 0 ? Math.max(0, seg - 1) : 0;
                                      const gap = Math.min(bar.segments?.gap ?? DEFAULTS.bar.segments.gap, maxGap);
                                      this._update(buildPatch(["bar", "segments"], { width: seg, gap }) as any);
                                    }}
                                  ></ha-textfield>
                                `
                              : mode === "level" && showBar
                              ? html`
                                  <ha-textfield
                                    label="Segments per level"
                                    type="number"
                                    min="1"
                                    max="20"
                                    .value=${String(
                                      (bar.segments as any)?.segments_per_level ??
                                        (DEFAULTS.bar.segments as any).segments_per_level ??
                                        1
                                    )}
                                    @change=${(e: any) => {
                                      const v = readEventNumberOrNull(e);
                                      const next =
                                        v !== null
                                          ? clamp(Math.floor(v), 1, 20)
                                          : ((DEFAULTS.bar.segments as any).segments_per_level ?? 1);
                                      this._updatePath(["bar", "segments", "segments_per_level"], next);
                                    }}
                                  ></ha-textfield>
                                `
                              : html`<div></div>`}
                            ${showSegments
                              ? html`
                                  <ha-textfield
                                    label="Gap width (px)"
                                    type="number"
                                    min="0"
                                    .max=${String(
                                      Math.max(
                                        0,
                                        mode === "fixed"
                                          ? ((bar.segments?.width ?? DEFAULTS.bar.segments.width ?? 0) - 1)
                                          : Number.MAX_SAFE_INTEGER
                                      )
                                    )}
                                    .value=${String(bar.segments?.gap ?? DEFAULTS.bar.segments.gap)}
                                    @change=${(e: any) => {
                                      const raw = readEventNumberOrNull(e);
                                      const seg = Number(bar.segments?.width ?? DEFAULTS.bar.segments.width ?? 0);
                                      const maxGap =
                                        mode === "fixed" ? (seg > 0 ? Math.max(0, seg - 1) : 0) : Number.MAX_SAFE_INTEGER;
                                      let gap = raw !== null ? Math.max(0, raw) : DEFAULTS.bar.segments.gap;
                                      gap = Math.min(gap, maxGap);
                                      if (mode === "fixed" && seg <= 0) gap = 0;
                                      this._updatePath(["bar", "segments", "gap"], gap);
                                    }}
                                  ></ha-textfield>
                                `
                              : html`<div></div>`}
                          </div>
                          ${showSegments
                            ? html`
                                ${this._renderGroupTitle("Snapping")}
                                <div class="row-desc">Snap fill length and/or color to segment geometry.</div>
                                <div class="row3">
                                  ${this._renderNativeSelect(
                                    "Fill mode",
                                    normalizeBarFillMode((bar as any).fill_mode ?? (DEFAULTS.bar as any).fill_mode),
                                    BAR_FILL_MODES,
                                    this._onSelect(["bar", "fill_mode"]),
                                    false,
                                  )}
                                  ${this._renderNativeSelect(
                                    "Snap fill",
                                    normalizeFillSnappingMode(
                                      (bar as any).snapping?.fill ?? (DEFAULTS.bar as any).snapping.fill
                                    ),
                                    [
                                      { value: "off", label: "Off" },
                                      { value: "down", label: "Down" },
                                      { value: "nearest", label: "Nearest" },
                                      { value: "up", label: "Up" },
                                    ],
                                    this._onSelect(["bar", "snapping", "fill"]),
                                    false,
                                  )}
                                  ${this._renderNativeSelect(
                                    "Snap color",
                                    normalizeColorSnappingMode(
                                      (bar as any).snapping?.color ?? (DEFAULTS.bar as any).snapping.color
                                    ),
                                    [
                                      { value: "off", label: "Off" },
                                      { value: "level", label: "Level" },
                                      { value: "midpoint", label: "Midpoint" },
                                      { value: "high", label: "High" },
                                      { value: "low", label: "Low" },
                                    ],
                                    this._onSelect(["bar", "snapping", "color"]),
                                    false,
                                  )}
                                </div>
                              `
                            : nothing}
                        `;
                      })()}
                    `
                  : nothing}
              `
            );
      })()}

      ${(() => {
        const pointerExpanded = this._pointerExpanded ?? this._isPointerModified(c);
        return this._renderGaugeSectionPanel(
              "Pointer",
              pointerExpanded,
              html`
                <div class="toggle-row">
                  <ha-formfield label="Show pointer">
                    <ha-switch
                      .checked=${pointer.show ?? DEFAULTS.pointer.show}
                      @change=${this._onToggle(["pointer", "show"])}
                    ></ha-switch>
                  </ha-formfield>
                </div>
                ${pointer.show ?? DEFAULTS.pointer.show
                  ? html`
                      <div class="row3">
                        <ha-textfield
                          label="Size (px)"
                          type="number"
                          min="0"
                          max="100"
                          .value=${String(pointer.size ?? DEFAULTS.pointer.size ?? 8)}
                          @change=${this._onNumberInput(["pointer", "size"], { fallback: DEFAULTS.pointer.size ?? 8, min: 0, max: 100 })}
                        ></ha-textfield>

                        <ha-textfield
                          label="Angle"
                          type="number"
                          min="10"
                          max="90"
                          .value=${String(pointer.angle ?? DEFAULTS.pointer.angle ?? 90)}
                          @change=${this._onNumberInput(["pointer", "angle"], { fallback: DEFAULTS.pointer.angle ?? 90, min: 10, max: 90 })}
                        ></ha-textfield>

                        <ha-textfield
                          label="Vertical offset (px)"
                          type="number"
                          min="-100"
                          max="100"
                          .value=${this._offsetDisplay((pointer as any).y_offset ?? (DEFAULTS.pointer as any).y_offset ?? 0)}
                          @change=${(e: any) => {
                            const next = this._offsetFromInput(asString(readEventValue(e)), -100, 100, (DEFAULTS.pointer as any).y_offset ?? 0);
                            this._updatePath(["pointer", "y_offset"], next);
                          }}
                        ></ha-textfield>
                      </div>

                      <div class="row2">
                        ${this._renderNativeSelect(
                          "Color",
                          pointer.color_mode ?? DEFAULTS.pointer.color_mode,
                          [
                            { value: "level", label: "Current level" },
                            { value: "gradient", label: "Smooth gradient" },
                            { value: "custom", label: "Custom" },
                          ],
                          (v) => {
                            const next: any = buildPatch(["pointer", "color_mode"], v as any);
                            if (v === "custom" && !(pointer.color ?? "")) {
                              next.pointer.color = this._primaryTextColorDefault();
                            }
                            this._update(next);
                          },
                          false,
                        )}
                      </div>
                      ${pointer.color_mode === "custom"
                        ? this._renderColorField(
                            "Custom",
                            pointer.color ?? this._primaryTextColorDefault(),
                            false,
                            (v) => this._updatePath(["pointer", "color"], asOptionalString(v))
                          )
                        : nothing}
                    `
                  : nothing}
              `
            );
      })()}

      ${(() => {
        const scaleExpanded = this._scaleExpanded ?? this._isScaleModified(c);
        return this._renderGaugeSectionPanel(
              "Scale",
              scaleExpanded,
              html`
                <div class="scale-grid">
                  <div class="scale-group">
                    <ha-formfield label="Show scale">
                      <ha-switch
                        .checked=${!!scale.show}
                        @change=${this._onToggle(["scale", "show"])}
                      ></ha-switch>
                    </ha-formfield>
                    ${scale.show
                      ? html`
                          <div class="row2">
                            ${this._renderNativeSelect(
                              "Placement",
                              scale.placement ?? DEFAULTS.scale.placement,
                              [
                                { value: "top", label: "Top" },
                                { value: "bottom", label: "Bottom" },
                                { value: "center", label: "Center" },
                                { value: "below", label: "Below" },
                              ],
                              this._onSelect(["scale", "placement"]),
                              false,
                            )}
                            <ha-textfield
                              label="Vertical offset (px)"
                              type="number"
                              min="-24"
                              max="24"
                              .value=${this._offsetDisplay((scale as any).y_offset ?? (DEFAULTS.scale as any).y_offset ?? 0)}
                              @change=${(e: any) => {
                                const next = this._offsetFromInput(
                                  asString(readEventValue(e)),
                                  -24,
                                  24,
                                  (DEFAULTS.scale as any).y_offset ?? 0
                                );
                                this._updatePath(["scale", "y_offset"], next);
                              }}
                            ></ha-textfield>
                          </div>

                          <div class="row2">
                            ${this._renderNativeSelect(
                              "Tick spacing",
                              (scale as any).spacing ?? (DEFAULTS.scale as any).spacing,
                              [
                                { value: "even", label: "Even" },
                                { value: "levels", label: "Level-aligned" },
                              ],
                              this._onSelect(["scale", "spacing"]),
                              false,
                            )}
                            <div></div>
                          </div>

                          <div class="row2">
                            ${(() => {
                              const spacing = (scale as any).spacing ?? (DEFAULTS.scale as any).spacing;
                              return html`
                            <ha-textfield
                              label="Major tick count"
                              type="number"
                              min="2"
                              max="26"
                              .value=${String((scale.ticks as any)?.major_count ?? (DEFAULTS.scale.ticks as any).major_count)}
                              .disabled=${spacing === "levels"}
                              @change=${this._onNumberInput(["scale", "ticks", "major_count"], {
                                fallback: (DEFAULTS.scale.ticks as any).major_count,
                              })}
                            ></ha-textfield>
                              `;
                            })()}
                            <ha-textfield
                              label="Minor ticks per major"
                              type="number"
                              min="0"
                              max="9"
                              .value=${String((scale.ticks as any)?.minor_per_major ?? (DEFAULTS.scale.ticks as any).minor_per_major)}
                              @change=${this._onNumberInput(["scale", "ticks", "minor_per_major"], {
                                fallback: (DEFAULTS.scale.ticks as any).minor_per_major,
                              })}
                            ></ha-textfield>
                          </div>
                          ${(() => {
                            const spacing = (scale as any).spacing ?? (DEFAULTS.scale as any).spacing;
                            return spacing === "levels"
                              ? html`<div class="row-desc">Major ticks come from level boundaries when spacing is Level-aligned.</div>`
                              : nothing;
                          })()}

                          <div class="row2">
                            <ha-textfield
                              label="Major tick height (px)"
                              type="number"
                              min="1"
                              max="40"
                              .value=${String((scale.ticks as any)?.height_major ?? (DEFAULTS.scale.ticks as any).height_major)}
                              @change=${this._onNumberInput(["scale", "ticks", "height_major"], {
                                fallback: (DEFAULTS.scale.ticks as any).height_major,
                              })}
                            ></ha-textfield>
                            <ha-textfield
                              label="Minor tick height (px)"
                              type="number"
                              min="1"
                              max="40"
                              .value=${String((scale.ticks as any)?.height_minor ?? (DEFAULTS.scale.ticks as any).height_minor)}
                              @change=${this._onNumberInput(["scale", "ticks", "height_minor"], {
                                fallback: (DEFAULTS.scale.ticks as any).height_minor,
                              })}
                            ></ha-textfield>
                          </div>

                          ${(() => {
                            const tickMode = scale.ticks?.color_mode ?? DEFAULTS.scale.ticks.color_mode;
                            return html`
                              <div class="row2">
                                ${this._renderNativeSelect(
                                  "Tick color",
                                  tickMode,
                                  SCALE_TICK_COLOR_MODES,
                                  (v) => {
                                    const next: any = buildPatch(["scale", "ticks", "color_mode"], v as any);
                                    if (v === "custom" && !(scale.ticks?.color ?? "")) {
                                      next.scale.ticks.color = this._primaryTextColorDefault();
                                    }
                                    this._update(next);
                                  },
                                  !scale.show
                                )}
                                ${tickMode === "custom"
                                  ? this._renderColorField(
                                      "Custom",
                                      scale.ticks?.color ?? "",
                                      !scale.show,
                                      (v) => this._updatePath(["scale", "ticks", "color"], asOptionalString(v))
                                    )
                                  : html`<div></div>`}
                              </div>
                            `;
                          })()}
                        `
                      : nothing}
                  </div>

                  <div class="scale-group">
                    <ha-formfield label="Show labels">
                      <ha-switch
                        .checked=${scale.labels?.show ?? true}
                        .disabled=${!scale.show}
                        @change=${this._onToggle(["scale", "labels", "show"])}
                      ></ha-switch>
                    </ha-formfield>
                    ${scale.show && (scale.labels?.show ?? true)
                      ? html`<div class="row-desc">Labels use the same scale positions as major ticks.</div>`
                      : nothing}

                    ${scale.show && (scale.labels?.show ?? true)
                      ? (() => {
                          const labelMode = scale.labels?.color_mode ?? DEFAULTS.scale.labels.color_mode;
                          return html`
                            <div class="row3">
                              <ha-textfield
                                label="Precision"
                                type="number"
                                min="0"
                                max="6"
                                .value=${String(scale.labels?.precision ?? "")}
                                placeholder="Use value precision"
                                @change=${this._onNumberInput(["scale", "labels", "precision"], {
                                  fallback: DEFAULTS.scale.labels.precision,
                                })}
                              ></ha-textfield>
                              <ha-textfield
                                label="Size (px)"
                                type="number"
                                min="8"
                                max="24"
                                .value=${String(scale.labels?.size ?? DEFAULTS.scale.labels.size ?? 12)}
                                @change=${this._onNumberInput(["scale", "labels", "size"], {
                                  fallback: DEFAULTS.scale.labels.size ?? 12,
                                  min: 8,
                                  max: 24,
                                })}
                              ></ha-textfield>
                              <ha-textfield
                                label="Vertical offset (px)"
                                type="number"
                                min="-24"
                                max="24"
                                .value=${this._offsetDisplay((scale.labels as any)?.y_offset ?? (DEFAULTS.scale.labels as any).y_offset ?? 0)}
                                @change=${(e: any) => {
                                  const next = this._offsetFromInput(
                                    asString(readEventValue(e)),
                                    -24,
                                    24,
                                    (DEFAULTS.scale.labels as any).y_offset ?? 0
                                  );
                                  this._updatePath(["scale", "labels", "y_offset"], next);
                                }}
                              ></ha-textfield>
                              ${this._renderNativeSelect(
                                "Color",
                                labelMode,
                                SCALE_COLOR_MODES,
                                (v) => {
                                  const next: any = buildPatch(["scale", "labels", "color_mode"], v as any);
                                  if (v === "custom" && !(scale.labels?.color ?? "")) {
                                    next.scale.labels.color = this._primaryTextColorDefault();
                                  }
                                  this._update(next);
                                },
                                !scale.show
                              )}
                            </div>

                            <div class="row2">
                              ${labelMode === "custom"
                                ? this._renderColorField(
                                    "Custom",
                                    scale.labels?.color ?? "",
                                    !scale.show,
                                    (v) => this._updatePath(["scale", "labels", "color"], asOptionalString(v))
                                  )
                                : html`<div></div>`}
                              <div></div>
                            </div>
                          `;
                        })()
                      : nothing}
                  </div>
                </div>
              `
            );
      })()}

      <ha-expansion-panel outlined>
        <span slot="header" class="panel-header">Interactions</span>
        <div class="panel">
          <div class="section-title">Tap</div>
          ${this._renderActionEditor("tap_action", "Tap behaviour")}
          <div class="section-title">Hold</div>
          ${this._renderActionEditor("hold_action", "Hold behaviour")}
          <div class="section-title">Double tap</div>
          ${this._renderActionEditor("double_tap_action", "Double tap behaviour")}
        </div>
      </ha-expansion-panel>

      <div class="build-tag">${BUILD_TAG}</div>
    `;
  }
}

export function registerSegmentGaugeEditor() {
  const tag = "segment-gauge-editor";
  if (!customElements.get(tag)) {
    customElements.define(tag, SegmentGaugeEditor);
  }
}
