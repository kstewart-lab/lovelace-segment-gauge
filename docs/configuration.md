# Segment Gauge YAML Reference

This document describes the YAML model for `custom:segment-gauge`.

Note: YAML snippets in this document are examples of shape and options, not a full default dump.

## Shape

```yaml
type: custom:segment-gauge
entity: sensor.example
content: {}
style: {}
layout: {}
data: {}
levels: []
bar: {}
pointer: {}
scale: {}
actions: {}
```

## Top-Level Keys

Only `type` and `entity` are required at the top level. All other top-level keys are optional and use defaults described in the respective sections documented below.

<!-- AUTOGEN:TOP_LEVEL_KEYS:START -->
| Key | Type | Purpose |
|---|---|---|
| `type` | string | Must be `custom:segment-gauge` |
| `entity` | string | Entity id (must have numerical state) |
| [`content`](#content) | object | Name, state, icon display |
| [`style`](#style) | object | Card wrapper style |
| [`layout`](#layout) | object | Card layout and alignment |
| [`data`](#data) | object |  Numeric range and formatting |
| [`levels`](#levels) | list |  Value range to color / icon mappings |
| [`bar`](#bar) | object | Bar, segments, snapping, track |
| [`pointer`](#pointer) | object | Pointer options |
| [`scale`](#scale) | object | Tick and label scale |
| [`actions`](#actions) | object | Tap, hold, double tap actions |
<!-- AUTOGEN:TOP_LEVEL_KEYS:END -->

---

## `content`

```yaml
content:
  name: Humidity
  show_icon: true
  show_name: true
  show_state: true
  icon: mdi:water-percent
  icon_color:
    mode: theme
    value: "#03a9f4"
```

<!-- AUTOGEN:CONTENT_FIELDS:START -->
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `content.name` | string | No | `""` | Friendly name override |
| `content.show_icon` | boolean | No | `true` | Show icon |
| `content.show_name` | boolean | No | `true` | Show name |
| `content.show_state` | boolean | No | `true` | Show state |
| `content.icon` | string | No | entity's icon | Fixed icon override |
| `content.icon_color.mode` | `IconColorMode` | No | `theme` |  |
| `content.icon_color.value` | string | No | unset | Used when `icon_color.mode` is `custom` |
<!-- AUTOGEN:CONTENT_FIELDS:END -->

<!-- AUTOGEN:ENUM_ICON_COLOR_MODE:START -->
Enum values for `IconColorMode`:
- `theme`: use theme primary color
- `state`: use Home Assistant state-based color for entity icons (`ha-state-icon`)
- `level`: use active level color
- `custom`: use `content.icon_color.value`
<!-- AUTOGEN:ENUM_ICON_COLOR_MODE:END -->

---

## `style`

```yaml
style:
  card: default
  debug_layout: false
```

<!-- AUTOGEN:STYLE_FIELDS:START -->
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `style.card` | `CardStyle` | No | `default` | Wrapper style |
| `style.debug_layout` | boolean | No | `false` | Draw debug overlays |
<!-- AUTOGEN:STYLE_FIELDS:END -->

<!-- AUTOGEN:ENUM_CARD_STYLE:START -->
Enum values for `CardStyle`:
- `default`: normal `ha-card` background, border, shadow
- `plain`: no card background, border, or shadow
<!-- AUTOGEN:ENUM_CARD_STYLE:END -->

---

## `layout`

```yaml
layout:
  mode: horizontal
  split_pct: 20
  gauge_alignment: center_bar
  content_spacing: 0
```

<!-- AUTOGEN:LAYOUT_FIELDS:START -->
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `layout.mode` | `LayoutMode` | No | `horizontal` |  Layout of gauge, text, and icon |
| `layout.split_pct` | number | No | `50` | Width percent for icon and text area. Only when `layout.mode` is `horizontal` |
| `layout.gauge_alignment` | `GaugeAlignment` | No | `center_bar` |  |
| `layout.content_spacing` | number | No | `0` | Horizontal offset between icon and text |
<!-- AUTOGEN:LAYOUT_FIELDS:END -->

<!-- AUTOGEN:ENUM_LAYOUT_MODE:START -->
Enum values for `LayoutMode`:
- `horizontal`: icon and text on the left, gauge on the right
- `vertical`: icon and text above left, gauge below
- `stacked`: icon and text stacked and centered, gauge below
<!-- AUTOGEN:ENUM_LAYOUT_MODE:END -->

<!-- AUTOGEN:ENUM_GAUGE_ALIGNMENT:START -->
Enum values for `GaugeAlignment`:
- `center_bar`: ensure center of bar is at center of card
- `center_labels`: ensure label line is centered
<!-- AUTOGEN:ENUM_GAUGE_ALIGNMENT:END -->

---

## `data`

```yaml
data:
  min: 0
  max: 100
  precision: 0
  unit: "%"
```

<!-- AUTOGEN:DATA_FIELDS:START -->
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `data.min` | number | No | `0` | Lower bound |
| `data.max` | number | No | `100` | Upper bound |
| `data.precision` | number or null | No | `null` | Entity state precision (decimal places) |
| `data.unit` | string | No | `""` | Unit override. If empty, entity `unit_of_measurement` is used. |
<!-- AUTOGEN:DATA_FIELDS:END -->

---

## `levels`

```yaml
levels:
  - value: 0
    color: "#03a9f4"
    icon: mdi:water-percent
  - value: 50
    color: "#a4ff3e"
```

`levels` is optional. If provided, each item has:

<!-- AUTOGEN:LEVELS_FIELDS:START -->
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `levels[].value` | number | Yes | n/a | Threshold boundary |
| `levels[].color` | string | Yes | n/a | Color for the threshold |
| `levels[].icon` | string | No | `null` | Optional dynamic icon override. |
<!-- AUTOGEN:LEVELS_FIELDS:END -->

Notes:
- Levels are sorted ascending at runtime.
- The last level applies to all higher values.

---

## `bar`

```yaml
# Example: bar with fixed-width segments
bar:
  show: true
  height: 10
  edge: rounded
  color_mode: stepped
  fill_mode: cumulative
  track:
    background: "#1f1f1f"
    intensity: 20
  segments:
    mode: fixed
    width: 12
    gap: 2
  snapping:
    fill: off
    color: off
```

<!-- AUTOGEN:BAR_FIELDS:START -->
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `bar.show` | boolean | No | `true` | Show bar |
| `bar.height` | number | No | `8` | Bar height in px |
| `bar.edge` | `BarEdge` | No | `rounded` | End shape |
| `bar.radius` | number or null | No | `null` | Explicit radius override. If unset, radius derives from `bar.edge` (`rounded` -> `round(bar.height / 2)`, `square` -> `0`) |
| `bar.color_mode` | `BarColorMode` | No | `stepped` | Filled color |
| `bar.fill_mode` | `BarFillMode` | No | `cumulative` | Fill extent |
| `bar.track.background` | string | No | card background | Defaults to `var(--ha-card-background, var(--card-background-color, #000))` |
| `bar.track.intensity` | number | No | `50` | `0..100` opacity of unfilled bar portion |
| `bar.segments.mode` | `SegmentMode` | No | `off` | Segment mode |
| `bar.segments.width` | number | No | `0` | Used in `fixed` segment mode |
| `bar.segments.gap` | number | No | `0` | Thickness (in px) of gaps between segments |
| `bar.segments.segments_per_level` | number | No | `1` | Number of segments per level |
| `bar.snapping.fill` | `FillSnapping` | No | `off` | Fill snapping policy |
| `bar.snapping.color` | `ColorSnapping` | No | `off` | Color snapping policy |
<!-- AUTOGEN:BAR_FIELDS:END -->

Note:
- Snapping is meaningful only when segments are enabled.

<!-- AUTOGEN:ENUM_BAR_EDGE:START -->
Enum values for `BarEdge`:
- `rounded`: rounded bar ends
- `square`: square bar ends
<!-- AUTOGEN:ENUM_BAR_EDGE:END -->

<!-- AUTOGEN:ENUM_BAR_COLOR_MODE:START -->
Enum values for `BarColorMode`:
- `stepped`: hard color jumps at levels
- `gradient`: smooth gradient between level colors
- `current_level`: filled region uses current level color only
<!-- AUTOGEN:ENUM_BAR_COLOR_MODE:END -->

<!-- AUTOGEN:ENUM_BAR_FILL_MODE:START -->
Enum values for `BarFillMode`:
- `cumulative`: fill from bar start to current value
- `current_segment`: fill only the segment containing the current value
<!-- AUTOGEN:ENUM_BAR_FILL_MODE:END -->

<!-- AUTOGEN:ENUM_SEGMENT_MODE:START -->
Enum values for `SegmentMode`:
- `off`: no segments
- `level`: segment boundaries align to levels
- `fixed`: repeated fixed-width segments
<!-- AUTOGEN:ENUM_SEGMENT_MODE:END -->

<!-- AUTOGEN:ENUM_FILL_SNAPPING:START -->
Enum values for `FillSnapping`:
- `off`: no snapping
- `down`: snap fill to the previous whole segment
- `nearest`: snap fill to the nearest whole segment
- `up`: snap fill to the next whole segment
<!-- AUTOGEN:ENUM_FILL_SNAPPING:END -->

<!-- AUTOGEN:ENUM_COLOR_SNAPPING:START -->
Enum values for `ColorSnapping`:
- `off`: no color snapping
- `level`: each segment uses the color of the level with the largest overlap
- `midpoint`: each segment uses the color sampled at its midpoint
- `high`: each segment uses the color at its end (higher value side)
- `low`: each segment uses the color at its start (lower value side)
<!-- AUTOGEN:ENUM_COLOR_SNAPPING:END -->

---

## `pointer`

```yaml
# Example: visible custom-colored pointer
pointer:
  show: true
  size: 12
  angle: 90
  y_offset: 0
  color_mode: custom
  color: "#ffffff"
```

<!-- AUTOGEN:POINTER_FIELDS:START -->
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `pointer.show` | boolean | No | `true` | Show pointer |
| `pointer.size` | number | No | `8` | Size in px |
| `pointer.angle` | number | No | `90` | Lower triangle angle in degrees |
| `pointer.y_offset` | number | No | `0` | Vertical offset. positive is down |
| `pointer.color_mode` | `PointerColorMode` | No | `custom` | Pointer color mode |
| `pointer.color` | string | No | `#ffffff` | Color if mode is `custom` |
<!-- AUTOGEN:POINTER_FIELDS:END -->

<!-- AUTOGEN:ENUM_POINTER_COLOR_MODE:START -->
Enum values for `PointerColorMode`:
- `gradient`: pointer color from gradient at current value
- `level`: pointer color from current level
- `custom`: use `pointer.color`
<!-- AUTOGEN:ENUM_POINTER_COLOR_MODE:END -->

---

## `scale`

```yaml
# Example: scale with ticks and labels
scale:
  show: true
  placement: below
  spacing: even
  y_offset: 0
  ticks:
    major_count: 6
    minor_per_major: 3
    height_minor: 8
    height_major: 12
    color_mode: contrast
    color: "#ffffff"
  labels:
    show: true
    precision: 0
    size: 12
    y_offset: 0
    color_mode: theme
    color: "#ffffff"
```

<!-- AUTOGEN:SCALE_CORE_FIELDS:START -->
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `scale.show` | boolean | No | `false` | Show scale |
| `scale.placement` | `ScalePlacement` | No | `below` | Tick placement |
| `scale.spacing` | `ScaleSpacing` | No | `even` | Tick spacing mode |
| `scale.y_offset` | number | No | `0` | Vertical offset. Positive is down |
<!-- AUTOGEN:SCALE_CORE_FIELDS:END -->

<!-- AUTOGEN:SCALE_TICKS_FIELDS:START -->
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `scale.ticks.major_count` | number | No | `5` | Major tick count |
| `scale.ticks.minor_per_major` | number | No | `0` | Minor ticks between majors |
| `scale.ticks.height_major` | number | No | `12` | Major tick height in px |
| `scale.ticks.height_minor` | number | No | `8` | Minor tick height in px |
| `scale.ticks.color_mode` | `TickColorMode` | No | `theme` | Tick color mode |
| `scale.ticks.color` | string | No | n/a | Used when mode is `custom` |
<!-- AUTOGEN:SCALE_TICKS_FIELDS:END -->

<!-- AUTOGEN:SCALE_LABELS_FIELDS:START -->
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `scale.labels.show` | boolean | No | `true` | Show labels |
| `scale.labels.precision` | number or null | No | `null` | Label precision override |
| `scale.labels.size` | number | No | `12` | Label text size in px |
| `scale.labels.y_offset` | number | No | `0` | Vertical offset. Positive is down |
| `scale.labels.color_mode` | `LabelColorMode` | No | `theme` | Label color mode |
| `scale.labels.color` | string | No | n/a | Used when mode is `custom` |
<!-- AUTOGEN:SCALE_LABELS_FIELDS:END -->

<!-- AUTOGEN:ENUM_SCALE_PLACEMENT:START -->
Enum values for `ScalePlacement`:
- `below`: scale below the bar
- `bottom`: tick bottoms align to bar bottom
- `center`: ticks centered on bar center line
- `top`: tick tops align to bar top
<!-- AUTOGEN:ENUM_SCALE_PLACEMENT:END -->

<!-- AUTOGEN:ENUM_SCALE_SPACING:START -->
Enum values for `ScaleSpacing`:
- `even`: major ticks evenly distributed over numeric range
- `levels`: major ticks at level boundaries
<!-- AUTOGEN:ENUM_SCALE_SPACING:END -->

<!-- AUTOGEN:ENUM_TICK_COLOR_MODE:START -->
Enum values for `TickColorMode`:
- `theme`: theme text color
- `gradient`: gradient level color
- `stepped`: discrete level color
- `level`: current level color
- `custom`: use `scale.ticks.color`
- `contrast`: auto contrast against the surface where each tick is drawn
<!-- AUTOGEN:ENUM_TICK_COLOR_MODE:END -->

<!-- AUTOGEN:ENUM_LABEL_COLOR_MODE:START -->
Enum values for `LabelColorMode`:
- `theme`: HA theme text color
- `gradient`: gradient color
- `stepped`: discrete level color
- `level`: current level color
- `custom`: use `scale.labels.color`
<!-- AUTOGEN:ENUM_LABEL_COLOR_MODE:END -->

---

## `actions`

Home Assistant action config wrappers:

```yaml
actions:
  tap_action:
    action: more-info
  hold_action:
    action: none
  double_tap_action:
    action: none
```

<!-- AUTOGEN:ACTIONS_FIELDS:START -->
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `actions.tap_action` | object | No | `{ action: more-info }` | Standard HA action object |
| `actions.hold_action` | object | No | `{ action: none }` | Standard HA action object |
| `actions.double_tap_action` | object | No | `{ action: none }` | Standard HA action object |
<!-- AUTOGEN:ACTIONS_FIELDS:END -->

Action `action` values supported by Home Assistant include:
- `none`
- `more-info`
- `toggle`
- `navigate`
- `url`
- `call-service`

---
