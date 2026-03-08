#!/bin/bash
# Canvas UI Development Setup
# Installs dependencies and prepares dev environment

set -e

echo "================================================"
echo "  Canvas UI Development Setup"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -d "canvas-ui-react" ]; then
    echo "❌ Error: Run this from /home/spetchal/Code/canvas-ui-hacs/"
    exit 1
fi

# Install npm dependencies
echo "📦 Installing npm dependencies..."
cd canvas-ui-react

if [ -d "node_modules" ]; then
    echo "  → node_modules already exists, skipping..."
else
    npm install
fi

echo ""
echo "================================================"
echo "  ✅ Setup Complete!"
echo "================================================"
echo ""
echo "Development commands:"
echo "  • npm run dev      - Start development server"
echo "  • npm run build    - Build for local testing"
echo "  • npm run build:hacs - Build for HACS/GitHub"
echo ""
echo "Or use the helper scripts:"
echo "  • ./build.sh       - Build HACS version"
echo "  • ./deploy.sh      - Build and deploy to HA"
echo ""
