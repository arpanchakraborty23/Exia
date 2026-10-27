#!/usr/bin/env bash
# ==============================================================================
# Exia Vercel Deployment Script
# ==============================================================================
set -e

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "=================================================="
echo "==> Deploying Exia to Vercel via Vercel CLI"
echo "=================================================="

# Detect Vercel CLI
if command -v vercel >/dev/null 2>&1; then
    VERCEL_CMD="vercel"
elif command -v npx >/dev/null 2>&1; then
    echo "Using npx vercel..."
    VERCEL_CMD="npx --yes vercel"
else
    echo "Error: Neither 'vercel' nor 'npx' was found in PATH."
    echo "Please install Vercel CLI via: npm install -g vercel"
    exit 1
fi

# Verify frontend assets
echo "Checking frontend assets in backend/dist..."
if [ ! -d "$BACKEND_DIR/dist" ]; then
    if [ -d "$FRONTEND_DIR/dist" ]; then
        echo "Copying $FRONTEND_DIR/dist -> $BACKEND_DIR/dist"
        cp -r "$FRONTEND_DIR/dist" "$BACKEND_DIR/dist"
    else
        echo "Building frontend..."
        cd "$FRONTEND_DIR"
        if command -v pnpm >/dev/null 2>&1; then
            pnpm run build
        elif command -v npm >/dev/null 2>&1; then
            npm run build
        else
            echo "Error: Neither pnpm nor npm found to build frontend."
            exit 1
        fi
        cp -r "$FRONTEND_DIR/dist" "$BACKEND_DIR/dist"
    fi
fi

# Verify requirements.txt
if [ ! -f "$BACKEND_DIR/requirements.txt" ]; then
    echo "Error: $BACKEND_DIR/requirements.txt is missing."
    exit 1
fi

# Run Vercel CLI deploy
echo "Deploying from backend/..."
cd "$BACKEND_DIR"

$VERCEL_CMD "$@"

echo "=================================================="
echo "✓ Vercel command completed."
echo "=================================================="
