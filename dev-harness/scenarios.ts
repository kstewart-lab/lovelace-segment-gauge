import type { SegmentGaugeConfig } from "../src/ha-types";

export type HarnessScenario = {
  id: string;
  title: string;
  entity: string;
  state: string;
  attributes?: Record<string, unknown>;
  config: SegmentGaugeConfig;
};

export const DEFAULT_HARNESS_CONFIG: SegmentGaugeConfig = {
  type: "custom:segment-gauge",
  entity: "sensor.speedtest_download",
  content: {
    show_icon: true,
    show_name: true,
    show_state: true,
    icon_color: { mode: "theme" },
  },
  data: {
    min: 0,
    max: 1000,
    precision: 2,
  },
  layout: {
    mode: "vertical",
    gauge_alignment: "center_labels",
  },
  levels: [
    { value: 0, color: "#f70000" },
    { value: 700, color: "#f9ff00" },
    { value: 1000, color: "#00ff13" },
  ],
  bar: {
    height: 18,
    edge: "rounded",
    color_mode: "gradient",
    track: { background: "#1f1f1f", intensity: 0 },
    segments: { mode: "off" },
  },
  pointer: {
    show: false,
    color_mode: "custom",
    color: "#ffffff",
  },
  scale: {
    show: true,
    placement: "center",
    spacing: "even",
    ticks: {
      color_mode: "custom",
      color: "#1f1f1f",
      major_count: 11,
      minor_per_major: 4,
      height_major: 29,
      height_minor: 15,
    },
    labels: {
      precision: 0,
      size: 12,
      y_offset: -1,
      color_mode: "theme",
      color: "white",
    },
  },
  actions: {
    tap_action: { action: "none" },
    hold_action: { action: "none" },
    double_tap_action: { action: "none" },
  },
};

export const HARNESS_RENDER_SCENARIOS: HarnessScenario[] = [
  {
    id: "default",
    title: "Default vertical gauge",
    entity: "sensor.speedtest_download",
    state: "897.63",
    attributes: {
      friendly_name: "SpeedTest Download",
      unit_of_measurement: "Mbit/s",
      icon: "mdi:speedometer",
    },
    config: DEFAULT_HARNESS_CONFIG,
  },
  {
    id: "long-label-narrow",
    title: "Long label and narrow-width layout",
    entity: "sensor.long_label_metric",
    state: "40",
    attributes: {
      friendly_name: "Ensuite humidity OFF threshold with an extra long title",
      unit_of_measurement: "%",
      icon: "mdi:water-percent",
    },
    config: {
      type: "custom:segment-gauge",
      entity: "sensor.long_label_metric",
      layout: { mode: "vertical", gauge_alignment: "center_labels" },
      content: { show_icon: true, show_name: true, show_state: true, icon_color: { mode: "theme" } },
      data: { min: 0, max: 100, precision: 0 },
      levels: [
        { value: 0, color: "#03a9f4" },
        { value: 40, color: "#66bb6a" },
        { value: 80, color: "#ef5350" },
      ],
      bar: { height: 8, edge: "rounded", color_mode: "stepped", segments: { mode: "off" } },
      pointer: { show: true, size: 12, angle: 50, color_mode: "custom", color: "#ffffff" },
      scale: {
        show: true,
        placement: "below",
        spacing: "even",
        ticks: { major_count: 6, minor_per_major: 2, color_mode: "theme", height_major: 10, height_minor: 6 },
        labels: { show: true, precision: 0, color_mode: "theme", size: 12, y_offset: 0 },
      },
    },
  },
  {
    id: "contrast-sensitive",
    title: "Contrast-sensitive ticks against bright track",
    entity: "sensor.contrast_metric",
    state: "10",
    attributes: {
      friendly_name: "Contrast Metric",
      unit_of_measurement: "%",
      icon: "mdi:theme-light-dark",
    },
    config: {
      type: "custom:segment-gauge",
      entity: "sensor.contrast_metric",
      content: { show_icon: true, show_name: true, show_state: true, icon_color: { mode: "theme" } },
      data: { min: 0, max: 100, precision: 0 },
      levels: [
        { value: 0, color: "#ff0000" },
        { value: 100, color: "#00ff00" },
      ],
      bar: {
        show: true,
        height: 12,
        edge: "rounded",
        color_mode: "gradient",
        track: { background: "var(--primary-color)", intensity: 0 },
        segments: { mode: "off" },
      },
      pointer: { show: false },
      scale: {
        show: true,
        placement: "top",
        y_offset: -20,
        spacing: "even",
        labels: { show: false },
        ticks: { major_count: 5, minor_per_major: 0, color_mode: "contrast", height_major: 8, height_minor: 6 },
      },
    },
  },
];
