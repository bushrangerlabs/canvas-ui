#!/bin/bash
# Canvas UI Deployment Script
# Builds and deploys Canvas UI to Home Assistant server
#
# Configure your HA credentials in a .env file (never committed to git):
#   echo "HA_HOST=192.168.1.x" >> .env
#   echo "HA_USER=root" >> .env
#   echo "HA_PASS=yourpassword" >> .env

set -e

# Load credentials from .env if present
if [ -f .env ]; then
    # shellcheck disable=SC1091
    source .env
fi

# Fallback prompts if not set
HA_HOST="${HA_HOST:-}"
HA_USER="${HA_USER:-root}"
HA_PASS="${HA_PASS:-}"

if [ -z "$HA_HOST" ]; then
    read -rp "HA server IP: " HA_HOST
fi
if [ -z "$HA_PASS" ]; then
    read -rsp "HA root password: " HA_PASS
    echo
fi

echo "================================================"
echo "  Canvas UI Deployment"
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

echo "✅ Build complete!"
echo ""
echo "📤 Deploying to Home Assistant..."

# Deploy frontend files
echo "  → Deploying frontend to /config/www/canvas-ui/"
sshpass -p "$HA_PASS" scp -r www/canvas-ui/* ${HA_USER}@${HA_HOST}:/config/www/canvas-ui/

# Deploy custom component
echo "  → Deploying integration to /config/custom_components/canvas_ui/"
sshpass -p "$HA_PASS" scp -r custom_components/canvas_ui/* ${HA_USER}@${HA_HOST}:/config/custom_components/canvas_ui/

# Clear cache
echo "  → Clearing browser cache..."
sshpass -p "$HA_PASS" ssh ${HA_USER}@${HA_HOST} "touch /config/www/canvas-ui/index.html"

echo ""
echo "================================================"
echo "  ✅ Deployment Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Hard refresh browser (Ctrl+Shift+F5)"
echo "  2. Or restart Home Assistant to reload integration"
echo ""
