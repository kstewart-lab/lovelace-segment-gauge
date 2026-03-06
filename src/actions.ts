import type { ActionConfig, HomeAssistant, SegmentGaugeConfig } from "./ha-types";

function fireEvent(node: any, type: string, detail: Record<string, unknown>) {
  const ev = new Event(type, { bubbles: true, cancelable: false, composed: true }) as any;
  ev.detail = detail;
  node.dispatchEvent(ev);
}

export type ActionEnvironment = {
  fireEvent: (node: EventTarget, type: string, detail: Record<string, unknown>) => void;
  navigate: (path: string) => void;
  openUrl: (url: string) => void;
};

const defaultActionEnvironment: ActionEnvironment = {
  fireEvent(node, type, detail) {
    fireEvent(node, type, detail);
  },
  navigate(path) {
    window.history.pushState(null, "", path);
    fireEvent(window as any, "location-changed", { replace: false });
  },
  openUrl(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  },
};

type Which = "tap_action" | "hold_action" | "double_tap_action";

export class ActionController {
  private host: HTMLElement;
  private getConfig: () => SegmentGaugeConfig | null;
  private getHass: () => HomeAssistant | null;
  private getEntityId: () => string | null;
  private env: ActionEnvironment;

  private holdMs = 500;
  private held = false;
  private holdTimer: number | null = null;

  constructor(host: HTMLElement, opts: {
    getConfig: () => SegmentGaugeConfig | null;
    getHass: () => HomeAssistant | null;
    getEntityId: () => string | null;
    env?: Partial<ActionEnvironment>;
  }) {
    this.host = host;
    this.getConfig = opts.getConfig;
    this.getHass = opts.getHass;
    this.getEntityId = opts.getEntityId;
    this.env = {
      ...defaultActionEnvironment,
      ...(opts.env ?? {}),
    };

    host.addEventListener("pointerdown", (e) => this.onDown(e as PointerEvent));
    host.addEventListener("pointerup", (e) => this.onUp(e as PointerEvent));
    host.addEventListener("pointercancel", () => this.clearHold());
    host.addEventListener("pointerleave", () => this.clearHold());
    host.addEventListener("contextmenu", (e) => e.preventDefault());
    host.addEventListener("dblclick", () => this.onDblClick());
  }

  private onDown(e: PointerEvent) {
    if ((e as any).button !== 0) return;
    this.held = false;
    this.clearHold();
    this.holdTimer = window.setTimeout(() => {
      this.held = true;
      this.doAction("hold_action");
    }, this.holdMs);
  }

  private onUp(e: PointerEvent) {
    if ((e as any).button !== 0) return;
    const wasHeld = this.held;
    this.clearHold();
    if (!wasHeld) this.doAction("tap_action");
  }

  private onDblClick() {
    this.clearHold();
    this.doAction("double_tap_action");
  }

  private clearHold() {
    if (this.holdTimer) {
      window.clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  private doAction(which: Which) {
    const config = this.getConfig();
    const hass = this.getHass();
    const entityId = this.getEntityId();
    if (!config || !hass || !entityId) return;

    const cfg = (config.actions as any)?.[which] as ActionConfig | undefined;
    const action = cfg?.action ?? "none";
    if (action === "none") return;

    switch (action) {
      case "more-info":
        this.env.fireEvent(this.host, "hass-more-info", { entityId });
        break;

      case "navigate": {
        const path = (cfg as any).navigation_path;
        if (!path) return;
        this.env.navigate(path);
        break;
      }

      case "url": {
        const url = (cfg as any).url_path;
        if (!url) return;
        this.env.openUrl(url);
        break;
      }

      case "toggle":
        hass.callService("homeassistant", "toggle", { entity_id: entityId });
        break;

      case "call-service": {
        const svc = (cfg as any).service;
        if (!svc) return;
        const [domain, service] = String(svc).split(".", 2);
        if (!domain || !service) return;
        hass.callService(domain, service, (cfg as any).service_data ?? {});
        break;
      }

      default:
        break;
    }
  }
}
