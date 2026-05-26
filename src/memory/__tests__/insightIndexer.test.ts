import { describe, it, expect } from 'vitest';
import { updateInsight, decayInsights, getTopInsights } from '../insightIndexer';
import type { InsightIndex } from '../types';

describe('insightIndexer', () => {
  describe('updateInsight', () => {
    it('should add new tag with increment weight', () => {
      const index: InsightIndex = { tags: {}, lastUpdate: '' };
      const result = updateInsight(index, 'TypeScript', 0.5);
      expect(result.tags['TypeScript']).toBe(0.5);
    });

    it('should increase existing tag weight', () => {
      const index: InsightIndex = { tags: { TypeScript: 0.3 }, lastUpdate: '' };
      const result = updateInsight(index, 'TypeScript', 0.2);
      expect(result.tags['TypeScript']).toBe(0.5);
    });

    it('should cap weight at MAX_INSIGHT_WEIGHT (1.0)', () => {
      const index: InsightIndex = { tags: { TypeScript: 0.9 }, lastUpdate: '' };
      const result = updateInsight(index, 'TypeScript', 0.2);
      expect(result.tags['TypeScript']).toBe(1.0);
    });

    it('should update lastUpdate timestamp', () => {
      const index: InsightIndex = { tags: {}, lastUpdate: '' };
      const before = new Date().toISOString();
      const result = updateInsight(index, 'TypeScript', 0.1);
      expect(result.lastUpdate).toBeTruthy();
      expect(new Date(result.lastUpdate).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime() - 1000);
    });

    it('should preserve other tags', () => {
      const index: InsightIndex = { tags: { Python: 0.5 }, lastUpdate: '' };
      const result = updateInsight(index, 'TypeScript', 0.3);
      expect(result.tags['Python']).toBe(0.5);
      expect(result.tags['TypeScript']).toBe(0.3);
    });
  });

  describe('decayInsights', () => {
    it('should apply decay factor to all tags', () => {
      const index: InsightIndex = { tags: { TypeScript: 1.0, Python: 0.5 }, lastUpdate: '' };
      const result = decayInsights(index);
      expect(result.tags['TypeScript']).toBe(0.95);
      expect(result.tags['Python']).toBe(0.475);
    });

    it('should remove tags below MIN_INSIGHT_WEIGHT (0.01)', () => {
      const index: InsightIndex = { tags: { TypeScript: 0.0095 }, lastUpdate: '' };
      const result = decayInsights(index);
      expect(result.tags['TypeScript']).toBeUndefined();
    });

    it('should keep tags above threshold', () => {
      const index: InsightIndex = { tags: { TypeScript: 0.5 }, lastUpdate: '' };
      const result = decayInsights(index);
      expect(result.tags['TypeScript']).toBe(0.475);
    });

    it('should update lastUpdate timestamp', () => {
      const index: InsightIndex = { tags: { TypeScript: 0.5 }, lastUpdate: '' };
      const result = decayInsights(index);
      expect(result.lastUpdate).toBeTruthy();
    });

    it('should handle empty tags', () => {
      const index: InsightIndex = { tags: {}, lastUpdate: '' };
      const result = decayInsights(index);
      expect(result.tags).toEqual({});
    });
  });

  describe('getTopInsights', () => {
    it('should return tags sorted by weight descending', () => {
      const index: InsightIndex = {
        tags: { TypeScript: 0.8, Python: 0.6, Rust: 0.9, Go: 0.4 },
        lastUpdate: '',
      };
      const result = getTopInsights(index);
      expect(result).toEqual(['Rust', 'TypeScript', 'Python', 'Go']);
    });

    it('should respect limit parameter', () => {
      const index: InsightIndex = {
        tags: { TypeScript: 0.8, Python: 0.6, Rust: 0.9 },
        lastUpdate: '',
      };
      const result = getTopInsights(index, 2);
      expect(result).toEqual(['Rust', 'TypeScript']);
    });

    it('should return empty array for empty tags', () => {
      const index: InsightIndex = { tags: {}, lastUpdate: '' };
      expect(getTopInsights(index)).toEqual([]);
    });

    it('should handle ties by keeping original order', () => {
      const index: InsightIndex = {
        tags: { TypeScript: 0.5, Python: 0.5, Rust: 0.5 },
        lastUpdate: '',
      };
      const result = getTopInsights(index, 2);
      expect(result.length).toBe(2);
      expect(result).toContain('TypeScript');
      expect(result).toContain('Python');
    });
  });
});