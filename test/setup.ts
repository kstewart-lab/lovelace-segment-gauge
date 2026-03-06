import { expect } from "@open-wc/testing";
import { registerSegmentGaugeElements } from "../src/register";

// Minimal stubs for HA components used in tests
const ensure = (tag: string, ctor: CustomElementConstructor) => {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
};

class StubSelect extends HTMLElement {
  private _value = "";
  label = "";
  get value() {
    return this._value;
  }
  set value(v: string) {
    this._value = v;
  }
}

class StubListItem extends HTMLElement {
  value = "";
}

// Other HA controls can remain unknown elements; we only need select/list items for event wiring.
ensure("ha-select", StubSelect);
ensure("ha-list-item", StubListItem);

// Make expect available globally for Vitest + open-wc assertions
// (vitest has expect, but open-wc extends matchers)
globalThis.expect = expect;

// Register custom elements once for tests. Disable card registry side effects.
registerSegmentGaugeElements({ registerCustomCardEntry: false });

// Minimal ResizeObserver stub for jsdom-based tests
if (!("ResizeObserver" in globalThis)) {
  class ResizeObserver {
    private _cb: ResizeObserverCallback;
    constructor(cb: ResizeObserverCallback) {
      this._cb = cb;
    }
    observe() {
      this._cb([{ contentRect: { width: 0, height: 0 } } as ResizeObserverEntry], this as any);
    }
    unobserve() {}
    disconnect() {}
  }
  (globalThis as any).ResizeObserver = ResizeObserver;
}
