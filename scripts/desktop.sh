#!/usr/bin/env bash
# ==============================================================================
# Exia Windows Desktop (Tauri 2) Compilation & Packaging Pipeline
# ==============================================================================
set -e

# Resolve absolute repository paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$ROOT_DIR/ui/web"
WINDOWS_DIR="$ROOT_DIR/ui/windows"
TAURI_DIR="$WINDOWS_DIR/src-tauri"
RELEASE_DIR="$ROOT_DIR/release"

# Default build parameters
BUILD_MODE="release"
BUILD_WEB=true
CLEAN_BUILD=false

# Helper: print usage
print_help() {
    cat << EOF
Usage: ./scripts/desktop.sh [OPTIONS]

Compiles the Exia Windows Desktop Application (Tauri 2 + Next.js).

Options:
  --release          Build optimized release installer (default)
  --debug            Build in debug mode for development and testing
  --skip-web         Reuse existing ui/web/out static export without rebuilding
  --clean            Clean Tauri target cache and build artifacts before compiling
  -h, --help         Show this help message and exit

Examples:
  ./scripts/desktop.sh                    # Full release build
  ./scripts/desktop.sh --debug            # Fast debug compilation
  ./scripts/desktop.sh --skip-web         # Compile Tauri shell only
EOF
}

# Parse command line flags
while [[ $# -gt 0 ]]; do
    case "$1" in
        --release)
            BUILD_MODE="release"
            ;;
        --debug)
            BUILD_MODE="debug"
            ;;
        --skip-web)
            BUILD_WEB=false
            ;;
        --clean)
            CLEAN_BUILD=true
            ;;
        -h|--help)
            print_help
            exit 0
            ;;
        *)
            echo "[X] Error: Unknown option: $1"
            echo "    Run './scripts/desktop.sh --help' for usage."
            exit 1
            ;;
    esac
    shift
done

echo "=================================================================="
echo "==> EXIA WINDOWS DESKTOP (TAURI 2) COMPILATION PIPELINE"
echo "=================================================================="
echo "  Build Mode:  $BUILD_MODE"
echo "  Root Dir:    $ROOT_DIR"
echo "  Tauri Shell: $WINDOWS_DIR"
echo "=================================================================="

# 1. Clean previous build caches if requested
if [ "$CLEAN_BUILD" = true ]; then
    echo "[*] Cleaning build artifacts..."
    rm -rf "$TAURI_DIR/target"
    rm -rf "$WEB_DIR/out"
    rm -rf "$WEB_DIR/.next"
    echo "[OK] Cleaned previous build artifacts."
fi

# 2. Check Node.js and Package Manager
if ! command -v node >/dev/null 2>&1; then
    echo "[X] Error: Node.js is not installed or not in PATH."
    echo "    Please install Node.js >= 20 from https://nodejs.org/"
    exit 1
fi
echo "[OK] Node.js version: $(node --version)"

PKG_MANAGER="npm"
if command -v pnpm >/dev/null 2>&1; then
    PKG_MANAGER="pnpm"
fi
echo "[OK] Using package manager: $PKG_MANAGER"

# 3. Check Rust Toolchain
if ! command -v cargo >/dev/null 2>&1 || ! command -v rustc >/dev/null 2>&1; then
    echo "[X] Error: Rust toolchain (cargo/rustc) was not found in PATH."
    echo "    Tauri 2 requires the Rust toolchain with MSVC target on Windows."
    echo "    Install Rust from: https://rustup.rs/"
    exit 1
fi
echo "[OK] Rust compiler: $(rustc --version)"
echo "[OK] Cargo version: $(cargo --version)"

# 4. Build Web Frontend (Next.js Static Export -> ui/web/out)
if [ "$BUILD_WEB" = true ] || [ ! -f "$WEB_DIR/out/index.html" ]; then
    echo ""
    echo "[*] Building frontend static export (ui/web)..."
    cd "$WEB_DIR"

    if [ ! -d "node_modules" ]; then
        echo "[*] Installing web dependencies..."
        $PKG_MANAGER install
    fi

    $PKG_MANAGER run build

    if [ ! -f "$WEB_DIR/out/index.html" ]; then
        echo "[X] Error: Static export failed; ui/web/out/index.html not generated."
        exit 1
    fi
    echo "[OK] Frontend static export completed: ui/web/out"
else
    echo "[OK] Using existing frontend export: ui/web/out/index.html"
fi

# 5. Ensure Desktop Shell Dependencies (ui/windows)
cd "$WINDOWS_DIR"
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[*] Installing ui/windows dependencies..."
    $PKG_MANAGER install
fi

# 6. Execute Tauri Build
echo ""
echo "[*] Compiling Tauri 2 desktop application ($BUILD_MODE mode)..."
cd "$WINDOWS_DIR"

TAURI_CMD="npx --no-install @tauri-apps/cli build"
if [ "$BUILD_MODE" = "debug" ]; then
    TAURI_CMD="$TAURI_CMD --debug"
fi

$TAURI_CMD

# 7. Mirror and Report Build Artifacts
mkdir -p "$RELEASE_DIR"
echo ""
echo "=================================================================="
echo "==> PACKAGING & RELEASE SUMMARY"
echo "=================================================================="

# Check for NSIS bundle installer
NSIS_DIR="$TAURI_DIR/target/$BUILD_MODE/bundle/nsis"
FOUND_ARTIFACTS=false

if [ -d "$NSIS_DIR" ]; then
    for installer in "$NSIS_DIR"/*.exe; do
        if [ -f "$installer" ]; then
            filename="$(basename "$installer")"
            cp -f "$installer" "$RELEASE_DIR/$filename"
            size=$(du -h "$installer" 2>/dev/null | cut -f1 || ls -lh "$installer" | awk '{print $5}')
            echo "  [Installer] : $RELEASE_DIR/$filename ($size)"
            FOUND_ARTIFACTS=true
        fi
    done
fi

# Check for standalone binary executable
STANDALONE_EXE="$TAURI_DIR/target/$BUILD_MODE/Exia.exe"
if [ -f "$STANDALONE_EXE" ]; then
    cp -f "$STANDALONE_EXE" "$RELEASE_DIR/Exia.exe"
    size=$(du -h "$STANDALONE_EXE" 2>/dev/null | cut -f1 || ls -lh "$STANDALONE_EXE" | awk '{print $5}')
    echo "  [Binary]    : $RELEASE_DIR/Exia.exe ($size)"
    FOUND_ARTIFACTS=true
fi

if [ "$FOUND_ARTIFACTS" = true ]; then
    echo ""
    echo "[OK] Build artifacts successfully placed in: $RELEASE_DIR"
else
    echo "[WARN] Finished build. Artifact directory: $TAURI_DIR/target/$BUILD_MODE"
fi
echo "=================================================================="
