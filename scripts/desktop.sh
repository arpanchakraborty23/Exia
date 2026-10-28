#!/usr/bin/env bash
# ==============================================================================
# Exia Desktop Builder & Deployment Script
# 
# Builds the standalone size-optimized Windows executable (Exia.exe) and the
# full Windows Setup Wizard installer (Exia-Setup-1.0.0.exe).
#
# Usage:
#   ./scripts/desktop.sh [OPTIONS]
#
# Options:
#   --build-frontend    Rebuild Next.js frontend export before packaging
#   --clean             Clean previous build caches and artifacts before building
#   --skip-sync         Skip uv package manager synchronization
#   --help, -h          Show this help message
# ==============================================================================
set -e

# Resolve absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/ui/web"
RELEASE_DIR="$BACKEND_DIR/release"
ROOT_RELEASE_DIR="$ROOT_DIR/release"

# Flags
BUILD_FRONTEND=false
CLEAN_BUILD=false
SKIP_SYNC=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --build-frontend) BUILD_FRONTEND=true ;;
        --clean) CLEAN_BUILD=true ;;
        --skip-sync) SKIP_SYNC=true ;;
        -h|--help)
            echo "Exia Desktop Deployment Script"
            echo ""
            echo "Usage: ./scripts/desktop.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --build-frontend    Rebuild frontend static export before packaging"
            echo "  --clean             Clean previous build directories (build/, release/)"
            echo "  --skip-sync         Skip 'uv sync' dependency check"
            echo "  -h, --help          Show this message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Run with --help for valid options."
            exit 1
            ;;
    esac
    shift
done

echo "=================================================================="
echo "==> EXIA DESKTOP APPLICATION PACKAGING & DEPLOYMENT PIPELINE"
echo "=================================================================="

# 1. Clean previous build artifacts if requested
if [ "$CLEAN_BUILD" = true ]; then
    echo "[*] Cleaning old build caches and release directories..."
    rm -rf "$BACKEND_DIR/build"
    rm -rf "$BACKEND_DIR/release"
    rm -rf "$ROOT_RELEASE_DIR"
    echo "[OK] Cleaned build artifacts."
fi

# 2. Detect package manager and Python runtime
PYTHON_CMD=""
if command -v uv >/dev/null 2>&1; then
    UV_CMD="uv"
    echo "[OK] Using Astral uv: $($UV_CMD --version 2>&1)"
    if [ "$SKIP_SYNC" = false ]; then
        echo "[*] Synchronizing backend dependencies with uv..."
        (cd "$BACKEND_DIR" && $UV_CMD sync)
    fi
    PYTHON_CMD="$UV_CMD run python"
else
    # Fallback to local virtual environment
    if [ -f "$BACKEND_DIR/.venv/Scripts/python.exe" ]; then
        PYTHON_CMD="$BACKEND_DIR/.venv/Scripts/python.exe"
    elif [ -f "$BACKEND_DIR/.venv/bin/python" ]; then
        PYTHON_CMD="$BACKEND_DIR/.venv/bin/python"
    elif command -v python >/dev/null 2>&1; then
        PYTHON_CMD="python"
    else
        echo "[X] Error: Python runtime or 'uv' not found in PATH or backend/.venv."
        echo "    Please install uv (https://astral.sh/uv) or set up backend virtualenv."
        exit 1
    fi
    echo "[OK] Using Python: $PYTHON_CMD"
fi

# 3. Build frontend if requested or missing
FRONTEND_OUT="$FRONTEND_DIR/out"
if [ "$BUILD_FRONTEND" = true ] || ([ ! -f "$FRONTEND_OUT/index.html" ] && [ ! -f "$BACKEND_DIR/dist/index.html" ]); then
    echo "[*] Building frontend static export..."
    cd "$FRONTEND_DIR"
    if command -v pnpm >/dev/null 2>&1; then
        pnpm run build
    elif command -v npm >/dev/null 2>&1; then
        npm run build
    else
        echo "[X] Error: Neither pnpm nor npm found to build frontend."
        exit 1
    fi
    echo "[OK] Frontend static export completed."
fi

# 4. Sync frontend static files to backend/dist (and prune unused backups)
echo "[*] Syncing frontend static distribution into backend/dist..."
FRONTEND_SRC=""
if [ -f "$FRONTEND_DIR/out/index.html" ]; then
    FRONTEND_SRC="$FRONTEND_DIR/out"
elif [ -f "$FRONTEND_DIR/dist/index.html" ]; then
    FRONTEND_SRC="$FRONTEND_DIR/dist"
fi

if [ -n "$FRONTEND_SRC" ]; then
    rm -rf "$BACKEND_DIR/dist"
    mkdir -p "$BACKEND_DIR/dist"
    cp -r "$FRONTEND_SRC/"* "$BACKEND_DIR/dist/"
    # Prune unneeded backup files and old binaries from webroot
    rm -f "$BACKEND_DIR/dist/images/*-backup.*"
    rm -f "$BACKEND_DIR/dist/Exia.exe"
    echo "[OK] Frontend synced: $FRONTEND_SRC -> $BACKEND_DIR/dist"
else
    if [ ! -f "$BACKEND_DIR/dist/index.html" ]; then
        echo "[X] Error: No frontend build found in frontend/out or backend/dist."
        echo "    Run './scripts/desktop.sh --build-frontend' to compile it."
        exit 1
    fi
    echo "[OK] Using existing backend/dist webroot."
fi

# 5. Run optimized PyInstaller packaging and Inno Setup compiler
echo ""
echo "[*] Running release builder (PyInstaller exclusions + Inno Setup compiler)..."
cd "$BACKEND_DIR"
$PYTHON_CMD build_release.py

# 6. Ensure root release/ directory exists and mirror artifacts
mkdir -p "$ROOT_RELEASE_DIR"
if [ -f "$RELEASE_DIR/Exia.exe" ]; then
    cp -f "$RELEASE_DIR/Exia.exe" "$ROOT_RELEASE_DIR/Exia.exe"
fi
if [ -f "$RELEASE_DIR/Exia-Setup.exe" ]; then
    cp -f "$RELEASE_DIR/Exia-Setup.exe" "$ROOT_RELEASE_DIR/Exia-Setup.exe"
fi
if [ -f "$RELEASE_DIR/Exia-Setup-1.0.0.exe" ]; then
    cp -f "$RELEASE_DIR/Exia-Setup-1.0.0.exe" "$ROOT_RELEASE_DIR/Exia-Setup-1.0.0.exe"
fi

# 7. Print deployment summary
echo ""
echo "=================================================================="
echo "==> DEPLOYMENT ARTIFACTS READY"
echo "=================================================================="
if [ -f "$ROOT_RELEASE_DIR/Exia.exe" ]; then
    EXE_SIZE=$(du -h "$ROOT_RELEASE_DIR/Exia.exe" | cut -f1)
    echo "  [Standalone Exe] : $ROOT_RELEASE_DIR/Exia.exe ($EXE_SIZE)"
fi

if [ -f "$ROOT_RELEASE_DIR/Exia-Setup.exe" ]; then
    SETUP_SIZE=$(du -h "$ROOT_RELEASE_DIR/Exia-Setup.exe" | cut -f1)
    echo "  [Setup Wizard]   : $ROOT_RELEASE_DIR/Exia-Setup.exe ($SETUP_SIZE)"
elif [ -f "$ROOT_RELEASE_DIR/Exia-Setup-1.0.0.exe" ]; then
    SETUP_SIZE=$(du -h "$ROOT_RELEASE_DIR/Exia-Setup-1.0.0.exe" | cut -f1)
    echo "  [Setup Wizard]   : $ROOT_RELEASE_DIR/Exia-Setup-1.0.0.exe ($SETUP_SIZE)"
fi
echo "=================================================================="
