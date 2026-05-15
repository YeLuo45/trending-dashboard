import type { TrendingData } from '../types';

const CACHE_KEY = 'trending_cache';
const CACHE_VERSION = 1;

interface CacheEntry {
  version: number;
  data: TrendingData;
  timestamp: number;
}

export function saveTrendingCache(data: TrendingData): void {
  try {
    const entry: CacheEntry = {
      version: CACHE_VERSION,
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (e) {
    console.warn('Failed to save trending cache:', e);
  }
}

export function loadTrendingCache(): TrendingData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function getCacheAge(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    return Date.now() - entry.timestamp;
  } catch {
    return null;
  }
}

export function clearTrendingCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
