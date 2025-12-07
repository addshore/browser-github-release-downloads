#!/bin/sh
# Find an available Firefox binary and launch it with the unpacked extension loaded.
# Usage: ./scripts/open-firefox.sh /path/to/extension-dir

EXT_DIR="$1"
URL="$2"

if [ -z "$EXT_DIR" ]; then
  echo "Usage: $0 /path/to/extension [url]"
  exit 2
fi

BIN_LIST="firefox firefox-esr firefox-developer-edition firefox-nightly"
FOUND=""
for b in $BIN_LIST; do
  if command -v "$b" >/dev/null 2>&1; then
    FOUND="$b"
    break
  fi
done

if [ -z "$FOUND" ]; then
  echo "No Firefox binary found. Tried: $BIN_LIST"
  echo "Install Firefox or set the path to your browser binary manually."
  exit 127
fi

echo "Launching $FOUND with extension (Manifest V3 enabled): $EXT_DIR"

# Create temporary profile directory for Manifest V3 support
TEMP_PROFILE=$(mktemp -d)

# Create user.js to enable Manifest V3 service workers
cat > "$TEMP_PROFILE/user.js" << 'EOF'
// Enable Manifest V3 service workers (experimental)
user_pref("extensions.manifestV3.enabled", true);
user_pref("extensions.backgroundServiceWorker.enabled", true);
user_pref("dom.serviceWorkers.enabled", true);
user_pref("dom.serviceWorkers.testing.enabled", true);
EOF

echo "Created temporary profile with Manifest V3 support at: $TEMP_PROFILE"

# Firefox requires web-ext for loading unpacked extensions in development
if command -v web-ext >/dev/null 2>&1; then
  echo "Using web-ext to run extension with Manifest V3 support"
  if [ -n "$URL" ]; then
    web-ext run --source-dir="$EXT_DIR" --firefox="$FOUND" --firefox-profile="$TEMP_PROFILE" --start-url="$URL" &
  else
    web-ext run --source-dir="$EXT_DIR" --firefox="$FOUND" --firefox-profile="$TEMP_PROFILE" &
  fi
else
  echo "web-ext not found. Installing web-ext globally..."
  echo "Please run: npm install -g web-ext"
  echo "Then try again."
  exit 1
fi
