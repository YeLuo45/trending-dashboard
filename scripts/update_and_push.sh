#!/bin/bash
# trending-dashboard data update + push to master
# Cron script (no_agent=True) for hybrid pipeline.
#
# This replaces the GitHub Actions `fetch-trending.yml` schedule that died on 2026-06-06.
# Primary path: this script fetches trending data and pushes master directly.
# Fallback: the .github/workflows/fetch-trending.yml still exists for manual dispatch.

set -e

PROJECT_DIR="/home/hermes/projects/trending-dashboard"
DATA_DIR="${PROJECT_DIR}/public/data"
HISTORY_DIR="${DATA_DIR}/history"
SCRIPT="${PROJECT_DIR}/scripts/fetch_trending_local.py"
LOG_DIR="/home/hermes/.hermes/cron/output/trending-dashboard-push"
LOG_FILE="${LOG_DIR}/$(date +%Y-%m-%d_%H%M%S).log"

mkdir -p "${LOG_DIR}"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "=== trending-dashboard-push started at $(date -Iseconds) ==="
echo "Project: ${PROJECT_DIR}"

cd "${PROJECT_DIR}"

# 1. Pull latest master (avoid "behind remote" on push)
echo "--- Step 1: git fetch + pull ---"
if git fetch origin master 2>&1 | tail -5; then
    BEHIND=$(git rev-list --count HEAD..origin/master 2>/dev/null || echo 0)
    echo "Local is ${BEHIND} commits behind origin/master"
    if [ "${BEHIND:-0}" -gt 0 ]; then
        echo "Pulling latest master..."
        git pull --rebase --autostash origin master 2>&1 | tail -10 || {
            echo "::warn:: git pull failed (may be due to WSL network). Continuing with local state."
        }
    fi
else
    echo "::warn:: git fetch failed (network issue). Will push local state directly."
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