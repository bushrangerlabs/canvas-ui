# ioBroker vis-2 View Sizing Analysis

## Research Summary

Analyzed ioBroker vis-2 source code to understand view dimension and boundary guide system.

## Key Features Discovered

### 1. View Resolution System

**Settings Properties:**

- `resolution`: Dropdown value ('none', 'user', or preset like '1920x1080')
- `sizex`: View width in pixels (number or string)
- `sizey`: View height in pixels (number or string)

**Resolution Presets (35+ options):**

```typescript
const resolution = [
  { value: "none", label: "not defined" },
  { value: "user", label: "User defined" },
  { value: "375x667", label: "iPhone SE - Portrait" },
  { value: "667x375", label: "iPhone SE - Landscape" },
  { value: "414x896", label: "iPhone XR - Portrait" },
  { value: "896x414", label: "iPhone XR - Landscape" },
  { value: "390x844", label: "iPhone 12 Pro - Portrait" },
  { value: "844x390", label: "iPhone 12 Pro - Landscape" },
  { value: "820x1180", label: "iPad Air - Portrait" },
  { value: "1180x820", label: "iPad Air - Landscape" },
  { value: "768x1024", label: "iPad Mini - Portrait" },
  { value: "1024x768", label: "iPad Mini - Landscape" },
  { value: "1024x1366", label: "iPad Pro - Portrait" },
  { value: "1366x1024", label: "iPad Pro - Landscape" },
  { value: "1280x720", label: "HD - Landscape" },
  { value: "1920x1080", label: "Full HD - Landscape" },
  // ... 19 more presets
];
```

**Usage Flow:**

1. Dropdown selection changes `resolution` setting
2. If preset selected → auto-sets `sizex` and `sizey` from preset value
3. If "user" selected → enables manual width/height inputs
4. If "none" selected → deletes sizex/sizey (infinite canvas)

### 2. Boundary Guide Rendering

**Visual Implementation:**

```tsx
renderScreenSize(): React.JSX.Element[] | null {
  const ww = parseInt(settings?.sizex || 0, 10);
  const hh = parseInt(settings?.sizey || 0, 10);

  if (!editMode || !ww || !hh) {
    return null;
  }

  return [
    // Black dashed border
    <div key="black" style={{
      top: 0,
      left: 0,
      width: `${ww}px`,
      height: `${hh}px`,
      position: 'absolute',
      borderTopWidth: 0,
      borderLeftWidth: 0,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      boxSizing: 'content-box',
      borderStyle: 'dashed',
      borderColor: 'black',
      zIndex: 1000,
      pointerEvents: 'none',
      userSelect: 'none',
      opacity: 0.7,
    }} />,

    // White offset border (for contrast on dark backgrounds)
    <div key="white" style={{
      top: 0,
      left: 0,
      width: `${ww + 1}px`,
      height: `${hh + 1}px`,
      position: 'absolute',
      borderTopWidth: 0,
      borderLeftWidth: 0,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      boxSizing: 'content-box',
      borderStyle: 'dashed',
      borderColor: 'white',
      zIndex: 1000,
      pointerEvents: 'none',
      userSelect: 'none',
      opacity: 0.7,
    }} />
  ];
}
```

**Key Design Decisions:**

- Only right and bottom borders (not full rectangle)
- Dual-layer (black + white offset by 1px) for visibility on any background
- Dashed style to distinguish from widget borders
- 70% opacity (0.7) to remain visible but not obtrusive
- `pointerEvents: 'none'` - doesn't interfere with editing
- `zIndex: 1000` - above widgets but below selection handles

### 3. View Settings UI

**In Inspector/Attributes Panel:**

```tsx
{
  type: 'select',
  label: 'Resolution',
  options: resolution,  // 35+ presets
  onChange: (e) => {
    if (e.target.value === 'none') {
      delete settings.sizex;
      delete settings.sizey;
      delete settings.resolution;
    } else if (e.target.value === 'user') {
      settings.sizex = settings.sizex || 0;
      settings.sizey = settings.sizey || 0;
      settings.resolution = 'user';
    } else {
      const [width, height] = e.target.value.split('x');
      settings.sizex = width;
      settings.sizey = height;
      settings.resolution = e.target.value;
    }
  }
},
{
  type: 'raw',
  label: 'Width x height (px)',
  hidden: 'sizex === undefined && sizey === undefined',
  Component: (
    <span>
      <TextField
        value={settings.sizex}
        disabled={settings.resolution !== 'user'}
        onChange={(e) => settings.sizex = e.target.value}
      />
      <CloseIcon />  {/* X separator */}
      <TextField
        value={settings.sizey}
        disabled={settings.resolution !== 'user'}
        onChange={(e) => settings.sizey = e.target.value}
      />
    </span>
  )
}
```

**UX Pattern:**

- Resolution dropdown is always enabled
- Manual width/height inputs only enabled when resolution = 'user'
- Fields hidden when resolution = 'none'

### 4. Canvas Size Adaptation

**View Container Sizing:**

```tsx
// If view has dimensions, constrain canvas size
if (settings.sizex && !limitScreenSize) {
  let ww = settings.sizex;
  let hh = settings.sizey || 0;

  // Add 'px' suffix if needed
  if (typeof ww === "number" || ww.match(/\d$/)) {
    ww = `${ww}px`;
  }
  if (typeof hh === "number" || hh.match(/\d$/)) {
    hh = `${hh}px`;
  }

  relativeStyle.width = ww;
  relativeStyle.height = hh;
} else {
  // Infinite canvas
  relativeStyle.width = "100%";
  relativeStyle.height = "100%";
}
```

## Implementation Plan for Canvas UI

### Phase 1: Data Model Updates

**1. Update ViewConfig type:**

```typescript
interface ViewConfig {
  id: string;
  name: string;
  backgroundColor: string;
  widgets: WidgetConfig[];
  // NEW:
  resolution?: "none" | "user" | string; // preset key
  sizex?: number; // width in pixels
  sizey?: number; // height in pixels
}
```

**2. Create resolution presets file:**

```typescript
// src/shared/constants/resolutions.ts
export const RESOLUTION_PRESETS = [
  { value: "none", label: "Not defined (infinite canvas)" },
  { value: "user", label: "User defined" },
  { value: "1920x1080", label: "Full HD - Landscape (1920×1080)" },
  { value: "1080x1920", label: "Full HD - Portrait (1080×1920)" },
  { value: "1280x720", label: "HD - Landscape (1280×720)" },
  { value: "720x1280", label: "HD - Portrait (720×1280)" },
  { value: "1024x768", label: "iPad Mini - Landscape (1024×768)" },
  { value: "768x1024", label: "iPad Mini - Portrait (768×1024)" },
  { value: "1180x820", label: "iPad Air - Landscape (1180×820)" },
  { value: "820x1180", label: "iPad Air - Portrait (820×1180)" },
  { value: "414x896", label: "iPhone XR - Portrait (414×896)" },
  { value: "390x844", label: "iPhone 12 Pro - Portrait (390×844)" },
  // ... add more as needed
];
```

### Phase 2: ViewManager Updates

**Add resolution fields to create/edit dialogs:**

```tsx
// In ViewManager.tsx - Create Dialog
<TextField
  select
  label="Resolution"
  value={newView.resolution || "none"}
  onChange={(e) => {
    const value = e.target.value;
    if (value === "none") {
      setNewView({
        ...newView,
        resolution: "none",
        sizex: undefined,
        sizey: undefined,
      });
    } else if (value === "user") {
      setNewView({ ...newView, resolution: "user", sizex: 1920, sizey: 1080 });
    } else {
      const [width, height] = value.split("x").map(Number);
      setNewView({
        ...newView,
        resolution: value,
        sizex: width,
        sizey: height,
      });
    }
  }}
>
  {RESOLUTION_PRESETS.map((preset) => (
    <MenuItem key={preset.value} value={preset.value}>
      {preset.label}
    </MenuItem>
  ))}
</TextField>;

{
  /* Show width/height inputs only when resolution is set */
}
{
  newView.resolution && newView.resolution !== "none" && (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      <TextField
        type="number"
        label="Width (px)"
        value={newView.sizex || ""}
        disabled={newView.resolution !== "user"}
        onChange={(e) =>
          setNewView({ ...newView, sizex: Number(e.target.value) })
        }
      />
      <Typography>×</Typography>
      <TextField
        type="number"
        label="Height (px)"
        value={newView.sizey || ""}
        disabled={newView.resolution !== "user"}
        onChange={(e) =>
          setNewView({ ...newView, sizey: Number(e.target.value) })
        }
      />
    </Box>
  );
}
```

### Phase 3: Canvas Boundary Guide

**Add to Canvas.tsx:**

```tsx
// Canvas.tsx - in edit mode only
const renderViewBoundary = () => {
  if (!currentView?.sizex || !currentView?.sizey) {
    return null;
  }

  const width = currentView.sizex;
  const height = currentView.sizey;

  return (
    <>
      {/* Black dashed border */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${width}px`,
          height: `${height}px`,
          borderRight: "1px dashed black",
          borderBottom: "1px dashed black",
          boxSizing: "content-box",
          opacity: 0.7,
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 1000,
        }}
      />
      {/* White offset border for contrast */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${width + 1}px`,
          height: `${height + 1}px`,
          borderRight: "1px dashed white",
          borderBottom: "1px dashed white",
          boxSizing: "content-box",
          opacity: 0.7,
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 1000,
        }}
      />
    </>
  );
};

// In Canvas render:
return (
  <Box ref={canvasRef} sx={canvasStyle}>
    {renderViewBoundary()} {/* Add boundary guide */}
    {widgets.map((widget) => renderWidget(widget))}
  </Box>
);
```

### Phase 4: Inspector View Settings Tab

**Add View Settings section to Inspector:**

```tsx
// Inspector.tsx - new tab or section
<Accordion>
  <AccordionSummary>View Settings</AccordionSummary>
  <AccordionDetails>
    <FormControl fullWidth>
      <InputLabel>Resolution</InputLabel>
      <Select
        value={currentView.resolution || "none"}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "none") {
            updateView({
              resolution: "none",
              sizex: undefined,
              sizey: undefined,
            });
          } else if (value === "user") {
            updateView({ resolution: "user", sizex: 1920, sizey: 1080 });
          } else {
            const [width, height] = value.split("x").map(Number);
            updateView({ resolution: value, sizex: width, sizey: height });
          }
        }}
      >
        {RESOLUTION_PRESETS.map((preset) => (
          <MenuItem key={preset.value} value={preset.value}>
            {preset.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    {currentView.resolution !== "none" && (
      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <TextField
          type="number"
          label="Width"
          value={currentView.sizex || ""}
          disabled={currentView.resolution !== "user"}
          onChange={(e) => updateView({ sizex: Number(e.target.value) })}
        />
        <TextField
          type="number"
          label="Height"
          value={currentView.sizey || ""}
          disabled={currentView.resolution !== "user"}
          onChange={(e) => updateView({ sizey: Number(e.target.value) })}
        />
      </Box>
    )}
  </AccordionDetails>
</Accordion>
```

## Benefits for Canvas UI

1. **Mobile/Tablet Design**: Design for specific device sizes
2. **Responsive Testing**: Preview how layouts look at different resolutions
3. **Kiosk Dashboards**: Design for specific screen dimensions (wall tablets, etc.)
4. **Visual Feedback**: Clear boundary guide shows exact view dimensions while editing
5. **Professional Workflow**: Matches industry-standard design tools (Figma, Sketch)

## Migration Strategy

**Backwards Compatibility:**

- Existing views without resolution settings → treated as 'none' (infinite canvas)
- New resolution fields are optional
- Default behavior unchanged (infinite canvas)

**Rollout:**

1. Add data model fields (Phase 1)
2. Add ViewManager UI (Phase 2)
3. Add boundary guide rendering (Phase 3)
4. Add Inspector controls (Phase 4)
5. Document feature in user guide

## Source Files Referenced

- `/ioBroker.vis-2/src-vis/src/Attributes/View/Items.tsx` - Resolution presets and UI
- `/ioBroker.vis-2/src-vis/src/Vis/visView.tsx` - Boundary rendering (lines 1457-1520, 2180-2230)
- `/ioBroker.vis-2/src-vis/src/Vis/visEngine.tsx` - Resolution finding logic

## Next Steps

1. ✅ Research complete
2. Create resolution constants file
3. Update ViewConfig TypeScript types
4. Implement ViewManager resolution fields
5. Add Canvas boundary guide rendering
6. Add Inspector view settings controls
7. Test with various presets
8. Document feature usage
