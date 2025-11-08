#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="dist"

COMMON_FILES=(
  "background.js"
  "content.js"
  "whitelist.js"
  "options.html"
  "options.js"
  "icon16.png"
  "icon48.png"
  "icon128.png"
  "popup.html",
  "popup.js",
  "README.md"
  "LICENSE"
)

copy_if_exists() {
  local src="$1"
  local dst="$2"
  if [[ -e "$src" ]]; then
    mkdir -p "$(dirname "$dst")"
    cp -R "$src" "$dst"
  fi
}

copy_common() {
  local target_dir="$1"
  for f in "${COMMON_FILES[@]}"; do
    copy_if_exists "$f" "$target_dir/$f"
  done
}

detect_version() {
  local mf="manifest.chrome.json"
  if [[ -f "$mf" ]]; then
    local v
    v=$(grep -oE '"version"\s*:\s*"[^"]+"' "$mf" | head -n1 | sed -E 's/.*"version"\s*:\s*"([^"]+)".*/\1/')
    [[ -n "${v:-}" ]] && echo "$v" && return 0
  fi
  echo "0.0.0"
}

zip_dir() {
  local src_dir="$1"
  local zip_path="$2"
  ( cd "$src_dir" && zip -qr "../$zip_path" . )
}

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

VERSION="$(detect_version)"
echo "Versión detectada: $VERSION"

# Chrome
echo "Empaquetando Chrome..."
CHROME_DIR="$DIST_DIR/chrome"
mkdir -p "$CHROME_DIR"
copy_common "$CHROME_DIR"
cp manifest.chrome.json "$CHROME_DIR/manifest.json"
zip_dir "$CHROME_DIR" "antiphishing-peru-chrome-v$VERSION.zip"

# Firefox
echo "Empaquetando Firefox..."
FIREFOX_DIR="$DIST_DIR/firefox"
mkdir -p "$FIREFOX_DIR"
copy_common "$FIREFOX_DIR"
cp manifest.firefox.json "$FIREFOX_DIR/manifest.json"
zip_dir "$FIREFOX_DIR" "antiphishing-peru-firefox-v$VERSION.zip"

# Safari (fuente para Xcode)
echo "Empaquetando Safari (src para Xcode)..."
SAFARI_DIR="$DIST_DIR/safari-src"
mkdir -p "$SAFARI_DIR"
copy_common "$SAFARI_DIR"
cp manifest.safari.json "$SAFARI_DIR/manifest.json"
zip_dir "$SAFARI_DIR" "antiphishing-peru-safari-src-v$VERSION.zip"

echo "✅ Listo:"
echo " - dist/antiphishing-peru-chrome-v$VERSION.zip"
echo " - dist/antiphishing-peru-firefox-v$VERSION.zip"
echo " - dist/antiphishing-peru-safari-src-v$VERSION.zip"

cat <<'TIP'

Para Safari:
1) Descomprime el ZIP safari-src
2) Ejecuta en macOS:
   xcrun safari-web-extension-converter RUTA/DE/CARPETA \
     --project-location ./SafariProject \
     --app-name "Anti-Phishing Perú" \
     --force
3) Abre en Xcode, firma y ejecuta en macOS/iOS.

TIP