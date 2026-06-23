#!/bin/sh
# Container entrypoint for the nayra demo.
#
# 1. Apply migrations (the demo DB starts empty on every fresh `up`).
# 2. Seed the curated snapshot + reset object storage (db:reset).
# 3. Start Next.js. The hourly Ofelia cron re-runs `pnpm db:reset` against this
#    same container to wipe and reseed.
#
# Steps 1-2 are idempotent, so a container restart is safe.
set -e

# Postgres may still be starting even with depends_on; retry migrate a few times.
attempts=0
until pnpm db:migrate; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 10 ]; then
    echo "db:migrate failed after $attempts attempts, giving up." >&2
    exit 1
  fi
  echo "db:migrate failed (attempt $attempts), retrying in 3s..." >&2
  sleep 3
done

pnpm db:reset

exec pnpm start
