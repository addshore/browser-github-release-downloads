#!/bin/sh
# Find an available Chrome/Chromium binary and launch it with the unpacked extension loaded.
# Usage: ./scripts/open-chrome.sh /path/to/extension-dir

EXT_DIR="$1"
URL="$2"

if [ -z "$EXT_DIR" ]; then
  echo "Usage: $0 /path/to/extension [url]"
  exit 2
fi

BIN_LIST="google-chrome google-chrome-stable chromium chromium-browser chrome"
FOUND=""
for b in $BIN_LIST; do
  if command -v "$b" >/dev/null 2>&1; then
    FOUND="$b"
    break
  fi
done

if [ -z "$FOUND" ]; then
  echo "No Chrome/Chromium binary found. Tried: $BIN_LIST"
  echo "Install Chrome/Chromium or set the path to your browser binary manually."
  exit 127
fi

echo "Launching $FOUND with extension: $EXT_DIR"
if [ -n "$URL" ]; then
  echo "Opening URL: $URL"
  "$FOUND" --disable-extensions-except="$EXT_DIR" --load-extension="$EXT_DIR" "$URL" &
else
  "$FOUND" --disable-extensions-except="$EXT_DIR" --load-extension="$EXT_DIR" &
fi
