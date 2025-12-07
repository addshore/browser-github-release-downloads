#!/bin/sh
# Find an available Opera binary and launch it with the unpacked extension loaded.
# Usage: ./scripts/open-opera.sh /path/to/extension-dir

EXT_DIR="$1"
URL="$2"

if [ -z "$EXT_DIR" ]; then
  echo "Usage: $0 /path/to/extension [url]"
  exit 2
fi

BIN_LIST="opera opera-stable opera-beta opera-developer"
FOUND=""
for b in $BIN_LIST; do
  if command -v "$b" >/dev/null 2>&1; then
    FOUND="$b"
    break
  fi
done

if [ -z "$FOUND" ]; then
  echo "No Opera binary found. Tried: $BIN_LIST"
  echo "Install Opera or set the path to your browser binary manually."
  exit 127
fi

echo "Launching $FOUND with extension: $EXT_DIR"
if [ -n "$URL" ]; then
  echo "Opening URL: $URL"
  "$FOUND" --disable-extensions-except="$EXT_DIR" --load-extension="$EXT_DIR" "$URL" &
else
  "$FOUND" --disable-extensions-except="$EXT_DIR" --load-extension="$EXT_DIR" &
fi
