#!/bin/sh
set -e

echo "=== Starting Reservamos ==="
echo "PWD: $(pwd)"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

echo "=== Checking dist/ ==="
ls -la dist/ 2>/dev/null || echo "No dist/ dir"

echo "=== Checking dist/server/ ==="
ls -la dist/server/ 2>/dev/null || echo "No dist/server/ dir"

echo "=== Checking dist/server/api/ ==="
ls -la dist/server/api/ 2>/dev/null || echo "No dist/server/api/ dir"

echo "=== Checking boot.js ==="
if [ -f "dist/server/api/boot.js" ]; then
    echo "boot.js exists!"
    head -5 dist/server/api/boot.js
else
    echo "boot.js NOT FOUND! Running build..."
    node build-backend.mjs
fi

echo "=== Starting server ==="
exec node dist/server/api/boot.js
