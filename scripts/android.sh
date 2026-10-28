#!/usr/bin/env bash
# ==============================================================================
# Exia Android (Capacitor) Compilation & Packaging Pipeline
# ==============================================================================
set -e

# Resolve absolute repository paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$ROOT_DIR/ui/web"
ANDROID_DIR="$ROOT_DIR/ui/android"
NATIVE_ANDROID_DIR="$ANDROID_DIR/android"
RELEASE_DIR="$ROOT_DIR/release"

# Default build parameters
BUILD_TARGET="debug"
BUILD_WEB=true
SYNC_ONLY=false
OPEN_STUDIO=false
CLEAN_BUILD=false

# Helper: print usage
print_help() {
    cat << EOF
Usage: ./scripts/android.sh [OPTIONS]

Compiles the Exia Android Application (Capacitor + Next.js).

Options:
  --debug            Build debug APK via Gradle (default)
  --release          Build release APK via Gradle
  --aab              Build Android App Bundle (.aab) for Google Play
  --sync-only        Build web & sync Capacitor assets without running Gradle
  --open             Sync and launch project in Android Studio
  --skip-web         Reuse existing ui/web/out static export without rebuilding
  --clean            Clean previous build outputs and caches
  -h, --help         Show this help message and exit

Examples:
  ./scripts/android.sh                    # Full debug APK build
  ./scripts/android.sh --release          # Release APK build
  ./scripts/android.sh --sync-only        # Sync web changes to Android project
  ./scripts/android.sh --open             # Open in Android Studio
EOF
}

# Parse command line flags
while [[ $# -gt 0 ]]; do
    case "$1" in
        --debug)
            BUILD_TARGET="debug"
            ;;
        --release)
            BUILD_TARGET="release"
            ;;
        --aab)
            BUILD_TARGET="aab"
            ;;
        --sync-only)
            SYNC_ONLY=true
            ;;
        --open)
            OPEN_STUDIO=true
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
            echo "    Run './scripts/android.sh --help' for usage."
            exit 1
            ;;
    esac
    shift
done

echo "=================================================================="
echo "==> EXIA ANDROID (CAPACITOR) COMPILATION PIPELINE"
echo "=================================================================="
echo "  Target:      $BUILD_TARGET"
echo "  Root Dir:    $ROOT_DIR"
echo "  Android Dir: $ANDROID_DIR"
echo "=================================================================="

# 1. Clean previous build caches if requested
if [ "$CLEAN_BUILD" = true ]; then
    echo "[*] Cleaning build artifacts..."
    rm -rf "$ANDROID_DIR/www"
    if [ -d "$NATIVE_ANDROID_DIR/app/build" ]; then
        rm -rf "$NATIVE_ANDROID_DIR/app/build"
    fi
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

# 3. Build Web Frontend (Next.js Static Export -> ui/web/out)
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

# 4. Ensure Android Shell Dependencies (ui/android)
cd "$ANDROID_DIR"
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[*] Installing ui/android dependencies..."
    $PKG_MANAGER install
fi

# 5. Sync Web Distribution to Capacitor www/
echo ""
echo "[*] Syncing web assets to Capacitor webDir (ui/android/www)..."
node scripts/copy-web.mjs

# 6. Initialize / Sync Native Android Platform
echo ""
if [ ! -d "$NATIVE_ANDROID_DIR" ]; then
    echo "[*] Native Android project not found. Initializing with Capacitor..."
    npx cap add android
fi

echo "[*] Syncing Capacitor plugins and assets..."
npx cap sync android

# 7. Handle Android Studio launch
if [ "$OPEN_STUDIO" = true ]; then
    echo ""
    echo "[*] Launching project in Android Studio..."
    npx cap open android
    echo "[OK] Android Studio launched."
    exit 0
fi

# 8. Handle sync-only mode
if [ "$SYNC_ONLY" = true ]; then
    echo ""
    echo "[OK] Capacitor synchronization completed successfully."
    exit 0
fi

# 9. Check Java / JDK for Gradle Compilation
if ! command -v java >/dev/null 2>&1 && [ -z "$JAVA_HOME" ]; then
    echo ""
    echo "[WARN] Java/JDK was not found in PATH or JAVA_HOME."
    echo "       To compile the APK via command line, JDK 17+ is required."
    echo "       You can open and build in Android Studio with:"
    echo "         ./scripts/android.sh --open"
    exit 1
fi

# 10. Execute Gradle Build
echo ""
echo "[*] Compiling Android package with Gradle ($BUILD_TARGET)..."
cd "$NATIVE_ANDROID_DIR"

# Resolve Gradle executable (Windows bat vs Unix sh)
GRADLE_BIN="./gradlew"
if [ -f "./gradlew.bat" ] && [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* || "$OSTYPE" == "win32"* ]]; then
    GRADLE_BIN="./gradlew.bat"
elif [ -f "./gradlew" ]; then
    chmod +x ./gradlew
    GRADLE_BIN="./gradlew"
elif command -v gradle >/dev/null 2>&1; then
    GRADLE_BIN="gradle"
fi

case "$BUILD_TARGET" in
    debug)
        $GRADLE_BIN assembleDebug
        OUTPUT_SRC="$NATIVE_ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
        DEST_NAME="Exia-debug.apk"
        ;;
    release)
        $GRADLE_BIN assembleRelease
        OUTPUT_SRC="$NATIVE_ANDROID_DIR/app/build/outputs/apk/release/app-release-unsigned.apk"
        if [ ! -f "$OUTPUT_SRC" ]; then
            OUTPUT_SRC="$NATIVE_ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
        fi
        DEST_NAME="Exia-release.apk"
        ;;
    aab)
        $GRADLE_BIN bundleRelease
        OUTPUT_SRC="$NATIVE_ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
        DEST_NAME="Exia-release.aab"
        ;;
esac

# 11. Mirror and Report Build Artifacts
mkdir -p "$RELEASE_DIR"
echo ""
echo "=================================================================="
echo "==> PACKAGING & RELEASE SUMMARY"
echo "=================================================================="

if [ -f "$OUTPUT_SRC" ]; then
    cp -f "$OUTPUT_SRC" "$RELEASE_DIR/$DEST_NAME"
    size=$(du -h "$OUTPUT_SRC" 2>/dev/null | cut -f1 || ls -lh "$OUTPUT_SRC" | awk '{print $5}')
    echo "  [Package]   : $RELEASE_DIR/$DEST_NAME ($size)"
    echo "  [Location]  : $OUTPUT_SRC"
    echo ""
    echo "[OK] Build artifact successfully placed in: $RELEASE_DIR"
else
    echo "[WARN] Gradle compilation completed, but artifact not found at expected path:"
    echo "       $OUTPUT_SRC"
    echo "       Check build outputs in: $NATIVE_ANDROID_DIR/app/build/outputs/"
fi
echo "=================================================================="
