/*
 * Minimal Home Assistant element stubs for local harness use only.
 * These are intentionally small and deterministic.
 */

type AnyObj = Record<string, any>;

function defineOnce(tag: string, ctor: CustomElementConstructor) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

class HaCard extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host {
          display: block;
          background: var(--ha-card-background, var(--card-background-color, #1b1f24));
          color: var(--primary-text-color, #e6e6e6);
          border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.16));
          border-radius: 12px;
          box-shadow: var(--ha-card-box-shadow, none);
        }
      </style>
      <slot></slot>
    `;
  }
}

class HaIcon extends HTMLElement {
  private _icon = "mdi:help-circle";

  get icon(): string {
    return this._icon;
  }

  set icon(v: string) {
    this._icon = String(v || "mdi:help-circle");
    this.render();
  }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.render();
  }

  private render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: inherit;
        }
        span {
          font-size: 12px;
          line-height: 1;
          opacity: 0.95;
        }
      </style>
      <span title="${this._icon}">${this._icon.replace("mdi:", "")}</span>
    `;
  }
}

class HaStateIcon extends HTMLElement {
  hass: AnyObj | undefined;
  stateObj: AnyObj | undefined;
  stateColor = false;

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.render();
  }

  updated() {
    this.render();
  }

  private render() {
    if (!this.shadowRoot) return;
    const entity = this.stateObj?.entity_id ?? "state";
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: ${this.stateColor ? "var(--state-icon-color, var(--primary-color, #03a9f4))" : "inherit"};
        }
        span {
          font-size: 11px;
          opacity: 0.9;
        }
      </style>
      <span title="${entity}">icon</span>
    `;
  }
}

class HaListItem extends HTMLElement {
  value = "";
}

class HaSelect extends HTMLElement {
  private _label = "";
  private _value = "";
  private _disabled = false;
  private _observer?: MutationObserver;
  private _select?: HTMLSelectElement;
  private _labelEl?: HTMLLabelElement;

  get label(): string {
    return this._label;
  }

  set label(v: string) {
    this._label = String(v ?? "");
    this.sync();
  }

  get value(): string {
    return this._value;
  }

  set value(v: string) {
    this._value = String(v ?? "");
    this.sync();
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(v: boolean) {
    this._disabled = !!v;
    this.sync();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host { display:block; }
          label {
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 12px;
            color: var(--secondary-text-color, #a8afb8);
          }
          select {
            height: 40px;
            border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.16));
            border-radius: 6px;
            background: var(--ha-card-background, #1b1f24);
            color: var(--primary-text-color, #e6e6e6);
            padding: 0 10px;
            font: inherit;
          }
        </style>
        <label>
          <span id="lbl"></span>
          <select id="sel"></select>
        </label>
      `;
      this._select = root.querySelector("#sel") as HTMLSelectElement;
      this._labelEl = root.querySelector("#lbl") as HTMLLabelElement;
      this._select.addEventListener("change", () => {
        this._value = this._select?.value ?? "";
        this.dispatchEvent(new Event("selected", { bubbles: true, composed: true }));
      });
    }

    this._observer = new MutationObserver(() => this.sync());
    this._observer.observe(this, { childList: true, subtree: true, characterData: true });
    this.sync();
  }

  disconnectedCallback() {
    this._observer?.disconnect();
    this._observer = undefined;
  }

  private sync() {
    if (!this._select || !this._labelEl) return;
    this._labelEl.textContent = this._label;
    const items = Array.from(this.querySelectorAll("ha-list-item")) as HaListItem[];
    this._select.innerHTML = "";
    for (const item of items) {
      const option = document.createElement("option");
      option.value = String((item as any).value ?? item.getAttribute("value") ?? "");
      option.textContent = item.textContent?.trim() || option.value;
      this._select.appendChild(option);
    }
    this._select.disabled = this._disabled;
    if (this._select.options.length === 0) {
      const fallback = document.createElement("option");
      fallback.value = "";
      fallback.textContent = "";
      this._select.appendChild(fallback);
    }
    const hasValue = Array.from(this._select.options).some((o) => o.value === this._value);
    this._select.value = hasValue ? this._value : this._select.options[0]?.value ?? "";
    this._value = this._select.value;
  }
}

class HaTextfield extends HTMLElement {
  private _label = "";
  private _value = "";
  private _type = "text";
  private _placeholder = "";
  private _disabled = false;
  private _min = "";
  private _max = "";
  private _step = "";
  private _input?: HTMLInputElement;

  get label(): string {
    return this._label;
  }

  set label(v: string) {
    this._label = String(v ?? "");
    this.sync();
  }

  get value(): string {
    return this._value;
  }

  set value(v: string) {
    this._value = String(v ?? "");
    this.sync();
  }

  get type(): string {
    return this._type;
  }

  set type(v: string) {
    this._type = String(v || "text");
    this.sync();
  }

  get placeholder(): string {
    return this._placeholder;
  }

  set placeholder(v: string) {
    this._placeholder = String(v ?? "");
    this.sync();
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(v: boolean) {
    this._disabled = !!v;
    this.sync();
  }

  get min(): string {
    return this._min;
  }

  set min(v: string) {
    this._min = String(v ?? "");
    this.sync();
  }

  get max(): string {
    return this._max;
  }

  set max(v: string) {
    this._max = String(v ?? "");
    this.sync();
  }

  get step(): string {
    return this._step;
  }

  set step(v: string) {
    this._step = String(v ?? "");
    this.sync();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host { display:block; }
          label {
            display:flex;
            flex-direction:column;
            gap:6px;
            font-size:12px;
            color: var(--secondary-text-color, #a8afb8);
          }
          input {
            height:40px;
            border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.16));
            border-radius: 6px;
            background: var(--ha-card-background, #1b1f24);
            color: var(--primary-text-color, #e6e6e6);
            padding: 0 10px;
            font: inherit;
            box-sizing: border-box;
          }
        </style>
        <label>
          <span id="lbl"></span>
          <input id="input" />
        </label>
      `;
      this._input = root.querySelector("#input") as HTMLInputElement;
      this._input.addEventListener("input", () => {
        this._value = this._input?.value ?? "";
        this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      });
      this._input.addEventListener("change", () => {
        this._value = this._input?.value ?? "";
        this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      });
    }
    this.sync();
  }

  private sync() {
    if (!this.shadowRoot || !this._input) return;
    const labelEl = this.shadowRoot.querySelector("#lbl") as HTMLElement;
    labelEl.textContent = this._label;
    this._input.type = this._type;
    this._input.value = this._value;
    this._input.placeholder = this._placeholder;
    this._input.disabled = this._disabled;
    this._input.min = this._min;
    this._input.max = this._max;
    this._input.step = this._step;
  }
}

class HaSwitch extends HTMLElement {
  private _checked = false;
  private _disabled = false;
  private _input?: HTMLInputElement;

  get checked(): boolean {
    return this._checked;
  }

  set checked(v: boolean) {
    this._checked = !!v;
    this.sync();
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(v: boolean) {
    this._disabled = !!v;
    this.sync();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host { display:inline-block; }
          input { width: 18px; height: 18px; }
        </style>
        <input id="chk" type="checkbox" />
      `;
      this._input = root.querySelector("#chk") as HTMLInputElement;
      this._input.addEventListener("change", () => {
        this._checked = !!this._input?.checked;
        this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      });
    }
    this.sync();
  }

  private sync() {
    if (!this._input) return;
    this._input.checked = this._checked;
    this._input.disabled = this._disabled;
  }
}

class HaFormfield extends HTMLElement {
  private _label = "";

  get label(): string {
    return this._label;
  }

  set label(v: string) {
    this._label = String(v ?? "");
    this.render();
  }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.render();
  }

  private render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        label {
          display:flex;
          align-items:center;
          gap:8px;
          color: var(--primary-text-color, #e6e6e6);
          font-size: 14px;
        }
      </style>
      <label>
        <slot></slot>
        <span>${this._label}</span>
      </label>
    `;
  }
}

class HaSlider extends HTMLElement {
  private _value = 0;
  private _min = 0;
  private _max = 100;
  private _step = 1;
  private _disabled = false;
  private _input?: HTMLInputElement;

  get value(): number {
    return this._value;
  }

  set value(v: number) {
    this._value = Number(v ?? 0);
    this.sync();
  }

  get min(): number {
    return this._min;
  }

  set min(v: number) {
    this._min = Number(v ?? 0);
    this.sync();
  }

  get max(): number {
    return this._max;
  }

  set max(v: number) {
    this._max = Number(v ?? 100);
    this.sync();
  }

  get step(): number {
    return this._step;
  }

  set step(v: number) {
    this._step = Number(v ?? 1);
    this.sync();
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(v: boolean) {
    this._disabled = !!v;
    this.sync();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host { display:block; }
          input { width: 100%; }
        </style>
        <input id="slider" type="range" />
      `;
      this._input = root.querySelector("#slider") as HTMLInputElement;
      this._input.addEventListener("input", () => {
        this._value = Number(this._input?.value ?? 0);
        this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      });
      this._input.addEventListener("change", () => {
        this._value = Number(this._input?.value ?? 0);
        this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      });
    }
    this.sync();
  }

  private sync() {
    if (!this._input) return;
    this._input.min = String(this._min);
    this._input.max = String(this._max);
    this._input.step = String(this._step);
    this._input.value = String(this._value);
    this._input.disabled = this._disabled;
  }
}

class HaEntityPicker extends HTMLElement {
  hass: AnyObj | undefined;
  entityFilter: ((entity: AnyObj) => boolean) | undefined;

  private _value = "";
  private _label = "Entity";
  private _select?: HTMLSelectElement;

  get value(): string {
    return this._value;
  }

  set value(v: string) {
    this._value = String(v ?? "");
    this.sync();
  }

  get label(): string {
    return this._label;
  }

  set label(v: string) {
    this._label = String(v ?? "Entity");
    this.sync();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host { display:block; }
          label {
            display:flex;
            flex-direction:column;
            gap:6px;
            font-size:12px;
            color: var(--secondary-text-color, #a8afb8);
          }
          select {
            height:40px;
            border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.16));
            border-radius: 6px;
            background: var(--ha-card-background, #1b1f24);
            color: var(--primary-text-color, #e6e6e6);
            padding: 0 10px;
            font: inherit;
          }
        </style>
        <label>
          <span id="lbl"></span>
          <select id="sel"></select>
        </label>
      `;
      this._select = root.querySelector("#sel") as HTMLSelectElement;
      this._select.addEventListener("change", () => {
        this._value = this._select?.value ?? "";
        this.dispatchEvent(
          new CustomEvent("value-changed", {
            detail: { value: this._value },
            bubbles: true,
            composed: true,
          })
        );
      });
    }
    this.sync();
  }

  private sync() {
    if (!this.shadowRoot || !this._select) return;
    const labelEl = this.shadowRoot.querySelector("#lbl") as HTMLElement;
    labelEl.textContent = this._label;

    const entities = Object.values(this.hass?.states ?? {}) as AnyObj[];
    const filtered = this.entityFilter
      ? entities.filter((entity) => {
          try {
            return !!this.entityFilter?.(entity);
          } catch {
            return true;
          }
        })
      : entities;
    filtered.sort((a, b) => String(a.entity_id).localeCompare(String(b.entity_id)));

    this._select.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "";
    this._select.appendChild(empty);

    for (const entity of filtered) {
      const option = document.createElement("option");
      option.value = String(entity.entity_id ?? "");
      option.textContent = String(entity.entity_id ?? "");
      this._select.appendChild(option);
    }

    const hasValue = Array.from(this._select.options).some((o) => o.value === this._value);
    this._select.value = hasValue ? this._value : "";
  }
}

class HaIconPicker extends HTMLElement {
  private _value = "";
  private _label = "Icon";
  private _input?: HTMLInputElement;

  get value(): string {
    return this._value;
  }

  set value(v: string) {
    this._value = String(v ?? "");
    this.sync();
  }

  get label(): string {
    return this._label;
  }

  set label(v: string) {
    this._label = String(v ?? "Icon");
    this.sync();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host { display:block; }
          label {
            display:flex;
            flex-direction:column;
            gap:6px;
            font-size:12px;
            color: var(--secondary-text-color, #a8afb8);
          }
          input {
            height:40px;
            border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.16));
            border-radius: 6px;
            background: var(--ha-card-background, #1b1f24);
            color: var(--primary-text-color, #e6e6e6);
            padding: 0 10px;
            font: inherit;
          }
        </style>
        <label>
          <span id="lbl"></span>
          <input id="input" type="text" />
        </label>
      `;
      this._input = root.querySelector("#input") as HTMLInputElement;
      this._input.addEventListener("change", () => {
        this._value = this._input?.value ?? "";
        this.dispatchEvent(
          new CustomEvent("value-changed", {
            detail: { value: this._value },
            bubbles: true,
            composed: true,
          })
        );
      });
    }
    this.sync();
  }

  private sync() {
    if (!this.shadowRoot || !this._input) return;
    const labelEl = this.shadowRoot.querySelector("#lbl") as HTMLElement;
    labelEl.textContent = this._label;
    this._input.value = this._value;
  }
}

class HaExpansionPanel extends HTMLElement {
  private _expanded = false;
  private _details?: HTMLDetailsElement;

  get expanded(): boolean {
    return this._expanded;
  }

  set expanded(v: boolean) {
    this._expanded = !!v;
    this.sync();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host { display:block; margin-bottom: 8px; }
          details {
            border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.16));
            border-radius: 8px;
            overflow: hidden;
            background: var(--ha-card-background, #1b1f24);
          }
          summary {
            list-style: none;
            cursor: pointer;
            padding: 10px 12px;
            color: var(--primary-text-color, #e6e6e6);
            border-bottom: 1px solid transparent;
            font-weight: 600;
          }
          details[open] summary {
            border-bottom-color: var(--divider-color, rgba(255, 255, 255, 0.16));
          }
          .content {
            padding: 12px;
          }
          summary::-webkit-details-marker { display: none; }
        </style>
        <details>
          <summary><slot name="header"></slot></summary>
          <div class="content"><slot></slot></div>
        </details>
      `;
      this._details = root.querySelector("details") as HTMLDetailsElement;
      this._details.addEventListener("toggle", () => {
        this._expanded = this._details?.open ?? false;
        this.dispatchEvent(
          new CustomEvent("expanded-changed", {
            detail: { value: this._expanded, expanded: this._expanded },
            bubbles: true,
            composed: true,
          })
        );
      });
    }
    this.sync();
  }

  private sync() {
    if (!this._details) return;
    this._details.open = this._expanded;
  }
}

export function registerHaStubs() {
  defineOnce("ha-card", HaCard);
  defineOnce("ha-icon", HaIcon);
  defineOnce("ha-state-icon", HaStateIcon);
  defineOnce("ha-list-item", HaListItem);
  defineOnce("ha-select", HaSelect);
  defineOnce("ha-textfield", HaTextfield);
  defineOnce("ha-switch", HaSwitch);
  defineOnce("ha-formfield", HaFormfield);
  defineOnce("ha-slider", HaSlider);
  defineOnce("ha-entity-picker", HaEntityPicker);
  defineOnce("ha-icon-picker", HaIconPicker);
  defineOnce("ha-expansion-panel", HaExpansionPanel);
}
