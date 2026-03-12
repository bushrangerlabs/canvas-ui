#!/bin/bash
# Canvas UI Release Script
# Usage: ./release.sh <version> [release_notes]
# Example: ./release.sh 0.7.0 "Add new widget, fix bug"
#
# What this does:
#   1. Bumps manifest.json version
#   2. Runs build:hacs
#   3. Zips custom_components/canvas_ui/ (includes built frontend)
#   4. Commits version bump + tags + pushes
#   5. Creates GitHub release with zip attached
#   6. Cleans up local zip

set -e

VERSION="${1}"
NOTES="${2:-}"

if [ -z "$VERSION" ]; then
  echo "Usage: ./release.sh <version> [\"release notes\"]"
  echo "Example: ./release.sh 0.7.0 \"Add new widget, fix crashes\""
  exit 1
fi

TAG="v${VERSION}"
ZIP_NAME="canvas_ui.zip"

# Check credentials
TOKEN=$(cat ~/.git-credentials 2>/dev/null | grep github | sed 's|https://bushrangerlabs:\(.*\)@github.com|\1|')
if [ -z "$TOKEN" ]; then
  echo "❌ No GitHub token found in ~/.git-credentials"
  exit 1
fi

REMOTE="https://bushrangerlabs:${TOKEN}@github.com/bushrangerlabs/canvas-ui.git"

echo "================================================"
echo "  Canvas UI Release ${TAG}"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -d "canvas-ui-react" ]; then
  echo "❌ Error: Run this from /home/spetchal/Code/canvas-ui-hacs/"
  exit 1
fi

# 1. Bump manifest.json version
echo "📝 Bumping manifest.json to ${VERSION}..."
python3 -c "
import json
with open('custom_components/canvas_ui/manifest.json') as f:
    m = json.load(f)
m['version'] = '${VERSION}'
with open('custom_components/canvas_ui/manifest.json', 'w') as f:
    json.dump(m, f, indent=2)
    f.write('\n')
"

# 2. Build
echo "📦 Building HACS version..."
./build.sh

# 3. Create zip (content_in_root: true — integration files at zip root, not inside canvas_ui/)
echo "🗜️  Creating ${ZIP_NAME}..."
rm -f "${ZIP_NAME}"
cd custom_components/canvas_ui
zip -r "../../${ZIP_NAME}" . -x "*/__pycache__/*" -x "*/.DS_Store" > /dev/null
cd ../..
ZIP_SIZE=$(du -sh "${ZIP_NAME}" | cut -f1)
echo "   → ${ZIP_SIZE}"

# 4. Commit, tag, push
echo "🔖 Committing and tagging ${TAG}..."
git add -A  # frontend/ is in .gitignore so it won't be staged
git diff --cached --quiet && echo "   (nothing new to commit)" || git commit -m "chore: release ${TAG}"
git tag "${TAG}" 2>/dev/null && echo "   Tagged ${TAG}" || echo "   Tag ${TAG} already exists — reusing"
git push "${REMOTE}" main
git push "${REMOTE}" "${TAG}" 2>/dev/null || git push --force "${REMOTE}" "${TAG}"

# 5. Create GitHub release (delete old one first if it exists)
echo "🚀 Creating GitHub release ${TAG}..."
python3 - <<PYEOF
import urllib.request, urllib.error, json, sys

token = '${TOKEN}'
tag = '${TAG}'
version = '${VERSION}'
notes = '''${NOTES}'''
zip_name = '${ZIP_NAME}'

headers_json = {'Authorization': f'token {token}', 'Content-Type': 'application/json'}
base = 'https://api.github.com/repos/bushrangerlabs/canvas-ui'

# Delete existing release for this tag if present
try:
    req = urllib.request.Request(f'{base}/releases/tags/{tag}', headers={'Authorization': f'token {token}'})
    with urllib.request.urlopen(req) as r:
        existing = json.loads(r.read())
    del_req = urllib.request.Request(f"{base}/releases/{existing['id']}", method='DELETE',
                                     headers={'Authorization': f'token {token}'})
    urllib.request.urlopen(del_req)
    print(f'   Deleted old release for {tag}')
except urllib.error.HTTPError:
    pass

# Build body
if notes.strip():
    body = notes.strip()
else:
    body = f'Release {tag}'

# Create release
payload = json.dumps({'tag_name': tag, 'name': tag, 'body': body,
                      'draft': False, 'prerelease': False}).encode()
req = urllib.request.Request(f'{base}/releases', data=payload,
                             headers={'Authorization': f'token {token}', 'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as r:
    release = json.loads(r.read())

release_id = release['id']
upload_url = f'https://uploads.github.com/repos/bushrangerlabs/canvas-ui/releases/{release_id}/assets?name={zip_name}'

# Upload zip
with open(zip_name, 'rb') as f:
    data = f.read()
req = urllib.request.Request(upload_url, data=data, method='POST',
                             headers={'Authorization': f'token {token}',
                                      'Content-Type': 'application/zip'})
with urllib.request.urlopen(req) as r:
    asset = json.loads(r.read())

print(f'   Release: {release["html_url"]}')
print(f'   Asset:   {asset["browser_download_url"]} ({asset["size"] // 1024} KB)')
PYEOF

# 6. Clean up local zip
rm -f "${ZIP_NAME}"

echo ""
echo "================================================"
echo "  ✅ Release ${TAG} published!"
echo "================================================"
echo ""
echo "Users: HACS → Canvas UI → Update"
echo ""
