#!/usr/bin/env python3
"""
Fetch GitHub Trending data locally and write to public/data/ for the trending-dashboard.

Mirrors the logic in .github/workflows/fetch-trending.yml but runs locally so we can:
- Trigger from WSL cron without depending on GitHub Actions schedule
- Do local validation before commit/push
- Use the same retry/backoff/UA improvements already added to the workflow

Usage:
    python3 scripts/fetch_trending_local.py [--dry-run] [--data-dir DIR] [--no-history]

Output:
    public/data/trending.json   (combined: daily/weekly/monthly + stars_history + metadata)
    public/data/daily.json
    public/data/weekly.json
    public/data/monthly.json
    public/data/history/YYYY-MM-DD.json   (daily snapshot)
"""
import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone, timedelta

import requests
from bs4 import BeautifulSoup

DEFAULT_DATA_DIR = 'public/data'
HISTORY_DIR_NAME = 'history'
MAX_HISTORY_DAYS = 30

# Improved headers (matches the local workflow edits — better than origin/master's Mac Safari UA)
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

_gh_token_env = os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN')
GITHUB_API_TOKEN = _gh_token_env


def fetch_trending_page(since='daily'):
    """Fetch a GitHub Trending page with retry + exponential backoff."""
    url = f'https://github.com/trending?since={since}'
    for attempt in range(3):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            if resp.status_code == 200:
                return resp.text
            print(f'Attempt {attempt+1} failed: HTTP {resp.status_code}', file=sys.stderr)
        except Exception as e:
            print(f'Attempt {attempt+1} failed: {e}', file=sys.stderr)
        if attempt < 2:
            time.sleep(5 * (attempt + 1))  # 5s, 10s backoff
    return None


def parse_trending_html(html):
    """Parse GitHub Trending HTML to extract repo metadata.

    Improvements over the origin workflow version:
    - Extract owner/repo from href (avoids 'owner / repo' extra spaces from get_text)
    - Fallback to colorized-lang aria-label when itemprop='programmingLanguage' is missing
    """
    soup = BeautifulSoup(html, 'html.parser')
    articles = soup.select('article.Box-row')
    projects = []
    for art in articles:
        h2 = art.select_one('h2')
        if not h2:
            continue
        link = h2.select_one('a')
        if not link:
            continue
        # ✅ Fix: extract owner/repo from href (avoids 'owner / repo' extra spaces from get_text)
        _href_attr = link.get('href')
        if isinstance(_href_attr, list):
            _href_attr = _href_attr[0] if _href_attr else ''
        href_raw = _href_attr or ''
        href = href_raw.strip('/') if href_raw else ''
        if not href or '/' not in href or '?' in href:
            continue
        name = href
        repo_link = f'https://github.com/{name}'
        desc_el = art.select_one('p')
        description = desc_el.get_text(strip=True) if desc_el else ''
        # ✅ Prefer itemprop="programmingLanguage"; fallback to colorized-lang aria-label
        lang_el = art.select_one('[itemprop="programmingLanguage"]')
        language = lang_el.get_text(strip=True) if lang_el else ''
        if not language:
            lang_img = art.select_one('span[aria-label]')
            if lang_img:
                _aria_attr = lang_img.get('aria-label')
                if isinstance(_aria_attr, list):
                    _aria_attr = _aria_attr[0] if _aria_attr else ''
                _aria = _aria_attr or ''
                language = _aria.split(' ')[0] if _aria else ''
        star_span = art.select_one('a[href$="/stargazers"]')
        stars_text = star_span.get_text(strip=True).replace(',', '') if star_span else '0'
        fork_span = art.select_one('a[href$="/forks"]')
        forks_text = fork_span.get_text(strip=True).replace(',', '') if fork_span else '0'
        projects.append({
            'name': name,
            'link': repo_link,
            'description': description,
            'language': language,
            'totalStars': stars_text,
            'totalForks': forks_text,
        })
    return projects


def load_history(data_dir):
    """Load existing trending.json to preserve stars_history across runs."""
    path = os.path.join(data_dir, 'trending.json')
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return {}


def save_daily_snapshot(daily_projects, history_dir):
    """Save today's daily snapshot to history/YYYY-MM-DD.json."""
    os.makedirs(history_dir, exist_ok=True)
    today_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    history_file = os.path.join(history_dir, f'{today_str}.json')
    payload = {
        'daily': daily_projects,
        'generatedAt': datetime.now(timezone.utc).isoformat(),
    }
    with open(history_file, 'w') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    # Prune old history beyond MAX_HISTORY_DAYS
    cutoff = (datetime.now(timezone.utc) - timedelta(days=MAX_HISTORY_DAYS)).strftime('%Y-%m-%d')
    for fname in os.listdir(history_dir):
        if fname.endswith('.json') and fname < cutoff:
            os.remove(os.path.join(history_dir, fname))
    return history_file


def compute_growth(existing_data, projects, days):
    """Compute star growth over the past N days using stars_history."""
    today_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    cutoff_str = (datetime.now(timezone.utc) - timedelta(days=days)).strftime('%Y-%m-%d')
    stars_history = existing_data.get('stars_history', {})
    result = []
    for p in projects:
        name = p['name']
        current_stars = int(p['totalStars'])
        historical = 0
        repo_history = stars_history.get(name, {})
        if repo_history:
            dates = sorted(repo_history.keys())
            for d in dates:
                if cutoff_str <= d <= today_str:
                    historical = repo_history[d]
                    break
        growth = current_stars - historical
        growth_str = f'+{growth}' if growth >= 0 else str(growth)
        result.append({**p, 'growth': growth_str, 'growthValue': growth})
    return result


def rank_by_growth(projects, top_n=None):
    """Rank projects by growth value descending."""
    sorted_proj = sorted(projects, key=lambda x: x['growthValue'], reverse=True)
    for i, p in enumerate(sorted_proj, 1):
        p['rank'] = i
    if top_n:
        sorted_proj = sorted_proj[:top_n]
    return sorted_proj


def fetch_realtime_stars(projects):
    """Optionally enrich star/fork counts with realtime GitHub API data."""
    if not GITHUB_API_TOKEN:
        return projects
    api_headers = {
        'Authorization': f'Bearer {GITHUB_API_TOKEN}',
        'Accept': 'application/vnd.github.v3+json',
    }
    updated = []
    for p in projects:
        try:
            path = p['link'].replace('https://github.com/', '')
            resp = requests.get(
                f'https://api.github.com/repos/{path}',
                headers=api_headers,
                timeout=10,
            )
            if resp.status_code == 200:
                d = resp.json()
                p['totalStars'] = str(d.get('stargazers_count', p['totalStars']))
                p['totalForks'] = str(d.get('forks_count', p.get('totalForks', '0')))
        except Exception:
            pass
        updated.append(p)
    return updated


def main():
    ap = argparse.ArgumentParser(description='Fetch GitHub Trending data locally.')
    ap.add_argument('--dry-run', action='store_true', help='Print summary but do not write files')
    ap.add_argument('--data-dir', default=DEFAULT_DATA_DIR, help=f'Output dir (default: {DEFAULT_DATA_DIR})')
    ap.add_argument('--no-history', action='store_true', help='Skip history snapshot saving')
    args = ap.parse_args()

    data_dir = args.data_dir
    history_dir = os.path.join(data_dir, HISTORY_DIR_NAME)

    # Fetch all three time windows
    html_daily = fetch_trending_page('daily')
    daily_raw = parse_trending_html(html_daily) if html_daily else []
    print(f'Daily: {len(daily_raw)} repos')

    html_weekly = fetch_trending_page('weekly')
    weekly_raw = parse_trending_html(html_weekly) if html_weekly else []
    print(f'Weekly: {len(weekly_raw)} repos')

    html_monthly = fetch_trending_page('monthly')
    monthly_raw = parse_trending_html(html_monthly) if html_monthly else []
    print(f'Monthly: {len(monthly_raw)} repos')

    if not daily_raw and not weekly_raw and not monthly_raw:
        print('ERROR: All trending pages failed', file=sys.stderr)
        sys.exit(1)

    # Enrich with realtime stars if token available
    daily_raw = fetch_realtime_stars(daily_raw)
    weekly_raw = fetch_realtime_stars(weekly_raw)
    monthly_raw = fetch_realtime_stars(monthly_raw)

    # Compute growth + rank
    existing = load_history(data_dir)
    daily_with_growth = compute_growth(existing, daily_raw, 1)
    weekly_with_growth = compute_growth(existing, weekly_raw, 7)
    monthly_with_growth = compute_growth(existing, monthly_raw, 30)

    daily_ranked = rank_by_growth(daily_with_growth, top_n=10)
    weekly_ranked = rank_by_growth(weekly_with_growth, top_n=20)
    monthly_ranked = rank_by_growth(monthly_with_growth, top_n=20)

    # Update stars_history
    today_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    stars_history = existing.get('stars_history', {})
    for p in daily_raw + weekly_raw + monthly_raw:
        name = p['name']
        if name not in stars_history:
            stars_history[name] = {}
        stars_history[name][today_str] = int(p['totalStars'])

    now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
    trending_data_weekly = {
        'projects': weekly_ranked,
        'lastUpdated': now_str,
    }
    trending_data_monthly = {
        'projects': monthly_ranked,
        'lastUpdated': now_str,
    }
    trending_data_daily = {
        'projects': daily_ranked,
        'lastUpdated': now_str,
    }

    trending_data = {
        'daily': daily_ranked,
        'weekly': weekly_ranked,
        'monthly': monthly_ranked,
        'stars_history': stars_history,
        'lastUpdated': now_str,
        'generatedAt': datetime.now(timezone.utc).isoformat(),
    }

    if args.dry_run:
        print(f'\n[DRY RUN] Would write to {data_dir}:')
        print(f'  trending.json  daily={len(daily_ranked)} weekly={len(weekly_ranked)} monthly={len(monthly_ranked)}')
        if daily_ranked:
            top = daily_ranked[0]
            print(f'  Top daily: {top["name"]} stars={top["totalStars"]} growth={top["growth"]}')
        if not args.no_history and daily_raw:
            print(f'  history/{today_str}.json  (daily snapshot)')
        return 0

    # Write outputs
    os.makedirs(data_dir, exist_ok=True)
    for fname, payload in [
        ('weekly.json', trending_data_weekly),
        ('monthly.json', trending_data_monthly),
        ('daily.json', trending_data_daily),
        ('trending.json', trending_data),
    ]:
        path = os.path.join(data_dir, fname)
        with open(path, 'w') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        print(f'Wrote {path}')

    if not args.no_history and daily_raw:
        hist_file = save_daily_snapshot(daily_raw, history_dir)
        print(f'Wrote {hist_file}')

    print(f'\nSummary: daily={len(daily_ranked)} weekly={len(weekly_ranked)} monthly={len(monthly_ranked)}')
    if daily_ranked:
        top = daily_ranked[0]
        print(f'Top daily: {top["name"]} stars={top["totalStars"]} growth={top["growth"]}')
    return 0


if __name__ == '__main__':
    sys.exit(main())