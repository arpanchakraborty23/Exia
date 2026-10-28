#!/usr/bin/env bash
# ==============================================================================
# Exia Unified Compilation Dispatcher
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_help() {
    cat << EOF
Usage: ./scripts/compile.sh [TARGET] [OPTIONS]

Unified compilation dispatcher for Exia client applications.

Targets:
  desktop            Compile Windows Desktop Application (Tauri 2)
  android            Compile Android Application (Capacitor)
  web                Compile Web Application static export (Next.js)
  all                Compile both Desktop and Android applications

Examples:
  ./scripts/compile.sh desktop --release
  ./scripts/compile.sh android --debug
  ./scripts/compile.sh web
  ./scripts/compile.sh all
EOF
}

TARGET="$1"
if [ -z "$TARGET" ] || [[ "$TARGET" == "-h" ]] || [[ "$TARGET" == "--help" ]]; then
    print_help
    exit 0
fi
shift

case "$TARGET" in
    desktop)
        exec "$SCRIPT_DIR/desktop.sh" "$@"
        ;;
    android)
        exec "$SCRIPT_DIR/android.sh" "$@"
        ;;
    web)
        ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
        cd "$ROOT_DIR/ui/web"
        PKG="npm"
        if command -v pnpm >/dev/null 2>&1; then
            PKG="pnpm"
        fi
        echo "==> Building Exia Web static export..."
        $PKG run build
        ;;
    all)
        echo "==> Building all Exia client targets..."
        "$SCRIPT_DIR/desktop.sh" "$@"
        "$SCRIPT_DIR/android.sh" "$@"
        ;;
    *)
        echo "Unknown target: $TARGET"
        print_help
        exit 1
        ;;
esac
