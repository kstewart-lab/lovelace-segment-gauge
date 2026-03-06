export type HassEntity = {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
};

export type HomeAssistant = {
  states: Record<string, HassEntity>;
  callService: (domain: string, service: string, data: Record<string, unknown>) => void;
};

export type LovelaceCardConfig = {
  type: string;
  [key: string]: unknown;
};

export type ActionConfig =
  | { action: "none" }
  | { action: "more-info" }
  | { action: "toggle" }
  | { action: "navigate"; navigation_path: string }
  | { action: "url"; url_path: string }
  | { action: "call-service"; service: string; service_data?: Record<string, unknown> };

export type Level = { value: number; color: string; icon?: string };

export type ColorSource = "theme" | "state" | "level" | "custom";
export type ColorMode = "gradient" | "stepped" | "current_level";
export type BarFillMode = "cumulative" | "current_segment";
export type SegmentMode = "off" | "level" | "fixed";
export type FillQuantization = "off" | "down" | "nearest" | "up";
export type ColorQuantization = "off" | "level" | "midpoint" | "high" | "low";
export type PointerColorMode = "gradient" | "level" | "custom";
export type ScaleColorMode = "theme" | "gradient" | "stepped" | "level" | "custom";
export type TickColorMode = ScaleColorMode | "contrast";

export type SegmentGaugeContentConfig = {
  name?: string;
  show_name?: boolean;
  show_state?: boolean;
  show_icon?: boolean;
  icon?: string;
  icon_color?: {
    mode?: ColorSource;
    value?: string;
  };
};

export type SegmentGaugeDataConfig = {
  min?: number;
  max?: number;
  precision?: number | null;
  unit?: string;
};

export type SegmentGaugeLayoutConfig = {
  mode?: "horizontal" | "vertical" | "stacked";
  split_pct?: number;
  gauge_alignment?: "center_bar" | "center_labels";
  content_spacing?: number;
};

export type SegmentGaugeStyleConfig = {
  card?: "default" | "plain";
  debug_layout?: boolean;
};

export type SegmentGaugeBarConfig = {
  show?: boolean;
  height?: number;
  edge?: "rounded" | "square";
  radius?: number | null;
  color_mode?: ColorMode;
  fill_mode?: BarFillMode;
  track?: {
    background?: string;
    intensity?: number;
  };
  segments?: {
    mode?: SegmentMode;
    width?: number;
    gap?: number;
    segments_per_level?: number;
  };
  snapping?: {
    fill?: FillQuantization;
    color?: ColorQuantization;
  };
};

export type SegmentGaugePointerConfig = {
  show?: boolean;
  size?: number;
  color_mode?: PointerColorMode;
  color?: string;
  angle?: number;
  y_offset?: number;
};

export type SegmentGaugeScaleConfig = {
  show?: boolean;
  placement?: "below" | "bottom" | "center" | "top";
  spacing?: "even" | "levels";
  y_offset?: number;
  ticks?: {
    major_count?: number;
    minor_per_major?: number;
    height_minor?: number;
    height_major?: number;
    color_mode?: TickColorMode;
    color?: string;
  };
  labels?: {
    show?: boolean;
    precision?: number | null;
    size?: number;
    y_offset?: number;
    color_mode?: ScaleColorMode;
    color?: string;
  };
};

export type SegmentGaugeActionsConfig = {
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
};

export type SegmentGaugeConfigCore = {
  type: string;
  entity: string;
  content?: SegmentGaugeContentConfig;
  data?: SegmentGaugeDataConfig;
  layout?: SegmentGaugeLayoutConfig;
  style?: SegmentGaugeStyleConfig;
  levels?: Level[];
  bar?: SegmentGaugeBarConfig;
  pointer?: SegmentGaugePointerConfig;
  scale?: SegmentGaugeScaleConfig;
  actions?: SegmentGaugeActionsConfig;
};

export type SegmentGaugeConfig = LovelaceCardConfig & SegmentGaugeConfigCore;

export type SegmentGaugeResolvedConfig = {
  type: string;
  entity: string;
  content: {
    name: string;
    show_name: boolean;
    show_state: boolean;
    show_icon: boolean;
    icon: string | undefined;
    icon_color: {
      mode: ColorSource;
      value: string | undefined;
    };
  };
  data: {
    min: number;
    max: number;
    precision: number | null;
    unit: string;
  };
  layout: {
    mode: "horizontal" | "vertical" | "stacked";
    split_pct: number;
    gauge_alignment: "center_bar" | "center_labels";
    content_spacing: number;
  };
  style: {
    card: "default" | "plain";
    debug_layout: boolean;
  };
  levels: Level[];
  bar: {
    show: boolean;
    height: number;
    edge: "rounded" | "square";
    radius: number | null;
    color_mode: ColorMode;
    fill_mode: BarFillMode;
    track: {
      background: string | undefined;
      intensity: number;
    };
    segments: {
      mode: SegmentMode;
      width: number;
      gap: number;
      segments_per_level: number;
    };
    snapping: {
      fill: FillQuantization;
      color: ColorQuantization;
    };
  };
  pointer: {
    show: boolean;
    size: number;
    color_mode: PointerColorMode;
    color: string;
    angle: number;
    y_offset: number;
  };
  scale: {
    show: boolean;
    placement: "below" | "bottom" | "center" | "top";
    spacing: "even" | "levels";
    y_offset: number;
    ticks: {
      major_count: number;
      minor_per_major: number;
      height_minor: number;
      height_major: number;
      color_mode: TickColorMode;
      color: string | undefined;
    };
    labels: {
      show: boolean;
      precision: number | null;
      size: number;
      y_offset: number;
      color_mode: ScaleColorMode;
      color: string | undefined;
    };
  };
  actions: {
    tap_action: ActionConfig;
    hold_action: ActionConfig;
    double_tap_action: ActionConfig;
  };
};
