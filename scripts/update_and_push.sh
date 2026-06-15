#!/bin/bash
# trending-dashboard data update + push to master
# Cron script (no_agent=True) for hybrid pipeline.
#
# Primary path: GitHub Actions `fetch-trending.yml` schedule (every 6h UTC).
# Fallback path: this script runs every 6h local time, with a 30-min offset.
#
# Staleness gate (added 2026-06-15):
# - Step 0 checks if origin/master has a commit within HEALTHY_HOURS (= 6).
# - If healthy → exit 0 immediately (don't fight the Actions pipeline).
# - If stale → proceed to fetch + push, taking over as emergency fallback.
#
# This dual-cron pattern means:
# - Normal: Actions cron does the work; local cron sleeps (no-op).
# - Failure: Actions cron dies; local cron detects staleness and recovers.
# - Manual: `bash scripts/update_and_push.sh --force` skips staleness gate.

set -e

FORCE=0
if [ "${1:-}" = "--force" ]; then
    FORCE=1
fi

PROJECT_DIR="/home/hermes/projects/trending-dashboard"
DATA_DIR="${PROJECT_DIR}/public/data"
HISTORY_DIR="${DATA_DIR}/history"
SCRIPT="${PROJECT_DIR}/scripts/fetch_trending_local.py"
LOG_DIR="/home/hermes/.hermes/cron/output/trending-dashboard-push"
LOG_FILE="${LOG_DIR}/$(date +%Y-%m-%d_%H%M%S).log"
HEALTHY_HOURS=6  # origin/master last commit must be within this window

mkdir -p "${LOG_DIR}"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "=== trending-dashboard-push started at $(date -Iseconds) ==="
echo "Project: ${PROJECT_DIR}"
echo "Force mode: ${FORCE}"

cd "${PROJECT_DIR}"

# Step 0: Staleness gate (skip if Actions pipeline is healthy)
echo "--- Step 0: staleness gate ---"
if git fetch origin master 2>&1 | tail -3; then
    LAST_COMMIT_TS=$(git log -1 --format=%ct origin/master 2>/dev/null || echo 0)
    NOW_TS=$(date +%s)
    if [ "${LAST_COMMIT_TS}" -gt 0 ]; then
        HOURS_SINCE=$(( (NOW_TS - LAST_COMMIT_TS) / 3600 ))
        LAST_SHA=$(git rev-parse --short origin/master)
        LAST_MSG=$(git log -1 --format=%s origin/master)
        echo "Latest origin/master: ${LAST_SHA} — \"${LAST_MSG}\" — ${HOURS_SINCE}h ago"

        if [ "${FORCE}" -eq 0 ] && [ "${HOURS_SINCE}" -lt "${HEALTHY_HOURS}" ]; then
            echo "✓ Pipeline healthy (<${HEALTHY_HOURS}h). Skipping (Actions cron is doing its job)."
            echo "  (use --force to bypass this gate)"
            exit 0
        fi

        if [ "${FORCE}" -eq 0 ]; then
            echo "::warn:: Pipeline STALE (${HOURS_SINCE}h > ${HEALTHY_HOURS}h threshold). Taking over..."
        fi
    else
        echo "::warn:: Could not read origin/master timestamp — proceeding with fetch"
    fi
else
    echo "::warn:: git fetch failed (network issue). Proceeding with local state."
fi

# 1. Sync local master with origin
echo "--- Step 1: sync with origin/master ---"
BEHIND=$(git rev-list --count HEAD..origin/master 2>/dev/null || echo 0)
echo "Local is ${BEHIND} commits behind origin/master"
if [ "${BEHIND:-0}" -gt 0 ]; then
    git pull --rebase --autostash origin master 2>&1 | tail -10 || {
        echo "::warn:: git pull failed. Continuing with local state."
    }
fi

# 2. Run fetch script
echo "--- Step 2: fetch trending data ---"
if python3 "${SCRIPT}" 2>&1; then
    echo "✓ fetch script succeeded"
else
    echo "::error:: fetch script failed (exit=$?)"
    exit 1
fi

# 3. Validate output (avoid pushing empty/partial data)
echo "--- Step 3: validate output ---"
TRENDING_SIZE=$(stat -c%s "${DATA_DIR}/trending.json" 2>/dev/null || echo 0)
echo "trending.json size: ${TRENDING_SIZE} bytes"
if [ "${TRENDING_SIZE}" -lt 1000 ]; then
    echo "::error:: trending.json suspiciously small (${TRENDING_SIZE} bytes) — refusing to push"
    exit 1
fi

# Sanity: at least daily/weekly/monthly should have items
DAILY_COUNT=$(python3 -c "import json; print(len(json.load(open('${DATA_DIR}/daily.json'))['projects']))" 2>/dev/null || echo 0)
WEEKLY_COUNT=$(python3 -c "import json; print(len(json.load(open('${DATA_DIR}/weekly.json'))['projects']))" 2>/dev/null || echo 0)
MONTHLY_COUNT=$(python3 -c "import json; print(len(json.load(open('${DATA_DIR}/monthly.json'))['projects']))" 2>/dev/null || echo 0)
echo "Counts: daily=${DAILY_COUNT} weekly=${WEEKLY_COUNT} monthly=${MONTHLY_COUNT}"
if [ "${DAILY_COUNT}" -lt 5 ] || [ "${WEEKLY_COUNT}" -lt 5 ] || [ "${MONTHLY_COUNT}" -lt 5 ]; then
    echo "::error:: one or more sections have too few items — refusing to push"
    exit 1
fi

# 4. Build vite to refresh dist/ (deploy workflow will redo this, but local build ensures dist/ matches)
echo "--- Step 4: npm run build (vite) ---"
if [ -d node_modules ]; then
    npx vite build 2>&1 | tail -20 || {
        echo "::warn:: vite build failed (will still try to push data files — deploy workflow will rebuild)"
    }
else
    echo "::warn:: node_modules not present, skipping build (deploy workflow will build)"
fi

# 5. Git commit + push
echo "--- Step 5: git commit + push ---"

# Configure git identity if missing
git config user.email 2>/dev/null || git config user.email "trending-bot@yeluo45.local"
git config user.name 2>/dev/null || git config user.name "trending-dashboard-bot"

# Stage data files only (not .codegraph/ or random untracked stuff)
git add public/data/
[ -d dist ] && git add dist/data/ 2>/dev/null || true

if git diff --cached --quiet; then
    echo "No changes to commit — data unchanged from last push"
    echo "=== trending-dashboard-push complete (no-op) ==="
    exit 0
fi

COMMIT_MSG="chore: auto-update trending data $(date +'%Y-%m-%d %H:%M')"
echo "Commit message: ${COMMIT_MSG}"
git commit -m "${COMMIT_MSG}" 2>&1 | tail -5

# Push with retry (WSL network often flaky)
echo "Pushing to origin/master..."
PUSH_OK=0
for attempt in 1 2 3; do
    if git push origin master 2>&1 | tail -10; then
        PUSH_OK=1
        echo "✓ push succeeded on attempt ${attempt}"
        break
    fi
    echo "::warn:: push attempt ${attempt}/3 failed, sleeping ${attempt}0s..."
    sleep $((attempt * 10))
done

if [ "${PUSH_OK}" -ne 1 ]; then
    echo "::error:: all push attempts failed — local commit is preserved, will retry next run"
    exit 1
fi

echo "=== trending-dashboard-push complete at $(date -Iseconds) ==="