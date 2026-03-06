/**
 * Responsibility: Define runtime measurement adapter contracts and DOM-backed implementation.
 * Allowed dependencies: browser measurement APIs and local measurement helpers.
 * Forbidden concerns: normalization/derivation policy, Lit templates, HA business logic.
 */
export type SegmentGaugeMeasureAdapter = {
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
  queryTrack: (root: ParentNode | null | undefined) => HTMLElement | null;
  readTrackWidth: (track: HTMLElement) => number;
  queryLabelMeasureNodes: (
    root: ParentNode | null | undefined
  ) => { minEl: HTMLElement; maxEl: HTMLElement } | null;
  readElementWidth: (element: HTMLElement) => number;
  createResizeObserver: (callback: ResizeObserverCallback) => ResizeObserver;
};

export function computeLabelInsets(minWidth: number, maxWidth: number, safetyPx: number): { left: number; right: number } {
  return {
    left: Math.ceil(minWidth / 2 + safetyPx),
    right: Math.ceil(maxWidth / 2 + safetyPx),
  };
}

export const domMeasureAdapter: SegmentGaugeMeasureAdapter = {
  requestFrame(callback) {
    return window.requestAnimationFrame(callback);
  },
  cancelFrame(id) {
    window.cancelAnimationFrame(id);
  },
  queryTrack(root) {
    return (root?.querySelector?.(".track") as HTMLElement | null) ?? null;
  },
  readTrackWidth(track) {
    const rect = track.getBoundingClientRect();
    return Math.round(rect.width || track.clientWidth || 0);
  },
  queryLabelMeasureNodes(root) {
    const minEl = (root?.querySelector?.(".measure.min") as HTMLElement | null) ?? null;
    const maxEl = (root?.querySelector?.(".measure.max") as HTMLElement | null) ?? null;
    if (!minEl || !maxEl) return null;
    return { minEl, maxEl };
  },
  readElementWidth(element) {
    return element.getBoundingClientRect().width;
  },
  createResizeObserver(callback) {
    return new ResizeObserver(callback);
  },
};
