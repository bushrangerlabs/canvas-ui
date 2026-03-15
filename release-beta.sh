#!/bin/bash
# Canvas UI Beta Release Script
# Usage: ./release-beta.sh <version> [release_notes]
# Example: ./release-beta.sh 1.0.0-beta.2 "Testing new screensaver flow"
#
# Creates a GitHub PRE-RELEASE (not visible to regular HACS users).
# Only users with "Show beta versions" enabled in HACS will see it.
#
# Should be run from the 'dev' branch only.

set -e

VERSION="${1}"
NOTES="${2:-}"

if [ -z "$VERSION" ]; then
  echo "Usage: ./release-beta.sh <version> [\"release notes\"]"
  echo "Example: ./release-beta.sh 1.0.0-beta.2 \"Testing new feature\""
  exit 1
fi

# Guard: must be on dev branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "dev" ]; then
  echo "❌ Must be on the 'dev' branch to create a beta release."
  echo "   Currently on: $CURRENT_BRANCH"
  echo "   Run: git checkout dev"
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
echo "  Canvas UI BETA Release ${TAG}"
echo "  (pre-release — only visible with HACS beta on)"
echo "================================================"
echo ""

# Check directory
if [ ! -d "canvas-ui-react" ]; then
  echo "❌ Error: Run this from /home/spetchal/Code/canvas-ui-hacs/"
  exit 1
fi

# 1. Bump manifest.json version
echo "📝 Bumping manifest.json to ${VERSION}..."
python3 -c "
import json
for path in ['custom_components/canvas_ui/manifest.json', 'manifest.json']:
    with open(path) as f:
        m = json.load(f)
    m['version'] = '${VERSION}'
    with open(path, 'w') as f:
        json.dump(m, f, indent=2)
        f.write('\n')
"

# 2. Build
echo "📦 Building HACS version..."
./build.sh

# 3. Create zip
echo "🗜️  Creating ${ZIP_NAME}..."
rm -f "${ZIP_NAME}"
cd custom_components/canvas_ui
zip -r "../../${ZIP_NAME}" . -x "*/__pycache__/*" -x "*/.DS_Store" > /dev/null
cd ../..
ZIP_SIZE=$(du -sh "${ZIP_NAME}" | cut -f1)
echo "   → ${ZIP_SIZE}"

# 4. Commit, tag, push to dev
echo "🔖 Committing and tagging ${TAG}..."
git add -A
git diff --cached --quiet && echo "   (nothing new to commit)" || git commit -m "chore: beta release ${TAG}"
git tag "${TAG}" 2>/dev/null && echo "   Tagged ${TAG}" || echo "   Tag ${TAG} already exists — reusing"
git push "${REMOTE}" dev
git push "${REMOTE}" "${TAG}" 2>/dev/null || git push --force "${REMOTE}" "${TAG}"

# 5. Create GitHub pre-release
echo "🚀 Creating GitHub pre-release ${TAG}..."
python3 - <<PYEOF
import urllib.request, urllib.error, json

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

body = notes.strip() if notes.strip() else f'Beta release {tag}'

# Create pre-release (prerelease: True)
payload = json.dumps({'tag_name': tag, 'name': f'{tag} (beta)', 'body': body,
                      'draft': False, 'prerelease': True}).encode()
req = urllib.request.Request(f'{base}/releases', data=payload,
                             headers={'Authorization': f'token {token}', 'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as r:
    release = json.loads(r.read())

release_id = release['id']
upload_url = f'https://uploads.github.com/repos/bushrangerlabs/canvas-ui/releases/{release_id}/assets?name={zip_name}'

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
echo "  ✅ Beta release ${TAG} published!"
echo "================================================"
echo ""
echo "To test: HACS → Canvas UI → (enable beta) → Update"
echo "When ready to ship: merge dev → main, run ./release.sh ${VERSION%%-*}"
echo ""
