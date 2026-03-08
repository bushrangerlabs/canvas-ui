# Canvas UI Demo Files

This directory contains importable view configuration files for testing and demonstration purposes.

## Available Demo Files

### `demo-progress-circle.json`

**Progress Circle Widget Complete Feature Demo**

Demonstrates all features and combinations of the ProgressCircleWidget:

- **Basic Modes**: Smooth circle, segmented (10 & 20 segments), with/without center value
- **Stroke Width Variations**: 6px, 12px, 20px, 30px
- **Color Combinations**: Various colors with matching semi-transparent backgrounds
- **Size Variations**: 80px (tiny), 100px (small), 140px (large), 160px (extra large)
- **Advanced Combinations**: Segmented + thick, smooth + thin, many segments (50), minimal style

**Features**: Interactive slider at top controls all circles simultaneously for live testing.

## How to Use

### Method 1: Import via UI

1. Open Canvas UI in edit mode
2. Click the hamburger menu (☰) → **Import View**
3. Click **Choose File** and select the demo JSON file
4. The view will be imported and appear in your views list

### Method 2: Manual Import (Development)

1. Copy the JSON content from the demo file
2. In Canvas UI, open browser DevTools (F12)
3. Go to Application → Local Storage → `canvas-ui-config`
4. Parse and merge the view into your existing configuration

### Method 3: API Import (if available)

```bash
# Copy file to server
scp demo-progress-circle.json root@192.168.1.103:/config/www/canvas-ui/demos/

# Import via API endpoint (if implemented)
curl -X POST http://homeassistant.local:8123/api/canvas-ui/import \
  -H "Content-Type: application/json" \
  -d @demo-progress-circle.json
```

## Prerequisites

### Required Entities

The demo files use test entities that should exist in your Home Assistant:

- `input_number.test_slider` - A slider helper (0-100 range)

### Creating Test Entities

If you don't have these entities, create them in Home Assistant:

**Configuration → Devices & Services → Helpers → Create Helper → Number**

- Name: "Test Slider"
- Min: 0
- Max: 100
- Step: 1
- Initial: 50

Or add to `configuration.yaml`:

```yaml
input_number:
  test_slider:
    name: Test Slider
    min: 0
    max: 100
    step: 1
    initial: 50
    mode: slider
```

## Customization

You can modify the demo files to:

- Change entity bindings to your actual sensors
- Adjust colors to match your theme
- Resize or reposition widgets
- Add additional examples
- Change the background color

## Tips

- **Full Screen**: Press F11 for fullscreen testing
- **Grid Snap**: Enable grid snap in edit mode for precise alignment
- **Zoom**: Use canvas zoom controls to see details
- **Export**: After customizing, export the view to save your changes

## Contributing

If you create useful demo configurations, consider contributing them back to the project!
