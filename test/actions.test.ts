import { describe, it, expect, vi } from "vitest";
import { ActionController, type ActionEnvironment } from "../src/actions";

function pointerLike(type: string): Event {
  const PointerEv: any = (globalThis as any).PointerEvent;
  if (PointerEv) {
    return new PointerEv(type, { bubbles: true, button: 0 });
  }
  const ev = new Event(type, { bubbles: true });
  Object.defineProperty(ev, "button", { value: 0, configurable: true });
  return ev;
}

describe("action environment adapter", () => {
  function makeController(action: any, env: Partial<ActionEnvironment> = {}) {
    const host = document.createElement("div");
    const callService = vi.fn();

    new ActionController(host, {
      getConfig: () => ({
        type: "custom:segment-gauge",
        entity: "sensor.demo",
        actions: {
          tap_action: action,
        },
      } as any),
      getHass: () => ({ states: {}, callService } as any),
      getEntityId: () => "sensor.demo",
      env,
    });

    return { host, callService };
  }

  it("uses injected fireEvent for more-info", () => {
    const fireEvent = vi.fn();
    const { host } = makeController({ action: "more-info" }, { fireEvent });

    host.dispatchEvent(pointerLike("pointerdown"));
    host.dispatchEvent(pointerLike("pointerup"));

    expect(fireEvent).toHaveBeenCalledWith(host, "hass-more-info", { entityId: "sensor.demo" });
  });

  it("uses injected navigate for navigate action", () => {
    const navigate = vi.fn();
    const { host } = makeController({ action: "navigate", navigation_path: "/lovelace/test" }, { navigate });

    host.dispatchEvent(pointerLike("pointerdown"));
    host.dispatchEvent(pointerLike("pointerup"));

    expect(navigate).toHaveBeenCalledWith("/lovelace/test");
  });

  it("uses injected openUrl for url action", () => {
    const openUrl = vi.fn();
    const { host } = makeController({ action: "url", url_path: "https://example.com" }, { openUrl });

    host.dispatchEvent(pointerLike("pointerdown"));
    host.dispatchEvent(pointerLike("pointerup"));

    expect(openUrl).toHaveBeenCalledWith("https://example.com");
  });

  it("keeps call-service behavior unchanged", () => {
    const { host, callService } = makeController({ action: "call-service", service: "light.turn_on", service_data: { k: 1 } });

    host.dispatchEvent(pointerLike("pointerdown"));
    host.dispatchEvent(pointerLike("pointerup"));

    expect(callService).toHaveBeenCalledWith("light", "turn_on", { k: 1 });
  });
});
