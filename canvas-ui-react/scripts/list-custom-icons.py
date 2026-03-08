#!/usr/bin/env python3
"""
List Custom Icons Script
Creates a JSON file listing all custom icons in the custom-icons directory
Run this script after adding new icons to update the list
"""

import json
import os
from pathlib import Path

# Path to custom icons directory (relative to HA config)
CUSTOM_ICONS_PATH = "/config/www/canvas-ui/custom-icons"
OUTPUT_FILE = "/config/www/canvas-ui/custom-icons/.iconlist.json"


def list_custom_icons():
    """List all icon files in the custom icons directory"""
    icons = []

    if not os.path.exists(CUSTOM_ICONS_PATH):
        print(f"Creating directory: {CUSTOM_ICONS_PATH}")
        os.makedirs(CUSTOM_ICONS_PATH, exist_ok=True)
        return icons

    # Supported icon formats
    valid_extensions = {".svg", ".png", ".jpg", ".jpeg"}

    for file in os.listdir(CUSTOM_ICONS_PATH):
        if any(file.lower().endswith(ext) for ext in valid_extensions):
            icons.append(file)

    return sorted(icons)


def main():
    print("Scanning custom icons directory...")
    icons = list_custom_icons()

    print(f"Found {len(icons)} custom icons:")
    for icon in icons:
        print(f"  - {icon}")

    # Write to JSON file
    with open(OUTPUT_FILE, "w") as f:
        json.dump(icons, f, indent=2)

    print(f"\nIcon list saved to: {OUTPUT_FILE}")
    print("Custom icons are now available in the Canvas UI icon picker!")


if __name__ == "__main__":
    main()
