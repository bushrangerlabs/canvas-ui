# Canvas UI Widget Reference

Complete guide for creating Canvas UI views with all 28 widget types.

## Canvas UI View Format (For Import)

When creating views to **import into Canvas UI**, use this **exact format**:

```json
{
  "version": "2.0.0",
  "exportedAt": "2026-03-01T12:00:00.000Z",
  "view": {
    "id": "my-view",
    "name": "Dashboard Name",
    "style": {
      "backgroundColor": "#1a1a1a",
      "backgroundImage": "/local/images/bg.jpg",
      "backgroundSize": "cover",
      "backgroundPosition": "center"
    },
    "widgets": [
      {
        "id": "widget_1",
        "type": "button",
        "position": {
          "x": 10,
          "y": 10,
          "width": 200,
          "height": 80,
          "zIndex": 1
        },
        "config": {
          "label": "Button Text",
          "entity_id": "light.bedroom"
        },
        "bindings": {}
      }
    ]
  },
  "metadata": {
    "widgetCount": 1,
    "exportedFrom": "copilot"
  }
}
```

### CRITICAL Format Rules

1. **Top level:** `version`, `exportedAt`, `view` (singular!), `metadata`
2. **view object:** `id`, `name`, `style`, `widgets`
3. **Each widget:**
   - `id` - Unique identifier
   - `type` - Widget type (button, slider, text, etc.)
   - `position` - Object with `x`, `y`, `width`, `height`, `zIndex`
   - `config` - Object with ALL widget properties
   - `bindings` - Empty object `{}`

### Position Object (REQUIRED)

```json
"position": {
  "x": 10,
  "y": 10,
  "width": 200,
  "height": 80,
  "zIndex": 1
}
```

- Use `width` and `height` (NOT `w` and `h`)
- All widget settings go in `config` object, NOT at root level

---

## Universal Widget Properties

These properties work on **ALL** widgets:

### Layout

- `x`, `y` - Position (pixels)
- `w`, `h` - Width, height (pixels)
- `zIndex` - Layering order

### Styling

- `backgroundColor` - Background color (hex or rgba)
- `backgroundImage` - Image URL: `/local/image.jpg`
- `borderStyle` - `solid`, `dashed`, `dotted`, `double`
- `borderWidth` - Border thickness (pixels)
- `borderColor` - Border color (hex)
- `borderRadius` - Corner radius (pixels, 0=sharp)
- `boxShadow` - CSS shadow (e.g., `"0 4px 8px rgba(0,0,0,0.3)"`)
- `opacity` - Transparency (0-1)

> **Binding support:** The string-typed style properties (`backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`) accept live entity binding expressions on **all 28 widgets**. Example: `"backgroundColor": "{input_text.accent_color}"`

### Shadow Presets

- Subtle: `"0 2px 4px rgba(0,0,0,0.2)"`
- Medium: `"0 4px 8px rgba(0,0,0,0.3)"`
- High: `"0 8px 16px rgba(0,0,0,0.4)"`
- Glow: `"0 0 20px rgba(33,150,243,0.6)"`

### Gradient Presets

- Blue-purple: `"linear-gradient(135deg, #667eea 0%, #764ba2 100%)"`
- Sunset: `"linear-gradient(to right, #ff6b6b, #feca57, #48dbfb)"`

---

## Widgets by Category

### Control Widgets

#### 1. button - Interactive Buttons

Toggle switches, service calls, navigation

```json
{
  "id": "btn_1",
  "type": "button",
  "position": {
    "x": 10,
    "y": 10,
    "width": 200,
    "height": 80,
    "zIndex": 1
  },
  "config": {
    "label": "Ceiling Light",
    "entity_id": "light.bedroom",
    "actionType": "toggle",
    "backgroundColor": "#fbbf24",
    "textColor": "#ffffff",
    "icon": "PowerSettingsNew",
    "iconPosition": "left",
    "iconSize": 24,
    "clickFeedback": "scale"
  },
  "bindings": {}
}
```

**Properties:**

- `label` - Button text
- `entity_id` - Entity to control
- `actionType` - `auto`, `toggle`, `turn_on`, `turn_off`, `custom`, `navigation`, `url`
- `targetView` - View ID for navigation
- `url` - URL to open
- `service` - Service call (e.g., `light.toggle`)
- `serviceData` - JSON service data
- `confirmAction` - Show confirmation dialog
- `confirmMessage` - Confirmation text
- `clickFeedback` - `none`, `scale`, `highlight`, `ripple`, `shadow`, `color`
- `icon` - Material UI icon name
- `iconPosition` - `left`, `right`, `top`, `bottom`, `only`
- `iconSize` - Icon size (pixels)
- `iconColor` - Icon color
- `backgroundColor` - Background color
- `textColor` - Text color (use textColor, not color!)
- `fontSize` - Font size
- `borderRadius` - Corner radius

**Bindings:** `label`, `backgroundColor`, `textColor`, `iconColor` accept `{...}` binding expressions. Example: `"label": "{light.bedroom.state;array(Turn On,Turn Off)}"` Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.

#### 2. slider - Value Controls

Brightness, volume, temperature sliders

```json
{
  "id": "slider_1",
  "type": "slider",
  "position": {
    "x": 10,
    "y": 100,
    "width": 300,
    "height": 60,
    "zIndex": 1
  },
  "config": {
    "entity_id": "light.bedroom",
    "label": "Brightness",
    "min": 0,
    "max": 100,
    "step": 1,
    "orientation": "horizontal",
    "trackColor": "#424242",
    "fillColor": "#2196f3",
    "thumbColor": "#2196f3",
    "showValue": true
  },
  "bindings": {}
}
```

**Properties:**

- `label`, `entity_id`, `min`, `max`, `step`, `value`
- `orientation` - `horizontal` or `vertical`
- `showValue` - Display current value
- `trackColor`, `fillColor`, `thumbColor`
- `thumbIcon` - Icon for thumb
- `textColor`, `fontSize`

**Bindings:** `label` and `value` accept `{...}` expressions. Setting `value` to a binding drives the slider display from live state. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.

#### 3. switch - Toggle Switches

```json
{
  "id": "switch_1",
  "type": "switch",
  "position": {
    "x": 10,
    "y": 10,
    "width": 150,
    "height": 60,
    "zIndex": 1
  },
  "config": {
    "entity_id": "switch.fan",
    "label": "Ceiling Fan",
    "labelPosition": "left",
    "onColor": "#4caf50",
    "offColor": "#757575",
    "textColor": "#ffffff",
    "fontSize": 14
  },
  "bindings": {}
}
```

**Properties:**

- `label`, `labelPosition` (`left`, `right`, `top`, `bottom`), `entity_id`

**Bindings:** `entity_id` drives the toggle state from HA. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `onColor`, `offColor`, `textColor`, `fontSize`, `fontFamily`

#### 4. knob - Rotary Controls

```json
{
  "id": "knob_1",
  "type": "knob",
  "position": {
    "x": 10,
    "y": 10,
    "width": 150,
    "height": 150,
    "zIndex": 1
  },
  "config": {
    "entity_id": "input_number.volume",
    "label": "Volume",
    "min": 0,
    "max": 100,
    "step": 1,
    "skin": "p1",
    "knobColor": "#2196f3",
    "textColor": "#ffffff",
    "showValue": true,
    "valueSuffix": "%"
  },
  "bindings": {}
}
```

**Properties:**

- `label`, `entity_id`, `min`, `max`, `step`, `dialStep`, `value`

**Bindings:** `value` accepts a `{...}` binding expression to drive the knob position from a live entity state. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `skin` - `p1`, `p2`, `p3`, `p4`, `p5`
- `knobColor`, `textColor`, `accentColor`
- `showValue`, `valuePrefix`, `valueSuffix`
- `angleOffset`, `angleRange`
- `markerType` - `triangle`, `rect`, `dot`, `none`

---

### Display Widgets

#### 5. text - Text Display

```json
{
  "id": "text_1",
  "type": "text",
  "position": {
    "x": 10,
    "y": 10,
    "width": 200,
    "height": 60,
    "zIndex": 1
  },
  "config": {
    "entity_id": "sensor.temperature",
    "text": "{entity.state}",
    "prefix": "Temp:",
    "unit": "°C",
    "textColor": "#ffffff",
    "fontSize": 24,
    "fontWeight": "bold",
    "textAlign": "center"
  },
  "bindings": {}
}
```

**Properties:**

- `entity_id`, `text`, `prefix`, `unit`
- `textColor`, `fontSize`, `fontWeight`, `fontFamily`
- `textAlign` - `left`, `center`, `right`
- `verticalAlign` - `flex-start`, `center`, `flex-end`

**Bindings:** `text` fully supports `{...}` binding expressions including operations and mixed text. Use `entity_id` to bind the widget to an entity (the text template can then reference `{entity.state}`). Example: `"text": "{sensor.temperature.state;round(1)}°C"` Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.

#### 6. value - Sensor Value Display

```json
{
  "id": "value_1",
  "type": "value",
  "position": {
    "x": 10,
    "y": 10,
    "width": 150,
    "height": 80,
    "zIndex": 1
  },
  "config": {
    "entity_id": "sensor.temperature",
    "value": "{entity.state}",
    "suffix": "°C",
    "decimals": 1,
    "fontSize": 32,
    "fontWeight": "bold",
    "textAlign": "center",
    "textColor": "#ffffff"
  },
  "bindings": {}
}
```

**Properties:**

- `entity_id`, `value`, `prefix`, `suffix`, `decimals`

**Bindings:** `entity_id` drives the displayed value. Use `value` with a binding expression for advanced formatting: `"value": "{sensor.temp.state;round(1)}"` Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `formatThousands`, `fontSize`, `fontWeight`, `textAlign`, `textColor`, `backgroundColor`

#### 7. gauge - Visual Meters

```json
{
  "id": "gauge_1",
  "type": "gauge",
  "position": {
    "x": 10,
    "y": 10,
    "width": 200,
    "height": 200,
    "zIndex": 1
  },
  "config": {
    "entity_id": "sensor.battery",
    "min": 0,
    "max": 100,
    "gaugeType": "radial",
    "needleOnly": false,
    "pointerType": "needle",
    "pointerColor": "#ffffff",
    "showArc": true,
    "arcWidth": 0.2,
    "zone1Color": "#5BE12C",
    "zone1Limit": 33,
    "zone2Color": "#F5CD19",
    "zone2Limit": 66,
    "zone3Color": "#EA4228"
  },
  "bindings": {}
}
```

**Properties:**

- `entity_id`, `min`, `max`, `unit`

**Bindings:** `entity_id` drives the gauge needle from live entity state. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `gaugeType` - `radial`, `grafana`, `semicircle`
- `needleOnly`, `pointerType` (`needle`, `arrow`, `blob`)
- `pointerColor`, `pointerLength`, `pointerWidth`
- `showArc`, `arcWidth`
- `zone1/2/3Color`, `zone1/2Limit`
- `showValue`, `showTicks`, `textColor`

#### 8. icon - Material Design Icons

```json
{
  "id": "icon_1",
  "type": "icon",
  "position": {
    "x": 10,
    "y": 10,
    "width": 120,
    "height": 120,
    "zIndex": 1
  },
  "config": {
    "icon": "mdi:lightbulb",
    "color": "#fbbf24",
    "size": 100,
    "entity_id": "light.bedroom",
    "fillEntity": "light.bedroom",
    "fillMin": 0,
    "fillMax": 100,
    "fillDirection": "bottom-up",
    "fillColor": "#00ff00"
  },
  "bindings": {}
}
```

**Properties:**

- `icon`, `entity_id`, `color`, `activeColor`, `size`

**Bindings:** `icon` accepts a `{...}` binding expression — set it to `"{light.bedroom.state;array(LightOff,LightbulbOn)}"` to swap icons based on entity state. `entity_id` controls active/inactive color state. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `fillEntity`, `fillMin`, `fillMax`
- `fillDirection` - `bottom-up`, `top-down`, `left-to-right`, `right-to-left`
- `fillColor`, `outlineMode` (`none`, `outline`, `filled`)
- `strokeWidth`, `glowWidth`, `glowColor`
- `enableRotation`, `rotationSpeed`

#### 9. progressbar - Linear Progress

```json
{
  "id": "progress_1",
  "type": "progressbar",
  "position": {
    "x": 10,
    "y": 10,
    "width": 300,
    "height": 40,
    "zIndex": 1
  },
  "config": {
    "entity_id": "sensor.battery",
    "value": 50,
    "min": 0,
    "max": 100,
    "orientation": "horizontal",
    "displayMode": "standard",
    "showValue": true,
    "unit": "%",
    "barColor": "#2196f3",
    "backgroundColor": "#424242",
    "textColor": "#ffffff"
  },
  "bindings": {}
}
```

**Advanced with Color Ranges:**

```json
{
  "id": "progress_2",
  "type": "progressbar",
  "entity_id": "sensor.battery",
  "displayMode": "segmented",
  "segmentCount": 10,
  "segmentGap": 4,
  "useColorRanges": true,
  "range1Min": 0,
  "range1Max": 25,
  "range1Color": "#ef4444",
  "range2Min": 25,
  "range2Max": 75,
  "range2Color": "#fbbf24",
  "range3Min": 75,
  "range3Max": 100,
  "range3Color": "#10b981"
}
```

**Properties:**

- `entity_id`, `value`, `min`, `max`

**Bindings:** `entity_id` drives the bar fill from live entity state. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `orientation` - `horizontal`, `vertical`
- `displayMode` - `standard`, `segmented`, `graduated`, `striped`
- `segmentCount`, `segmentGap`
- `emptySegmentMode` - `outline`, `dimmed`, `invisible`
- `showValue`, `unit`, `barColor`, `backgroundColor`, `textColor`, `borderRadius`
- `useColorRanges`, `range1-4Min/Max/Color`

#### 10. progresscircle - Circular Progress

```json
{
  "id": "circle_1",
  "type": "progresscircle",
  "position": {
    "x": 10,
    "y": 10,
    "width": 150,
    "height": 150,
    "zIndex": 1
  },
  "config": {
    "entity_id": "sensor.cpu",
    "value": 50,
    "min": 0,
    "max": 100,
    "strokeWidth": 8,
    "pathColor": "#2196f3",
    "trailColor": "#d6d6d6",
    "textColor": "#000000",
    "showValue": true,
    "unit": "%",
    "segmented": false
  },
  "bindings": {}
}
```

**Properties:**

- Same as progressbar, plus:
- `strokeWidth`, `pathColor`, `trailColor`, `textSize`
- `counterClockwise`, `segmented`, `segmentCount`, `segmentGap`

**Bindings:** `entity_id` drives the circular progress fill from live entity state. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.

#### 11. flipclock - Animated Flip Clock

```json
{
  "id": "clock_1",
  "type": "flipclock",
  "position": {
    "x": 10,
    "y": 10,
    "width": 400,
    "height": 150,
    "zIndex": 1
  },
  "config": {
    "format": "12",
    "showSeconds": true,
    "bgColor": "rgb(38, 37, 41)",
    "cardTopColor": "rgb(48, 49, 53)",
    "cardBottomColor": "rgb(57, 58, 63)",
    "textColor": "#ffffff",
    "fontFamily": "'Saira Extra Condensed', sans-serif",
    "fontSizeScale": 100,
    "showGears": true,
    "showBorders": true
  },
  "bindings": {}
}
```

**Properties:**

- `format` - `12` or `24`, `showSeconds`
- `bgColor`, `cardTopColor`, `cardBottomColor`, `textColor`
- `fontFamily`, `fontSizeScale`, `showGears`, `showBorders`, `showContainerBorder`

**Bindings:** Clock widgets display live system time — no entity binding needed. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.

#### 12. digitalclock - LED-Style Clock

```json
{
  "id": "clock_2",
  "type": "digitalclock",
  "position": {
    "x": 10,
    "y": 10,
    "width": 400,
    "height": 120,
    "zIndex": 1
  },
  "config": {
    "format": "12",
    "showSeconds": true,
    "showDate": true,
    "showDay": true,
    "backgroundColor": "#1a1a1a",
    "timeColor": "#00ff00",
    "dateColor": "#00ff00",
    "fontFamily": "'DSEG7 Classic', monospace",
    "fontSize": 48,
    "glow": true,
    "blinkColon": true
  },
  "bindings": {}
}
```

**Properties:**

- `format`, `showSeconds`, `showDate`, `showDay`
- `backgroundColor`, `timeColor`, `dateColor`
- `fontFamily`, `fontFamilySecondary`, `fontSize`, `glow`, `blinkColon`

**Bindings:** Displays live system time — no entity binding needed. Supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.

#### 13. weather - Weather Display

```json
{
  "id": "weather_1",
  "type": "weather",
  "position": {
    "x": 10,
    "y": 10,
    "width": 400,
    "height": 300,
    "zIndex": 1
  },
  "config": {
    "entity_id": "weather.home",
    "showForecast": true,
    "forecastDays": 5,
    "showHumidity": true,
    "showWind": true,
    "showPressure": false,
    "compactMode": false,
    "temperatureColor": "#ffffff",
    "conditionColor": "#cccccc"
  },
  "bindings": {}
}
```

**Properties:**

- `entity_id`, `showForecast`, `forecastDays` (3-7)

**Bindings:** `entity_id` must reference a `weather.*` entity. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `showHumidity`, `showWind`, `showPressure`
- `compactMode`, `temperatureColor`, `conditionColor`

---

### Input Widgets

#### 14. inputtext - Text Input Fields

```json
{
  "id": "input_1",
  "type": "inputtext",
  "position": {
    "x": 10,
    "y": 10,
    "width": 300,
    "height": 50,
    "zIndex": 1
  },
  "config": {
    "entity_id": "input_text.note",
    "placeholder": "Enter text...",
    "label": "Note",
    "passwordMode": false,
    "textColor": "#ffffff",
    "backgroundColor": "#424242",
    "borderColor": "#666666",
    "fontSize": 14
  },
  "bindings": {}
}
```

**Properties:**

- `entity_id`, `placeholder`, `label`

**Bindings:** `entity_id` reads the current entity value into the input field and writes changes back on submit. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `passwordMode`, `showPasswordToggle`
- `textColor`, `backgroundColor`, `borderColor`, `fontSize`

#### 15. radiobutton - Radio Button Groups

```json
{
  "id": "radio_1",
  "type": "radiobutton",
  "position": {
    "x": 10,
    "y": 10,
    "width": 150,
    "height": 120,
    "zIndex": 1
  },
  "config": {
    "entity_id": "input_select.mode",
    "options": "Home,Away,Sleep",
    "values": "home,away,sleep",
    "orientation": "vertical",
    "fontSize": 14,
    "textColor": "#ffffff",
    "activeColor": "#2196f3"
  },
  "bindings": {}
}
```

**Properties:**

- `entity_id`, `options` (comma-separated), `values` (optional)

**Bindings:** `entity_id` drives selection state; selecting an option calls the entity's service. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `orientation` - `vertical`, `horizontal`
- `fontSize`, `textColor`, `activeColor`, `backgroundColor`, `fontFamily`

#### 16. colorpicker - Color Selection

```json
{
  "id": "color_1",
  "type": "colorpicker",
  "position": {
    "x": 10,
    "y": 10,
    "width": 300,
    "height": 200,
    "zIndex": 1
  },
  "config": {
    "entity_id": "light.bedroom",
    "outputFormat": "auto",
    "swatchWidth": 60,
    "swatchHeight": 60,
    "swatchBorderRadius": 4
  },
  "bindings": {}
}
```

**Properties:**

- `entity_id`, `outputFormat` - `auto`, `rgb`, `hex`, `hex_no_hash`

**Bindings:** `entity_id` reads current color from entity and writes color changes back on pick. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `customService`, `customField`
- `swatchWidth`, `swatchHeight`, `swatchBorderRadius`

---

### Media Widgets

#### 17. image - Static or Entity Images

```json
{
  "id": "img_1",
  "type": "image",
  "position": {
    "x": 10,
    "y": 10,
    "width": 400,
    "height": 300,
    "zIndex": 1
  },
  "config": {
    "entity_id": "camera.front_door",
    "objectFit": "cover",
    "refreshInterval": 0
  },
  "bindings": {}
}
```

**Alternative (static image):**

```json
{
  "id": "img_2",
  "type": "image",
  "imageUrl": "https://example.com/image.jpg",
  "localImagePath": "/local/image.png",
  "objectFit": "contain"
}
```

**Properties:**

- `entity_id` (for cameras), `imageUrl`, `localImagePath`, `altText`

**Bindings:** `entity_id` reads the `entity_picture` attribute for dynamic image URLs (e.g., camera entities, person entities). Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `refreshInterval` (ms), `objectFit` - `contain`, `cover`, `fill`, `none`, `scale-down`

#### 18. camera - Live Camera Streams

```json
{
  "id": "cam_1",
  "type": "camera",
  "position": {
    "x": 10,
    "y": 10,
    "width": 640,
    "height": 480,
    "zIndex": 1
  },
  "config": {
    "entity_id": "camera.front_door",
    "streamMode": "auto",
    "objectFit": "cover",
    "showControls": true,
    "autoplay": true,
    "muted": true
  },
  "bindings": {}
}
```

**Properties:**

- `entity_id`, `streamMode` - `auto`, `webrtc`, `hls`, `mjpeg`, `snapshot`

**Bindings:** `entity_id` must reference a `camera.*` entity. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `enableMicrophone`, `showControls`, `muted`, `autoplay`
- `objectFit` - `cover`, `contain`, `fill`, `none`, `scale-down`

---

### Container/Layout Widgets

#### 19. iframe - Embed External Content

```json
{
  "id": "frame_1",
  "type": "iframe",
  "position": {
    "x": 10,
    "y": 10,
    "width": 800,
    "height": 600,
    "zIndex": 1
  },
  "config": {
    "urlType": "external",
    "url": "https://example.com",
    "allowFullscreen": true,
    "scrolling": "auto"
  },
  "bindings": {}
}
```

**Alternative (embed another view):**

```json
{
  "id": "frame_2",
  "type": "iframe",
  "urlType": "view",
  "viewId": "living-room"
}
```

**Properties:**

- `urlType` - `external`, `view`, `entity`
- `url`, `viewId`, `entity_id`

**Bindings:** `entity_id` can drive the displayed URL via the entity's `entity_picture` or `url` attribute. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `allowFullscreen`, `sandbox`, `scrolling` - `auto`, `yes`, `no`

#### 20. border - Decorative Borders

```json
{
  "id": "border_1",
  "type": "border",
  "position": {
    "x": 10,
    "y": 10,
    "width": 400,
    "height": 300,
    "zIndex": 1
  },
  "config": {
    "borderStyle": "solid",
    "borderWidth": 3,
    "borderColor": "#ffffff",
    "borderRadius": 0
  },
  "bindings": {}
}
```

**Properties:**

- `borderStyle` - `solid`, `dashed`, `dotted`, `double`
- `borderWidth` (thickness), `borderColor`, `borderRadius`

**Bindings:** Supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.

#### 21. html - Custom HTML Content

```json
{
  "id": "html_1",
  "type": "html",
  "position": {
    "x": 10,
    "y": 10,
    "width": 400,
    "height": 200,
    "zIndex": 1
  },
  "config": {
    "html": "<h1 style='color:white'>Custom HTML</h1>",
    "overflow": "auto",
    "backgroundColor": "transparent",
    "padding": 8
  },
  "bindings": {}
}
```

**Alternative (entity-bound HTML):**

```json
{
  "id": "html_2",
  "type": "html",
  "useEntityHtml": true,
  "htmlEntity": "sensor.custom_html"
}
```

**Properties:**

- `useEntityHtml`, `htmlEntity`, `html`
- `overflow` - `auto`, `hidden`, `scroll`, `visible`
- `backgroundColor`, `padding`

**Bindings:** HTML content itself is static. Supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.

#### 22. graph - Sensor History Charts

```json
{
  "id": "graph_1",
  "type": "graph",
  "position": {
    "x": 10,
    "y": 10,
    "width": 600,
    "height": 300,
    "zIndex": 1
  },
  "config": {
    "entity_id": "sensor.temperature",
    "chartType": "line",
    "dataPoints": 50,
    "lineColor": "#2196f3",
    "fillColor": "rgba(33, 150, 243, 0.2)",
    "showLegend": true,
    "showTooltip": true,
    "showGrid": true,
    "smooth": true,
    "backgroundColor": "#ffffff",
    "gridColor": "rgba(0, 0, 0, 0.1)"
  },
  "bindings": {}
}
```

**Properties:**

- `entity_id`, `chartType` - `line`, `bar`, `area`

**Bindings:** `entity_id` drives the history chart — must reference a sensor entity with numeric history. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `dataPoints` (10-500), `lineColor`, `fillColor`
- `backgroundColor`, `gridColor`, `textColor`
- `showLegend`, `showTooltip`, `showGrid`, `showAxisLabels`
- `smooth`, `animationDuration`, `borderRadius`

#### 23. lovelacecard - Native HA Cards

**USE THIS WHEN:** User requests Lovelace/Mushroom cards, custom cards, or when available cards from the Lovelace card list match the request better than native widgets.

**CRITICAL - Format Rules:**

- `cardConfig` MUST be a YAML string with `\n` for line breaks
- ALL card properties go in `cardConfig`, NOT directly in config
- `cardType` specifies which card to use

**Example 1 - Mushroom Light Card:**

```json
{
  "id": "card_1",
  "type": "lovelacecard",
  "position": {
    "x": 10,
    "y": 10,
    "width": 300,
    "height": 150,
    "zIndex": 1
  },
  "config": {
    "cardType": "custom:mushroom-light-card",
    "cardConfig": "entity: light.bedroom\nname: Bedroom Light\nicon: mdi:lightbulb\nuse_light_color: true\nshow_brightness_control: true"
  },
  "bindings": {}
}
```

**Example 2 - Picture Entity (Camera):**

```json
{
  "type": "lovelacecard",
  "config": {
    "cardType": "picture-entity",
    "cardConfig": "entity: camera.front_door\nname: Front Door Camera\nshow_name: true\nshow_state: true\ncamera_view: live"
  }
}
```

**Example 3 - Native Button:**

```json
{
  "type": "lovelacecard",
  "config": {
    "cardType": "button",
    "cardConfig": "entity: light.bedroom\nname: Bedroom\nicon: mdi:lightbulb\nshow_state: true"
  }
}
```

**Properties:**

- `cardType` - Card type (e.g., `custom:mushroom-light-card`, `picture-entity`, `button`, `entities`, `thermostat`)
- `cardConfig` - YAML configuration as string (use `\n` for line breaks, ALL card properties go here)

**Available Card Types:**

- Mushroom: `custom:mushroom-light-card`, `custom:mushroom-fan-card`, `custom:mushroom-entity-card`, `custom:mushroom-climate-card`
- Custom: `custom:button-card`, `custom:mini-graph-card`
- Native: `button`, `entities`, `thermostat`, `weather-forecast`, `picture-entity`

**WRONG - Do NOT do this:**

```json
{
  "config": {
    "cardType": "picture-entity",
    "entity": "camera.front_door"  ← WRONG! entity must be in cardConfig!
  }
}
```

**Bindings:** Widget content uses `cardConfig` YAML — Canvas UI `entity_id` and content `{...}` bindings don't apply inside the card. Supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.

#### 24. calendar - Calendar Events

```json
{
  "id": "cal_1",
  "type": "calendar",
  "position": {
    "x": 10,
    "y": 10,
    "width": 400,
    "height": 300,
    "zIndex": 1
  },
  "config": {
    "entity_id": "calendar.personal",
    "maxEvents": 5,
    "daysAhead": 7,
    "showDate": true,
    "showTime": true,
    "showLocation": false,
    "compactMode": false,
    "backgroundColor": "#ffffff",
    "headerColor": "#2196f3",
    "textColor": "#000000",
    "eventColor": "#4caf50",
    "fontSize": 14
  },
  "bindings": {}
}
```

**Properties:**

- `entity_id`, `maxEvents` (1-20), `daysAhead` (1-365)

**Bindings:** `entity_id` must reference a `calendar.*` entity. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `showDate`, `showTime`, `showLocation`, `compactMode`
- `backgroundColor`, `headerColor`, `textColor`, `eventColor`, `borderRadius`, `fontSize`

#### 25. scrollingtext - Scrolling Ticker

```json
{
  "id": "scroll_1",
  "type": "scrollingtext",
  "position": {
    "x": 0,
    "y": 0,
    "width": 1920,
    "height": 50,
    "zIndex": 1
  },
  "config": {
    "text": "Breaking news...",
    "entity_id": "sensor.ticker",
    "scrollSpeed": 50,
    "pauseOnHover": true,
    "separator": "  •  ",
    "textColor": "#ffffff",
    "backgroundColor": "#2196f3",
    "fontSize": 18,
    "fontWeight": "normal"
  },
  "bindings": {}
}
```

**Properties:**

- `text`, `entity_id`, `scrollSpeed` (pixels/sec, 10-200)

**Bindings:** `text` accepts `{...}` binding expressions. `entity_id` populates `text` from live entity state automatically. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.
- `pauseOnHover`, `separator`
- `textColor`, `backgroundColor`, `fontSize`, `fontFamily`, `fontWeight`

#### 26. keyboard - Virtual Keyboard

```json
{
  "id": "kbd_1",
  "type": "keyboard",
  "position": {
    "x": 10,
    "y": 10,
    "width": 800,
    "height": 300,
    "zIndex": 1
  },
  "config": {
    "layout": "default",
    "target_entity": "input_text.note",
    "showDisplay": true,
    "draggable": true,
    "autoShow": false,
    "floatingMode": false,
    "backgroundColor": "#1e1e1e",
    "buttonColor": "#3b3b3b",
    "buttonTextColor": "#ffffff"
  },
  "bindings": {}
}
```

**Properties:**

- `layout` - `default`, `numeric`, `compact`
- `target_entity`, `showDisplay`, `draggable`, `autoShow`, `floatingMode`
- `theme`, `backgroundColor`, `buttonColor`, `buttonTextColor`, `buttonHoverColor`
- `displayBackgroundColor`, `displayTextColor`

**Bindings:** `target_entity` determines where keyboard input is sent. Supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.

#### 27. resolution - Dashboard Boundaries

```json
{
  "id": "res_1",
  "type": "resolution",
  "position": {
    "x": 0,
    "y": 0,
    "width": 1920,
    "height": 1080,
    "zIndex": 1
  },
  "config": {
    "showResolution": true,
    "showRatio": true,
    "showLabel": true,
    "textColor": "#ffffff",
    "labelColor": "#cccccc",
    "backgroundColor": "rgba(0, 0, 0, 0.5)",
    "fontSize": 24
  },
  "bindings": {}
}
```

**Properties:**

- `showResolution`, `showRatio`, `showLabel`
- `textColor`, `labelColor`, `backgroundColor`, `fontSize`, `labelSize`

**Bindings:** Reference-only widget displaying canvas dimensions — no entity bindings. Also supports universal style bindings: `backgroundColor`, `backgroundImage`, `borderColor`, `borderStyle`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`.

---

## Complete Example

```json
{
  "version": "2.0.0",
  "exportedAt": "2026-03-01T12:00:00.000Z",
  "view": {
    "id": "living-room",
    "name": "Living Room",
    "style": {
      "backgroundColor": "#1a1a1a"
    },
    "widgets": [
      {
        "id": "title",
        "type": "text",
        "position": {
          "x": 20,
          "y": 20,
          "width": 760,
          "height": 60,
          "zIndex": 1
        },
        "config": {
          "text": "Living Room Controls",
          "fontSize": 32,
          "fontWeight": "bold",
          "textAlign": "center",
          "textColor": "#ffffff"
        },
        "bindings": {}
      },
      {
        "id": "ceiling_light",
        "type": "button",
        "position": {
          "x": 20,
          "y": 100,
          "width": 200,
          "height": 80,
          "zIndex": 1
        },
        "config": {
          "label": "Ceiling Light",
          "entity_id": "light.living_room_ceiling",
          "actionType": "toggle",
          "icon": "PowerSettingsNew",
          "iconPosition": "left",
          "backgroundColor": "#fbbf24",
          "textColor": "#ffffff",
          "borderRadius": 8,
          "boxShadow": "0 4px 8px rgba(0,0,0,0.3)"
        },
        "bindings": {}
      },
      {
        "id": "brightness",
        "type": "slider",
        "position": {
          "x": 240,
          "y": 100,
          "width": 300,
          "height": 80,
          "zIndex": 1
        },
        "config": {
          "entity_id": "light.living_room_ceiling",
          "label": "Brightness",
          "min": 0,
          "max": 100,
          "orientation": "horizontal",
          "fillColor": "#fbbf24",
          "showValue": true
        },
        "bindings": {}
      },
      {
        "id": "temp_sensor",
        "type": "value",
        "position": {
          "x": 560,
          "y": 100,
          "width": 220,
          "height": 80,
          "zIndex": 1
        },
        "config": {
          "entity_id": "sensor.living_room_temperature",
          "value": "{entity.state}",
          "suffix": "°C",
          "decimals": 1,
          "fontSize": 28,
          "textAlign": "center",
          "textColor": "#ffffff",
          "backgroundColor": "rgba(33, 150, 243, 0.2)",
          "borderRadius": 8
        },
        "bindings": {}
      }
    ]
  },
  "metadata": {
    "widgetCount": 4,
    "exportedFrom": "copilot"
  }
}
```

---

## Important Notes

1. **Property Names:**
   - Use `textColor` for text color in most widgets (NOT `color`)
   - Use `width` and `height` in position object (NOT `w` and `h`)
   - Use `entity_id` not `entity`
   - Position properties go in `position: {...}` object
   - All other properties go in `config: {...}` object
   - All widgets must have empty `bindings: {}` object

2. **Entity Bindings:**

   Any string property that accepts a `{...}` expression will automatically subscribe to the referenced HA entities and re-render on state change.

   **Simple:**
   ```
   {sensor.temperature.state}                       → entity state
   {sensor.temperature.attributes.unit_of_measurement} → attribute
   {sensor.temperature.ts}                          → last_updated as ms
   {sensor.temperature.lc}                          → last_changed as ms
   ```

   **Operation pipeline** (chain ops with `;`):
   ```
   {sensor.temp.state;round(1)}°C                  → round + append text
   {sensor.temp.state;*(1.8);+(32)}                → Celsius → Fahrenheit
   {sensor.temp.state;min(0);max(100)}             → clamp to range
   {light.x.state;array(off,on)}                   → map index to label
   {sensor.ts.state;date(hh:mm)}                   → format as time string
   {sensor.data.state;json(nested.key)}            → navigate JSON value
   ```

   **Multi-variable JS expression:**
   ```
   {h:sensor.a.state;w:sensor.b.state;Math.sqrt(h*h+w*w)}
   Index: {t:sensor.temp.state;Math.round(t*1.8+32)}°F
   ```

   **Mixed text** (multiple bindings in one string):
   ```
   Temp: {sensor.temp.state;round(1)}°C  Humidity: {sensor.humidity.state}%
   ```

   **Universal style bindings** — all string-typed style properties accept `{...}` on every widget:
   - `"backgroundColor": "{input_text.my_color}"`
   - `"borderColor": "{input_text.accent_color}"`
   - `"backgroundImage": "{input_text.wallpaper_url}"`
   - Also: `backgroundSize`, `backgroundPosition`, `backgroundRepeat`, `borderStyle`

3. **File Format for Import:**
   - **CRITICAL:** Use export format with `version`, `exportedAt`, `view` (singular), `metadata`
   - **DO NOT** use config format with `views` (plural array) when creating files for import
   - View must have `id` field for URL access
   - View uses `style` object (not `settings`)

4. **File Naming & View IDs:**
   - Save views as `view-name.json`
   - **CRITICAL:** View must have `view.id` field matching filename (e.g., `"id": "living-room"`)
   - Access via: `http://HA_URL/canvas-kiosk#view-id`
   - Without `view.id`, imports will fail with "Invalid view structure" error

5. **Widget IDs:**
   - Each widget must have unique `id`
   - Use descriptive names: `btn_ceiling`, `temp_sensor`, `slider_brightness`

6. **Colors:**
   - Use hex: `#ffffff`
   - Use rgba: `rgba(255, 255, 255, 0.5)`
   - Use named: `rgb(255, 255, 255)`
