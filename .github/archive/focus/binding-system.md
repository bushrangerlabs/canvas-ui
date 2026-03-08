# Canvas UI - Binding System Focus

**Project Type:** Home Assistant Custom Integration (Python backend + Vanilla JS frontend)

A dual-mode drag-and-drop dashboard system inspired by ioBroker VIS, optimized for Home Assistant.

---

## 🚀 Quick Reference

### Deployment Commands

```bash
# Deploy frontend (most common)
sshpass -p 'AWpoP6Rx@wQ7jK' scp www/canvas-ui/FILE.js root@192.168.1.103:/config/www/canvas-ui/

# Deploy backend (requires restart)
sshpass -p 'AWpoP6Rx@wQ7jK' scp -r custom_components/canvas_ui/* root@192.168.1.103:/config/custom_components/canvas_ui/
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "ha core restart"
```

### Testing URLs

- View: `http://192.168.1.103:8123/canvas-ui`
- Edit: `http://192.168.1.103:8123/canvas-ui?edit=true`

---

## 🎯 CURRENT FOCUS: Advanced Binding System

### Binding Syntax

```javascript
{entity.attribute;operation1;operation2;...}
```

- **entity**: Home Assistant entity ID (e.g., `sensor.temperature`)
- **attribute**: Entity attribute (default: `state`)
- **operations**: Chain of transformations (optional)

### Quick Examples

```javascript
// Temperature conversion (Celsius to Fahrenheit)
{sensor.bedroom_temp.state;*1.8;+32;round(1)}°F

// Brightness percentage (0-255 → 0-100%)
Brightness: {light.living_room.brightness;/255;*100;round(0)}%

// Status translation (numeric to text)
Mode: {climate.thermostat.state;array(['Off','Heat','Cool','Auto'])}

// Multi-entity average
Avg: {sensor.room1.state;sensor.room2.state;(sensor_room1 + sensor_room2)/2;round(1)}°C

// Conditional display
{sensor.temp.state;value > 20 ? 'Hot' : 'Cold'}
```

### 45+ Operations (5 Categories)

#### 1. Mathematical Operations

```javascript
// Arithmetic
{sensor.value;*2}      // Multiply
{sensor.value;/10}     // Divide
{sensor.value;+32}     // Add
{sensor.value;-10}     // Subtract
{sensor.value;%3}      // Modulo

// Rounding
{sensor.value;round(2)}  // Round to 2 decimals
{sensor.value;floor()}   // Round down
{sensor.value;ceil()}    // Round up

// Limits
{sensor.value;min(0)}    // Clamp minimum
{sensor.value;max(100)}  // Clamp maximum

// Math functions
{sensor.value;pow(2)}    // Square
{sensor.value;sqrt()}    // Square root
{sensor.value;abs()}     // Absolute value
```

#### 2. Formatting Operations

```javascript
// Number formatting with thousand separators
{sensor.population;value(0)}    // → "1,234,567"
{sensor.price;value(2)}         // → "1,234.56"

// Hex conversion
{sensor.color;hex()}      // → "ff5500" (lowercase)
{sensor.color;HEX()}      // → "FF5500" (uppercase)
{sensor.value;hex2()}     // → "0f" (2-digit lowercase)
{sensor.value;HEX2()}     // → "0F" (2-digit uppercase)

// Date formatting
{sensor.timestamp;date(YYYY-MM-DD)}           // → "2026-01-23"
{sensor.timestamp;date(DD/MM/YYYY HH:mm)}     // → "23/01/2026 15:30"
{sensor.timestamp;date(MM-DD-YYYY hh:mm A)}   // → "01-23-2026 03:30 PM"
```

#### 3. String Operations

```javascript
// Case conversion
{sensor.message;toLowerCase}
{sensor.message;toUpperCase}

// String manipulation
{sensor.text;trim}                    // Remove whitespace
{sensor.text;replace(old,new)}        // Replace all "old" with "new"
{sensor.url;substring(0,10)}          // First 10 characters
{sensor.csv;split(,)}                 // Split by comma
{sensor.name;concat( Jr.)}            // Append text
```

#### 4. Array & Mapping Operations

```javascript
// Array indexing (state as index)
{binary_sensor.door;array(Closed,Open)}
// State 0 → "Closed", State 1 → "Open"

{sensor.mode;array(Off,Heat,Cool,Auto)}
// State 0 → "Off", 1 → "Heat", 2 → "Cool", 3 → "Auto"

// Icon mapping
{binary_sensor.door;array(🔒,🔓)}
{binary_sensor.motion;array(Clear,Detected)}
```

#### 5. Conditional Operations

```javascript
// Ternary conditionals
{sensor.temp.state;value > 20 ? 'Hot' : 'Cold'}
{sensor.battery.state;value < 20 ? '⚠️ Low' : '✓ OK'}

// Multi-entity calculations (entities become variables)
// sensor.room1_temp → sensor_room1_temp
// sensor.bedroom_temp → sensor_bedroom_temp
{sensor.room1.state;sensor.room2.state;(sensor_room1 + sensor_room2)/2}

// Complex chaining
{sensor.temp;*1.8;+32;round(1);value < 70 ? 'Cold' : 'Warm'}
```

### MDI Icon Integration

**Inline icons in binding output:**

```javascript
// Icon syntax: mdi:icon-name:color Text
"mdi:fire:#ff5500 Hot";
"mdi:snowflake:#03a9f4 Cold";

// In ternary conditionals
{
  sensor.temp;
  value > 20 ? "mdi:fire:#ff5500 Hot" : "mdi:snowflake:#03a9f4 Cold";
}
```

**150+ bundled icons in 9 categories:**

- Common, Navigation, Device, Home & IoT, Media, Weather, Status, Time & Date, Data & Charts

### Binding Editor Dialog

**Two Modes:**

**1. Simple Mode (Visual Builder):**

- Entity dropdown with "..." picker button
- Operation selector (45+ operations)
- Parameter inputs
- Add/remove operation buttons
- Icon palette button (🎨) for MDI icons
- Live preview of generated binding

**2. Multi-Variable Mode (Advanced):**

- Textarea for JavaScript eval expressions
- Format: `{var1:entity1;var2:entity2;formula}`
- Full JavaScript expression support
- Icon palette button for inline icons

**Integration:**

- Triggered by "{}" button in inspector
- Blue accent color
- Returns formatted binding string
- Updates input field on Apply

### Critical Patterns

**1. Display vs Config Separation:**

```javascript
// BAD - Overwrites config
this.viewRenderer.updateWidget(widgetId, { text: evaluatedValue });
// widget.config.text = evaluatedValue ❌ LOSES BINDING!

// GOOD - Updates display only
this.viewRenderer.updateWidgetDisplay(widgetId, { text: evaluatedValue });
// widget.textElement.textContent = evaluatedValue ✅ PRESERVES BINDING!
```

**2. Quote-Aware Ternary Parsing:**

```javascript
// Character-by-character parser respecting quotes
let inQuotes = false;
let quoteChar = null;

for (let i = 0; i < text.length; i++) {
  const char = text[i];

  if ((char === '"' || char === "'") && !inQuotes) {
    inQuotes = true;
    quoteChar = char;
  } else if (char === quoteChar && inQuotes) {
    inQuotes = false;
    quoteChar = null;
  }

  // Only split on : if not in quotes
  if (char === ":" && !inQuotes) {
    // Process split
  }
}
```

**3. Icon Parser Regex:**

```javascript
// Pattern: mdi:icon-name:color (stops at first space)
/mdi:([a-z0-9-]+)(?::([#a-z0-9(),.]+))?/gi;

// ✅ Captures: "mdi:fire:#ff5500" → icon: "fire", color: "#ff5500"
// ✅ Preserves: " Hot" text after icon
```

### Real-World Examples

**Temperature Display:**

```javascript
🌡️ Bedroom: {sensor.bedroom_temp.state;round(1)}°C ({sensor.bedroom_temp.state;*1.8;+32;round(0)}°F)
// Output: 🌡️ Bedroom: 22.5°C (73°F)
```

**Battery Status:**

```javascript
🔋 Battery: {sensor.phone_battery.state}% {sensor.phone_battery.state;value < 20 ? '⚠️' : ''}
// At 85%: 🔋 Battery: 85%
// At 15%: 🔋 Battery: 15% ⚠️
```

**Dynamic Icon:**

```javascript
{
  sensor.temp;
  value > 20 ? "mdi:fire:#ff5500 Hot" : "mdi:snowflake:#03a9f4 Cold";
}
// When temp = 25°C → 🔥 Hot (fire icon in orange)
// When temp = 15°C → ❄️ Cold (snowflake icon in blue)
```

---

## 📚 Reference Documentation

**For complete details, see BUILD_FOUNDATION.md:**

- **Complete Binding System** → Appendix B
- **Binding Evaluator** → § Data Binding System
- **Operation Reference** → All 45+ operations documented
- **Icon Parser** → Appendix H: MDI Icon System
- **Binding Editor Dialog** → Dialog integration documentation

---

**Last Updated:** January 28, 2026  
**Focus:** Advanced Binding System & Expression Evaluation
