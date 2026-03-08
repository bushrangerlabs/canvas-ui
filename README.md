

**\*\*** THE REPO IS NOT CURRENTLY IN FULL WORKING STATE SO PLEASE DO NOT USE **\*\***

> **Modern, drag-and-drop visual editor for creating custom Home Assistant dashboards**

Canvas UI brings ioBroker.vis-style visual editing to Home Assistant with a powerful React-based interface featuring 20+ widgets, AI-assisted view generation, and professional dashboard creation tools.

## ✨ Features

- 🎨 **Visual Drag-and-Drop Editor** - Intuitive canvas-based layout system
- 🧩 **20+ Professional Widgets** - Buttons, gauges, sliders, charts, weather, and more
- 🤖 **AI View Generator** - Create entire dashboards from natural language prompts
- 📱 **Kiosk Mode** - Full-screen display mode for wall panels and tablets
- 🎯 **Precision Tools** - Alignment, grouping, grid snapping, and guides
- 🔗 **Entity Binding** - Real-time entity data integration
- 🎭 **Custom Icons** - 17,000+ icons from MDI, Font Awesome, and more
- 💾 **View Management** - Export/import views as JSON for backup and sharing
- 🎛️ **Inspector Panel** - Comprehensive property editing with live preview




## 📦 Installation

### HACS (Home Assistant Community Store)

**Recommended method for easy updates**

1. Ensure [HACS](https://hacs.xyz/) is installed in your Home Assistant
2. Add this repository as a custom repository:
   - In HACS, click the 3 dots menu (⋮) in the top right
   - Select "Custom repositories"
   - Add repository URL: `https://github.com/bushrangerlabs/canvas-ui`
   - Category: **Integration**
   - Click "Add"
3. Search for "Canvas UI" in HACS
4. Click "Download"
5. Restart Home Assistant
6. Canvas UI will appear in your sidebar

### Manual Installation

**For advanced users or development**

1. **Download the repository**:

   ```bash
   git clone https://github.com/spetchal/canvas-ui.git
   cd canvas-ui
   ```

2. **Copy files to Home Assistant**:

   ```bash
   # Copy custom component
   cp -r custom_components/canvas_ui /path/to/ha/config/custom_components/

   # Copy frontend files
   cp -r www/canvas-ui /path/to/ha/config/www/
   ```

3. **Or use the installation script**:

   ```bash
   ./install.sh /path/to/ha/config
   ```

4. **Restart Home Assistant**

5. Canvas UI will appear in your sidebar

### Building from Source

If you want the latest development version:

```bash
cd canvas-ui-react
npm install
npm run build:hacs

# Then copy files
cd ..
cp -r canvas-ui-react/dist-hacs/* /path/to/ha/config/www/canvas-ui/
```

## ⚙️ Configuration

After installation, add Canvas UI to your `configuration.yaml`:

```yaml
# configuration.yaml
canvas_ui:
```

That's it! The integration will automatically:

- Register the Canvas UI panel in your sidebar
- Set up WebSocket services for widget communication
- Enable AI view generation (if Ollama is configured)

**Optional AI Configuration:**
If you want to use the AI View Generator, ensure you have Ollama running and accessible from Home Assistant.

Then restart Home Assistant for the changes to take effect.

## 🚀 Quick Start

1. **Access Canvas UI**: Click "Canvas UI" in your Home Assistant sidebar
2. **Create a View**: Click the "+" button to create your first view
3. **Add Widgets**: Open the Widget Library and drag widgets onto the canvas
4. **Configure**: Click any widget to edit properties in the Inspector panel
5. **Bind Entities**: Use the entity picker to connect widgets to your HA entities
6. **Preview**: Click the "View" mode to see your dashboard in action

### Using AI View Generator

1. Click the **AI** button in the toolbar
2. Describe your desired dashboard (e.g., "Create a living room control panel with temperature, lights, and media controls")
3. The AI will generate a complete view with configured widgets
4. Customize as needed using the visual editor

## 📊 Available Widgets

### Display Widgets

- **Text Widget** - Static or entity-bound text display
- **Value Widget** - Formatted entity values with units
- **Image Widget** - Static images or entity-based image URLs
- **Icon Widget** - 17,000+ icon library with state-based styling
- **Weather Widget** - Current conditions + 5-day forecast
- **Digital Clock** - LED-style clock with custom fonts
- **Flip Clock** - Animated flip clock widget
- **Calendar Widget** - Interactive calendar display

### Control Widgets

- **Button Widget** - Service calls, navigation, URLs with visual feedback
- **Switch Widget** - Toggle entities with custom styling
- **Slider Widget** - Horizontal/vertical sliders with auto-service detection
- **Knob Widget** - Rotary controls with 5 different skins
- **Input Text** - Text input with entity binding
- **Radio Button** - Radio button groups
- **Color Picker** - RGB/HSV color selection
- **Keyboard Widget** - On-screen keyboard for input

### Data Visualization

- **Gauge Widget** - Radial, semicircle, and Grafana-style gauges
- **Progress Bar** - Linear progress indicators
- **Progress Circle** - Circular/segmented progress
- **Graph Widget** - Time-series data charts

### Layout Widgets

- **Border Widget** - Decorative borders and frames
- **IFrame Widget** - Embed external content
- **HTML Widget** - Custom HTML content
- **Lovelace Card** - Embed any Lovelace card

### Advanced Widgets

- **Scrolling Text** - Marquee-style scrolling text
- **Camera Widget** - Live camera feeds with HLS support
- **Resolution Widget** - Display resolution management

## 🎛️ Widget Configuration

Each widget has a comprehensive property inspector with:

- **Layout** - Position, size, rotation, z-index
- **Style** - Colors, borders, shadows, backgrounds
- **Behavior** - Entity bindings, actions, animations
- **Advanced** - Conditional visibility, custom CSS

## 🖥️ Kiosk Mode

Access any view in fullscreen kiosk mode:

```
http://your-ha-ip:8123/canvas-kiosk?view=viewname
```

Perfect for wall-mounted tablets and dedicated displays.

## 🔧 Development

### Building from Source

```bash
cd canvas-ui-react
npm install
npm run build:hacs
```

Output is in `canvas-ui-react/dist-hacs/` and automatically copied to `www/canvas-ui/` by `./build.sh`.

### Deploy to Home Assistant

Use the included script (reads credentials from `.env`):

```bash
./deploy.sh
```

Or manually:

```bash
cd canvas-ui-react
npm run build:hacs
cd ..
cp -r canvas-ui-react/dist-hacs/* www/canvas-ui/
scp -r www/canvas-ui/* user@ha-server:/config/www/canvas-ui/
```

## 📝 Configuration Storage

All views and configurations are stored in:

```
/config/www/canvas-ui/canvas-ui-config.json
```

This file can be backed up and restored to preserve your dashboards.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [ioBroker.vis](https://github.com/ioBroker/ioBroker.vis-2)
- Built with [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Material-UI](https://mui.com/)
- Icons from [Material Design Icons](https://materialdesignicons.com/), [Font Awesome](https://fontawesome.com/), and [React Icons](https://react-icons.github.io/react-icons/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/spetchal/canvas-ui/issues)
- **Discussions**: [GitHub Discussions](https://github.com/spetchal/canvas-ui/discussions)

---

**Canvas UI** - Professional Dashboard Creation for Home Assistant 🏠✨
