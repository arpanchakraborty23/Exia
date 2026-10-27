#!/usr/bin/env bash
# ==============================================================================
# Exia Desktop .exe Builder Script
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

# Detect python binary
if command -v python >/dev/null 2>&1; then
    PY_BIN="python"
elif command -v python3 >/dev/null 2>&1; then
    PY_BIN="python3"
elif command -v py >/dev/null 2>&1; then
    PY_BIN="py"
else
    echo "Error: Python is not installed or not in PATH."
    exit 1
fi

echo "Using Python: $($PY_BIN --version 2>&1)"

# Check PyInstaller & pywebview prerequisites
echo "Checking build prerequisites..."
$PY_BIN -c "import PyInstaller" 2>/dev/null || {
    echo "PyInstaller not found. Installing pyinstaller..."
    $PY_BIN -m pip install pyinstaller
}

$PY_BIN -c "import webview" 2>/dev/null || {
    echo "pywebview not found. Installing pywebview..."
    $PY_BIN -m pip install pywebview
}

# Verify / sync frontend dist
echo "Verifying frontend build assets in backend/dist..."
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

# Run PyInstaller
echo "Running PyInstaller..."
mkdir -p "$RELEASE_DIR"
cd "$BACKEND_DIR"

$PY_BIN -m PyInstaller \
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
