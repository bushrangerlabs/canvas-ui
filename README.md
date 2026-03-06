# Canvas UI

A visual canvas-based dashboard builder for [Home Assistant](https://www.home-assistant.io/). Place and arrange widgets freely on a pixel-perfect canvas without writing YAML.

> **Beta** — tested on HA 2024.x+. Share feedback in [Issues](https://github.com/bushrangerlabs/canvas-ui/issues).

---

## Features

- **Free-form canvas** — drag, resize and layer widgets anywhere
- **27 built-in widgets** — buttons, gauges, sliders, clocks, weather, charts, camera, calendar, and more
- **Entity binding** — all widgets connect to live HA state via WebSocket
- **AI assistant** — describe what you want and let the AI place widgets (requires local Ollama)
- **Kiosk mode** — full-screen view for wall-mounted tablets (`/canvas-kiosk#view-name`)
- **File manager** — manage dashboard JSON files and images from within HA

---

## Installation

### Option A — HACS (recommended)

1. Open HACS → **Integrations** → ⋮ → **Custom repositories**
2. Add `https://github.com/bushrangerlabs/canvas-ui` — category **Integration**
3. Search **Canvas UI** and click **Download**
4. Restart Home Assistant
5. Go to **Settings → Devices & Services → Add Integration → Canvas UI**

### Option B — Manual

1. Download or clone this repo
2. Copy `custom_components/canvas_ui/` into your HA `config/custom_components/` folder
3. Restart Home Assistant
4. Go to **Settings → Devices & Services → Add Integration → Canvas UI**

---

## Usage

After installation a **Canvas UI** entry appears in the sidebar. Open it to start building:

| URL                     | Purpose                 |
| ----------------------- | ----------------------- |
| `/canvas-ui`            | Dashboard editor        |
| `/canvas-kiosk`         | Preview with HA chrome  |
| `/canvas-kiosk#my-view` | Kiosk mode, full screen |

---

## AI Assistant (optional)

The AI feature proxies requests to a local [Ollama](https://ollama.com/) instance.

1. Install Ollama and pull a model: `ollama pull llama3`
2. In HA go to **Settings → Devices & Services → Canvas UI → Configure**
3. Set **Ollama Server URL** (default `http://localhost:11434`)

---

## Included Widgets

ButtonWidget · TextWidget · ValueWidget · GaugeWidget · SliderWidget · SwitchWidget · ImageWidget · IconWidget · ProgressBarWidget · ProgressCircleWidget · InputTextWidget · KeyboardWidget · FlipClockWidget · DigitalClockWidget · KnobWidget · IFrameWidget · BorderWidget · RadioButtonWidget · ColorPickerWidget · WeatherWidget · CameraWidget · GraphWidget · CalendarWidget · ScrollingTextWidget · HtmlWidget · LovelaceCardWidget · ResolutionWidget

---

## Requirements

- Home Assistant 2024.1.0 or newer
- No additional Python packages required

---

## License

MIT — see [LICENSE](LICENSE)
