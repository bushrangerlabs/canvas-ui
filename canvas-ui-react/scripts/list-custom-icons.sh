#!/bin/bash
# List Custom Icons Script (Shell version)
# Creates a JSON file listing all custom icons in the custom-icons directory
# Run this script after adding new icons to update the list

CUSTOM_ICONS_PATH="/config/www/canvas-ui/custom-icons"
OUTPUT_FILE="$CUSTOM_ICONS_PATH/.iconlist.json"

echo "Scanning custom icons directory..."

# Create directory if it doesn't exist
mkdir -p "$CUSTOM_ICONS_PATH"

# Find all icon files
icons=$(cd "$CUSTOM_ICONS_PATH" && ls -1 *.svg *.png *.jpg *.jpeg 2>/dev/null | sort)

# Count icons
count=$(echo "$icons" | grep -c .)

if [ -z "$icons" ]; then
  echo "[]" > "$OUTPUT_FILE"
  echo "No custom icons found."
  exit 0
fi

echo "Found $count custom icons:"
echo "$icons" | sed 's/^/  - /'

# Build JSON array
json="["
first=true
for icon in $icons; do
  if [ "$first" = true ]; then
    first=false
  else
    json="$json,"
  fi
  json="$json\"$icon\""
done
json="$json]"

# Write to file
echo "$json" > "$OUTPUT_FILE"

echo ""
echo "Icon list saved to: $OUTPUT_FILE"
echo "Custom icons are now available in the Canvas UI icon picker!"
