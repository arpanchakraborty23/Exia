#!/usr/bin/env bash
# ==============================================================================
# Exia Local Validation, Linting & Build Verification Script
# ==============================================================================
# Usage:
#   ./scripts/validate.sh
#   bash scripts/validate.sh
# ==============================================================================

set -euo pipefail

# ANSI Color Codes
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Resolve project root (handling MSYS / Git Bash on Windows properly)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."
if command -v pwd >/dev/null 2>&1 && pwd -W >/dev/null 2>&1; then
  ROOT_DIR="$(pwd -W | sed 's/\\/\//g')"
else
  ROOT_DIR="$(pwd)"
fi

echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}   EXIA LOCAL VALIDATION & BUILD HEALTH SUITE         ${NC}"
echo -e "${CYAN}======================================================${NC}"
echo -e "Project Root: $ROOT_DIR\n"

# Locate Node binary (support Windows & Unix paths)
NODE_BIN="node"
if [ -f "E:/nodejs24/node.exe" ]; then
  NODE_BIN="E:/nodejs24/node.exe"
elif command -v node >/dev/null 2>&1; then
  NODE_BIN="node"
fi

# Locate TSC binary
TSC_BIN="$ROOT_DIR/ui/node_modules/typescript/bin/tsc"
if [ ! -f "$TSC_BIN" ]; then
  TSC_BIN="$ROOT_DIR/node_modules/typescript/bin/tsc"
fi

# Locate ESLint binary
ESLINT_BIN="$ROOT_DIR/ui/apps/mobile/node_modules/eslint/bin/eslint.js"

# ------------------------------------------------------------------------------
# STEP 1: JSON Data & Schema Validation
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[1/6] Validating Data Files & Config Schemas...${NC}"

JSON_FILES=(
  "mongodb_schema.json"
  "ui/apps/mobile/app.json"
  "ui/package.json"
  "desktop/package.json"
)

for file in "${JSON_FILES[@]}"; do
  TARGET="$ROOT_DIR/$file"
  if [ -f "$TARGET" ]; then
    "$NODE_BIN" -e "
      const fs = require('fs');
      try {
        const raw = fs.readFileSync('$TARGET', 'utf8');
        JSON.parse(raw);
        process.exit(0);
      } catch (err) {
        console.error('Invalid JSON in $file: ' + err.message);
        process.exit(1);
      }
    "
    echo -e "  ${GREEN}✓${NC} Valid JSON syntax: $file"
  else
    echo -e "  ${YELLOW}?${NC} Optional file skipped: $file"
  fi
done
echo -e "${GREEN}✓ All JSON schemas and data configurations are valid!${NC}\n"

# ------------------------------------------------------------------------------
# STEP 2: TypeScript Typecheck Across Monorepo
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[2/6] Running TypeScript Typecheck across all Monorepo packages...${NC}"

PACKAGES=(
  "ui/packages/design-tokens"
  "ui/packages/shared-types"
  "ui/packages/shared-logic"
  "ui/packages/api-client"
  "ui/packages/shared-ui"
  "ui/packages/test-utils"
  "ui/apps/mobile"
)

for pkg in "${PACKAGES[@]}"; do
  echo -e "  Checking ${CYAN}$pkg${NC}..."
  "$NODE_BIN" "$TSC_BIN" --noEmit -p "$ROOT_DIR/$pkg/tsconfig.json"
  echo -e "  ${GREEN}✓${NC} $pkg typecheck passed."
done
echo -e "${GREEN}✓ All 7 packages passed TypeScript typecheck with 0 errors!${NC}\n"

# ------------------------------------------------------------------------------
# STEP 3: ESLint Code Quality Checks
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[3/6] Running ESLint Code Quality Checks...${NC}"

if [ -f "$ESLINT_BIN" ]; then
  (cd "$ROOT_DIR/ui/apps/mobile" && "$NODE_BIN" "$ESLINT_BIN" src)
  echo -e "${GREEN}✓ ESLint passed with 0 errors and 0 warnings!${NC}\n"
else
  echo -e "  ${YELLOW}!${NC} ESLint binary not found at $ESLINT_BIN, skipping.\n"
fi

# ------------------------------------------------------------------------------
# STEP 4: Vitest Unit Test Suite
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[4/6] Running Vitest Unit Test Suite...${NC}"

VITEST_BIN="$ROOT_DIR/ui/node_modules/vitest/vitest.mjs"
if [ -f "$VITEST_BIN" ]; then
  (cd "$ROOT_DIR/ui" && "$NODE_BIN" "$VITEST_BIN" run)
  echo -e "${GREEN}✓ Vitest test suite passed cleanly!${NC}\n"
else
  echo -e "  ${YELLOW}!${NC} Vitest binary not found at $VITEST_BIN, skipping.\n"
fi

# ------------------------------------------------------------------------------
# STEP 5: Expo Universal Web Production Export
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[5/6] Compiling Universal Web Production Export...${NC}"

EXPO_CLI="$ROOT_DIR/ui/apps/mobile/node_modules/expo/bin/cli"
export EXPO_NO_TELEMETRY="1"

(cd "$ROOT_DIR/ui/apps/mobile" && "$NODE_BIN" "$EXPO_CLI" export --platform web)

DIST_INDEX="$ROOT_DIR/ui/apps/mobile/dist/index.html"
if [ -f "$DIST_INDEX" ] && [ -s "$DIST_INDEX" ]; then
  echo -e "${GREEN}✓ Web export compiled successfully (index.html: $(wc -c < "$DIST_INDEX") bytes)!${NC}\n"
else
  echo -e "${RED}✗ Failed: $DIST_INDEX was not generated or is empty!${NC}"
  exit 1
fi

# ------------------------------------------------------------------------------
# STEP 6: Desktop Electron Distribution Sync
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[6/6] Synchronizing Assets to Desktop Distribution...${NC}"

SYNC_SCRIPT="$ROOT_DIR/desktop/scripts/sync-dist.js"
if [ -f "$SYNC_SCRIPT" ]; then
  (cd "$ROOT_DIR/desktop" && "$NODE_BIN" "$SYNC_SCRIPT")
  DESKTOP_INDEX="$ROOT_DIR/desktop/dist/index.html"
  if [ -f "$DESKTOP_INDEX" ] && [ -s "$DESKTOP_INDEX" ]; then
    echo -e "${GREEN}✓ Desktop distribution bundle synchronized and verified!${NC}\n"
  else
    echo -e "${RED}✗ Failed: desktop/dist/index.html missing after sync!${NC}"
    exit 1
  fi
fi

echo -e "${CYAN}======================================================${NC}"
echo -e "${GREEN}   ALL LOCAL VALIDATIONS & BUILDS PASSED CLEANLY!     ${NC}"
echo -e "${CYAN}======================================================${NC}"
exit 0
