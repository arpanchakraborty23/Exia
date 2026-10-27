#!/usr/bin/env bash
# ==============================================================================
# Exia Desktop .exe Builder Script (uv-powered)
# ==============================================================================
set -e

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
RELEASE_DIR="$ROOT_DIR/release"
BUILD_DIR="$ROOT_DIR/build"

echo "=================================================="
echo "==> Building Exia Windows Desktop Executable (.exe)"
echo "=================================================="

# Detect uv package manager
if command -v uv >/dev/null 2>&1; then
    UV_CMD="uv"
else
    echo "Error: 'uv' package manager is not installed in PATH."
    echo "Install uv via: powershell -c \"irm https://astral.sh/uv/install.ps1 | iex\""
    exit 1
fi

echo "Using package manager: $($UV_CMD --version 2>&1)"

# 1. Sync dependencies with uv (downloads prebuilt binary wheels for Python 3.12, no C++ compiler required)
echo "Synchronizing desktop dependencies with uv..."
cd "$BACKEND_DIR"
$UV_CMD sync

# 2. Always sync the latest frontend static export into backend/dist
echo "Syncing frontend assets into backend/dist..."
FRONTEND_SRC=""
if [ -f "$FRONTEND_DIR/out/index.html" ]; then
    FRONTEND_SRC="$FRONTEND_DIR/out"
elif [ -f "$FRONTEND_DIR/dist/index.html" ]; then
    FRONTEND_SRC="$FRONTEND_DIR/dist"
fi

if [ -n "$FRONTEND_SRC" ]; then
    # Remove stale build and copy fresh
    rm -rf "$BACKEND_DIR/dist"
    mkdir -p "$BACKEND_DIR/dist"
    cp -r "$FRONTEND_SRC/"* "$BACKEND_DIR/dist/"
    echo "Copied $FRONTEND_SRC -> $BACKEND_DIR/dist"
else
    if [ ! -f "$BACKEND_DIR/dist/index.html" ]; then
        echo "WARNING: No frontend build found in frontend/out or frontend/dist."
        echo "         Run 'cd frontend && pnpm build' first."
        exit 1
    fi
    echo "Using existing backend/dist (no fresh frontend build found)."
fi

# 3. Run PyInstaller via uv
echo "Running PyInstaller via uv..."
mkdir -p "$RELEASE_DIR"
cd "$BACKEND_DIR"

$UV_CMD run pyinstaller \
    --clean \
    --noconfirm \
    --distpath "$RELEASE_DIR" \
    --workpath "$BUILD_DIR" \
    exia.spec

if [ -f "$RELEASE_DIR/Exia.exe" ]; then
    echo "=================================================="
    echo "🎉 Success! Desktop executable built successfully:"
    echo "   --> $RELEASE_DIR/Exia.exe"
    echo "Double-click Exia.exe to launch native desktop app."
    echo "=================================================="
else
    echo "Error: Exia.exe was not created."
    exit 1
fi
