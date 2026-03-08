#!/bin/bash
# Quick deploy script for Canvas UI React to Home Assistant

echo "🔨 Building React app..."
npm run build

if [ $? -eq 0 ]; then
    echo "📦 Deploying to Home Assistant..."
    sshpass -p 'AWpoP6Rx@wQ7jK' scp -r dist/* root@192.168.1.103:/config/www/canvas-ui-react/
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployed successfully!"
        echo "🌐 View at: http://192.168.1.103:8123/local/canvas-ui-react/"
    else
        echo "❌ Deployment failed"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi
