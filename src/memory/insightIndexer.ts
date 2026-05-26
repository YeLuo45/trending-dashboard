import type { InsightIndex } from './types';

const TAG_DECAY_FACTOR = 0.95;
const MAX_INSIGHT_WEIGHT = 1.0;
const MIN_INSIGHT_WEIGHT = 0.01;

export function updateInsight(
  currentIndex: InsightIndex,
  tag: string,
  increment: number = 0.1
): InsightIndex {
  const currentWeight = currentIndex.tags[tag] ?? 0;
  const newWeight = Math.min(MAX_INSIGHT_WEIGHT, currentWeight + increment);

  return {
    tags: { ...currentIndex.tags, [tag]: newWeight },
    lastUpdate: new Date().toISOString(),
  };
}

export function decayInsights(index: InsightIndex): InsightIndex {
  const decayedTags: Record<string, number> = {};

  for (const [tag, weight] of Object.entries(index.tags)) {
    const decayed = weight * TAG_DECAY_FACTOR;
    if (decayed >= MIN_INSIGHT_WEIGHT) {
      decayedTags[tag] = decayed;
    }
  }

  return {
    tags: decayedTags,
    lastUpdate: new Date().toISOString(),
  };
}

export function getTopInsights(index: InsightIndex, limit: number = 5): string[] {
  return Object.entries(index.tags)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([tag]) => tag);
}