#!/bin/bash
# Canvas UI Build Script
# Builds Canvas UI HACS version locally

set -e

echo "================================================"
echo "  Canvas UI Build"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -d "canvas-ui-react" ]; then
    echo "❌ Error: Run this from the canvas-ui-hacs/ directory"
    exit 1
fi

# Build HACS version
echo "📦 Building HACS version..."
cd canvas-ui-react
npm run build:hacs
cd ..

# Update www folder
echo "🔄 Updating www/canvas-ui folder..."
rm -rf www/canvas-ui
cp -r canvas-ui-react/dist-hacs www/canvas-ui

echo ""
echo "================================================"
echo "  ✅ Build Complete!"
echo "================================================"
echo ""
echo "To release: ./release-beta.sh <version> \"<notes>\""
echo ""
