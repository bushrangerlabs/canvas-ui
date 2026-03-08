#!/bin/bash

# Canvas UI Focus Switcher
# Usage: ./switch.sh [widget-inspector|binding-system|minimal]

FOCUS=$1
FOCUS_DIR=".github/focus"
TARGET=".github/copilot-instructions.md"

# Validate input
if [ -z "$FOCUS" ]; then
  echo "❌ Usage: ./switch.sh [widget-inspector|binding-system|minimal]"
  exit 1
fi

# Check if focus file exists
FOCUS_FILE="$FOCUS_DIR/${FOCUS}.md"
if [ ! -f "$FOCUS_FILE" ]; then
  echo "❌ Focus file not found: $FOCUS_FILE"
  echo ""
  echo "Available focus modes:"
  ls -1 $FOCUS_DIR/*.md | xargs -n 1 basename | sed 's/.md$//'
  exit 1
fi

# Backup current copilot-instructions.md (if exists and different)
if [ -f "$TARGET" ]; then
  BACKUP_DIR=".github/focus/backups"
  mkdir -p "$BACKUP_DIR"
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  cp "$TARGET" "$BACKUP_DIR/copilot-instructions-${TIMESTAMP}.md"
  echo "📦 Backed up current instructions to: $BACKUP_DIR/copilot-instructions-${TIMESTAMP}.md"
fi

# Copy focus file to copilot-instructions.md
cp "$FOCUS_FILE" "$TARGET"

echo "✅ Switched to: $FOCUS"
echo "📄 Active file: $TARGET"
echo ""
echo "Focus modes available:"
echo "  widget-inspector  - Widget inspector standards & property management"
echo "  binding-system    - Advanced binding system & expression evaluation"
echo "  minimal          - Minimal core reference (base for custom focus)"
echo ""
echo "To revert: ./switch.sh minimal"
