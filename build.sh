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

# Update www folder
echo "🔄 Updating www/canvas-ui folder..."
rm -rf www/canvas-ui
cp -r canvas-ui-react/dist-hacs www/canvas-ui

echo ""
echo "================================================"
echo "  ✅ Build Complete!"
echo "================================================"
echo ""
echo "Built files are in: www/canvas-ui/"
echo ""
echo "Next steps:"
echo "  • Run ./deploy.sh to deploy to HA server"
echo "  • Or commit and push to GitHub"
echo ""
