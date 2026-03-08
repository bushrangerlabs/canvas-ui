#!/bin/bash
# Canvas UI Build Script
# Builds HACS version and updates www folder

set -e

echo "================================================"
echo "  Canvas UI Build (HACS)"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -d "canvas-ui-react" ]; then
    echo "❌ Error: Run this from /home/spetchal/Code/canvas-ui-hacs/"
    exit 1
fi

# Build HACS version
echo "📦 Building HACS version..."
cd canvas-ui-react
npm run build:hacs
cd ..

# Update frontend folder inside custom component
echo "🔄 Updating custom_components/canvas_ui/frontend folder..."
rm -rf custom_components/canvas_ui/frontend
cp -r canvas-ui-react/dist-hacs custom_components/canvas_ui/frontend

echo ""
echo "================================================"
echo "  ✅ Build Complete!"
echo "================================================"
echo ""
echo "Built files are in: custom_components/canvas_ui/frontend/"
echo ""
echo "Next steps:"
echo "  • Run ./deploy.sh to deploy to HA server"
echo "  • Or commit and push to GitHub for HACS install"
echo ""
