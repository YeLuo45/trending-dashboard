#!/bin/bash
# trending-dashboard staleness check
# Cron script (no_agent=True). Runs every 12h to verify the page data is fresh.
# Alerts to local log if lastUpdated > 24h ago.

set -e

DATA_FILE="https://yeluo45.github.io/trending-dashboard/data/trending.json"
LOG_DIR="/home/hermes/.hermes/cron/output/trending-dashboard-staleness"
LOG_FILE="${LOG_DIR}/$(date +%Y-%m-%d_%H%M%S).log"
STALE_HOURS=24

mkdir -p "${LOG_DIR}"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "=== staleness check started at $(date -Iseconds) ==="

# Fetch trending.json via gh-pages CDN
RESP=$(curl -sk --max-time 15 -L "${DATA_FILE}" 2>&1) || {
    echo "::error:: failed to fetch ${DATA_FILE} (curl rc=$?)"
    exit 1
}

# Extract generatedAt field (ISO 8601 UTC)
GENERATED=$(echo "${RESP}" | python3 -c "import json, sys; print(json.load(sys.stdin).get('generatedAt', ''))" 2>/dev/null) || {
    echo "::error:: failed to parse JSON"
    exit 1
}

if [ -z "${GENERATED}" ]; then
    echo "::error:: generatedAt field missing in JSON"
    exit 1
fi

# Compute hours since generatedAt
HOURS_AGO=$(python3 -c "
from datetime import datetime, timezone
gen = datetime.fromisoformat('${GENERATED}'.replace('Z', '+00:00'))
now = datetime.now(timezone.utc)
print(round((now - gen).total_seconds() / 3600, 1))
" 2>/dev/null) || {
    echo "::error:: failed to compute staleness"
    exit 1
}

echo "generatedAt: ${GENERATED}"
echo "hours ago:   ${HOURS_AGO}"

# Compare with threshold
IS_STALE=$(python3 -c "print(1 if ${HOURS_AGO} > ${STALE_HOURS} else 0)")

if [ "${IS_STALE}" = "1" ]; then
    echo "::warn:: STALE: data is ${HOURS_AGO}h old (threshold ${STALE_HOURS}h)"
    echo "Action items:"
    echo "  1. Check GitHub Actions: https://github.com/YeLuo45/trending-dashboard/actions"
    echo "  2. Check local cron: hermes cron list | grep trending"
    echo "  3. Manual run: cd /home/hermes/projects/trending-dashboard && bash scripts/update_and_push.sh"
    exit 2  # Non-zero exit so cron job marks failure (visible in cron list)
fi

echo "✓ fresh: data is ${HOURS_AGO}h old (under ${STALE_HOURS}h threshold)"
exit 0