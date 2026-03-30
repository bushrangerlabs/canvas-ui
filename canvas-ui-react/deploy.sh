#!/bin/bash
# Build script for Canvas UI React (HACS version)

echo "🔨 Building React app (HACS)..."
npm run build:hacs

if [ $? -eq 0 ]; then
    echo "✅ Build complete! Output in dist-hacs/"
else
    echo "❌ Build failed"
    exit 1
fi
