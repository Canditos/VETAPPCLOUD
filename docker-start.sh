#!/bin/sh
set -e

export TZ=Europe/Lisbon
echo "Starting Next.js in TZ=$TZ..."
exec node server.js
