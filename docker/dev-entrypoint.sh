#!/bin/sh
set -eu

RESET="\033[0m"
RED="\033[31m"
GREEN="\033[32m"
WHITE="\033[37m"
YELLOW="\033[33m"

info() {
  printf "${WHITE}[docker] %s${RESET}\n" "$1"
}

success() {
  printf "${GREEN}[docker] %s${RESET}\n" "$1"
}

warn() {
  printf "${YELLOW}[docker] %s${RESET}\n" "$1"
}

fail() {
  printf "${RED}[docker] %s${RESET}\n" "$1"
}

LOCK_FILE="/app/package-lock.json"
LOCK_HASH_FILE="/app/node_modules/.package-lock.hash"

if [ ! -f "$LOCK_FILE" ]; then
  fail "package-lock.json was not found at $LOCK_FILE"
  exit 1
fi

CURRENT_HASH="$(sha256sum "$LOCK_FILE" | awk '{print $1}')"

info "Preparing Node workspace dependencies"

if [ ! -d /app/node_modules/.bin ]; then
  warn "node_modules is missing; running npm ci"
  npm ci --include=dev --no-audit --no-fund || {
    fail "npm ci failed"
    exit 1
  }
  echo "$CURRENT_HASH" > "$LOCK_HASH_FILE"
  success "Dependencies installed"
elif [ ! -f "$LOCK_HASH_FILE" ]; then
  warn "Dependency hash is missing; refreshing npm dependencies"
  npm ci --include=dev --no-audit --no-fund || {
    fail "npm ci failed"
    exit 1
  }
  echo "$CURRENT_HASH" > "$LOCK_HASH_FILE"
  success "Dependencies refreshed"
elif [ "$(cat "$LOCK_HASH_FILE")" != "$CURRENT_HASH" ]; then
  warn "package-lock.json changed; refreshing npm dependencies"
  npm ci --include=dev --no-audit --no-fund || {
    fail "npm ci failed"
    exit 1
  }
  echo "$CURRENT_HASH" > "$LOCK_HASH_FILE"
  success "Dependencies refreshed"
else
  success "Dependencies are up to date"
fi

info "Running command: $*"

exec "$@"