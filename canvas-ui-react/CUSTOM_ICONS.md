# Custom Icons Feature

Canvas UI now supports custom icons! You can add your own SVG, PNG, or JPG icons for use in any widget.

## 📁 Icon Storage Locations

### Option 1: Server Storage (Persistent - Recommended)

Upload icons directly to your Home Assistant server:

```
/config/www/canvas-ui/custom-icons/
```

### Option 2: Browser Storage (Temporary)

Upload via the icon picker UI - stored in browser localStorage

- ✅ Quick and easy
- ❌ Lost on browser cache clear
- ❌ Not shared across devices

## 🎨 Using Custom Icons

### Step 1: Add Icons to Server

**Via SSH/SFTP:**

```bash
# SSH into your Home Assistant
ssh root@192.168.1.103

# Copy icon files to custom icons directory
cp /path/to/myicon.svg /config/www/canvas-ui/custom-icons/

# Update icon list (optional, improves loading)
python3 /config/www/canvas-ui/scripts/list-custom-icons.py
```

**Via File Editor Add-on:**

1. Install "File Editor" add-on in Home Assistant
2. Navigate to `/config/www/canvas-ui/custom-icons/`
3. Upload your icon files

**Via Samba/Windows Share:**

1. Access your HA config folder via network share
2. Navigate to `www/canvas-ui/custom-icons/`
3. Copy icon files

### Step 2: Use in Icon Picker

1. Open any widget inspector that has an icon field
2. Click the icon picker
3. Select the **"CUSTOM"** tab
4. Upload icons directly (browser storage) OR
5. Select from server icons (if you uploaded via SSH/file editor)

### Step 3: Reference Custom Icons

Custom icons use the prefix `custom:`

```
custom:myicon.svg
custom:company-logo.png
custom:home-icon.jpg
```

## 🎯 Icon Formats

### SVG (Recommended)

- ✅ Scalable to any size
- ✅ Supports outline mode
- ✅ Supports color changes
- ✅ Supports glow effects
- ✅ Small file size

### PNG/JPG (Raster Images)

- ✅ Display as-is
- ⚠️ Fixed size (may blur when scaled)
- ❌ No outline mode
- ❌ No color changes

## 🔧 Icon Picker Upload Feature

The icon picker includes a built-in upload button:

1. Click any icon field in the inspector
2. Switch to "CUSTOM" tab
3. Click "Upload Icon" button
4. Select SVG, PNG, or JPG file
5. Icon is added to browser storage

**Note:** Browser-uploaded icons are temporary. For production use, copy icons to the server directory.

## 🤖 Automated Icon Listing

The script `/config/www/canvas-ui/scripts/list-custom-icons.py` creates a JSON index of your custom icons for faster loading.

**Run manually:**

```bash
python3 /config/www/canvas-ui/scripts/list-custom-icons.py
```

**Or create an automation:**

```yaml
# In configuration.yaml
automation:
  - alias: "Update Custom Icons List"
    trigger:
      - platform: time
        at: "03:00:00" # Daily at 3 AM
    action:
      - service: shell_command.update_icons_list

shell_command:
  update_icons_list: "python3 /config/www/canvas-ui/scripts/list-custom-icons.py"
```

## 💡 Usage Examples

### Button Widget with Custom Icon

```json
{
  "icon": "custom:power-button.svg",
  "iconSize": 48,
  "iconColor": "#ff0000"
}
```

### Icon Widget with Custom Logo

```json
{
  "icon": "custom:company-logo.png",
  "iconSize": 100
}
```

### External URL Icons

You can also reference icons from external URLs:

```
url:https://example.com/icons/myicon.svg
https://example.com/icons/myicon.svg
```

### Local HA Path Icons

Reference icons already in your www folder:

```
local:/local/www/my-icons/icon.svg
```

## 🎨 SVG Icon Tips

### Optimize SVGs for Best Results

- Remove unnecessary metadata
- Use single path elements when possible
- Avoid embedded raster images
- Keep viewBox attributes

### Online SVG Optimizers

- [SVGOMG](https://jakearchibald.github.io/svgomg/)
- [SVG Optimizer](https://petercollingridge.appspot.com/svg-editor)

### Free Icon Sources

- [Font Awesome](https://fontawesome.com/) - Download SVG
- [Material Design Icons](https://materialdesignicons.com/) - Download SVG
- [Feather Icons](https://feathericons.com/)
- [Heroicons](https://heroicons.com/)

## 🔍 Troubleshooting

**Icons not showing in picker:**

- Check file permissions (755 for directories, 644 for files)
- Verify files are in `/config/www/canvas-ui/custom-icons/`
- Run `list-custom-icons.py` to update the index
- Hard refresh browser (Ctrl+Shift+F5)

**SVG colors not changing:**

- Remove `fill` attributes from SVG paths
- Use `currentColor` or remove fill entirely
- Check for inline styles overriding colors

**Icons uploaded via picker disappear:**

- Browser-uploaded icons are temporary (localStorage)
- Copy to server directory for persistence
- Or re-upload after clearing browser cache

## 📝 Notes

- Maximum 200 icons displayed at once (use search to filter)
- SVG files get full icon feature support (outline, colors, effects)
- Raster images (PNG/JPG) display as-is without modifications
- Custom icons work in all widgets that support icons (Button, Icon, etc.)

## 🚀 Future Enhancements

Planned features:

- Direct upload to server (bypass localStorage)
- Icon management UI (delete, rename)
- Icon categories for custom icons
- Bulk icon upload
- Icon preview before upload
