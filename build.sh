#!/usr/bin/env bash
set -euo pipefail

# Config
APP_NAME="anti-phishing-pe"
DIST_DIR="dist"
SRC_FILES=(
  "manifest.chrome.json"
  "manifest.firefox.json"
  "manifest.safari.json"
  "background.js"
  "content.js"
  "popup.js"
  "options.js"
  "popup.html"
  "options.html"
  "icon16.png"
  "icon48.png"
  "icon128.png"
  # Incluye whitelist.js si lo usas:
  "whitelist.js"
  # Docs opcionales
  "README.md"
  "LICENSE"
)

# Limpieza
rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}"

# Helper para copiar archivos a un destino
copy_files() {
  local target="$1"
  mkdir -p "${target}"
  for f in "${SRC_FILES[@]}"; do
    if [[ -f "$f" ]]; then
      cp -f "$f" "${target}/"
    fi
  done
}

# CHROME
CHROME_DIR="${DIST_DIR}/chrome"
copy_files "${CHROME_DIR}"
mv "${CHROME_DIR}/manifest.chrome.json" "${CHROME_DIR}/manifest.json"
rm -f "${CHROME_DIR}/manifest.firefox.json" "${CHROME_DIR}/manifest.safari.json"
( cd "${CHROME_DIR}" && zip -qr "../chrome.zip" . )

# FIREFOX
FIREFOX_DIR="${DIST_DIR}/firefox"
copy_files "${FIREFOX_DIR}"
mv "${FIREFOX_DIR}/manifest.firefox.json" "${FIREFOX_DIR}/manifest.json"
rm -f "${FIREFOX_DIR}/manifest.chrome.json" "${FIREFOX_DIR}/manifest.safari.json"
( cd "${FIREFOX_DIR}" && zip -qr "../firefox.zip" . )

# SAFARI (fuente para convertir en Xcode)
SAFARI_DIR="${DIST_DIR}/safari-src"
copy_files "${SAFARI_DIR}"
mv "${SAFARI_DIR}/manifest.safari.json" "${SAFARI_DIR}/manifest.json"
rm -f "${SAFARI_DIR}/manifest.chrome.json" "${SAFARI_DIR}/manifest.firefox.json"
( cd "${SAFARI_DIR}" && zip -qr "../safari-src.zip" . )

echo "Hecho:"
echo " - ${DIST_DIR}/chrome.zip"
echo " - ${DIST_DIR}/firefox.zip"
echo " - ${DIST_DIR}/safari-src.zip"

echo
echo "Para Safari, convierte el paquete con Xcode:"
echo "xcrun safari-web-extension-converter ${PWD}/${DIST_DIR}/safari-src --project-location ${PWD}/${DIST_DIR}/SafariProj --project-name AntiPhishingPE --bundle-identifier me.bvislao.antiphishing"