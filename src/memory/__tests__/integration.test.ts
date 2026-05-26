import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMemory } from '../useMemory';
import { memoryStore } from '../memoryStore';
import { shouldCrystallize, findMatchingSkill } from '../skillCrystallizer';
import type { QueryPattern, Recommendation } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Memory Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('End-to-end workflow', () => {
    it('should support complete memory lifecycle', () => {
      const { result } = renderHook(() => useMemory());

      // L0: Set user preference
      act(() => {
        result.current.setMetaRule('language', 'TypeScript');
      });
      expect(result.current.getMetaRules()[0].value).toBe('TypeScript');

      // L1: Add insights based on browsing
      act(() => {
        result.current.addInsight('React', 0.8);
        result.current.addInsight('Frontend', 0.6);
      });
      const index = result.current.getInsightIndex();
      expect(index.tags['React']).toBe(0.8);
      expect(index.tags['Frontend']).toBe(0.6);

      // L2: Add favorite project
      act(() => {
        result.current.addGlobalFact({
          type: 'favorite',
          key: 'facebook/react',
          data: { stars: 220000 },
        });
      });
      expect(result.current.getGlobalFacts()).toHaveLength(1);

      // L3: Crystallize skill from repeated behavior
      act(() => {
        result.current.crystallizeSkill(
          { language: 'TypeScript', topic: 'React' },
          { projectName: 'facebook/react', reason: 'Based on your favorites', score: 0.95 }
        );
      });
      expect(result.current.getSkills()).toHaveLength(1);

      // L4: Archive session
      act(() => {
        result.current.archiveSession({
          date: '2024-01-15',
          queries: [{ language: 'TypeScript' }],
          views: ['facebook/react', 'vuejs/vue'],
          starsAdded: 3,
        });
      });
      expect(result.current.getArchivedSessions()).toHaveLength(1);
    });

    it('should NOT auto-crystallize for different pattern when usageCount < threshold', () => {
      const { result } = renderHook(() => useMemory());

      // Simulate repeated queries
      const patterns: QueryPattern[] = [
        { language: 'TypeScript', sortKey: 'stars' },
        { language: 'TypeScript', sortKey: 'stars' },
        { language: 'TypeScript', sortKey: 'stars' },
      ];

      // First pattern - no existing skills: start tracking => true (crystallize to begin)
      let shouldCrys = shouldCrystallize(patterns[0], result.current.getSkills());
      expect(shouldCrys).toBe(true);

      // Crystallize first skill
      act(() => {
        result.current.crystallizeSkill(patterns[0], { projectName: 'ts', reason: 'test', score: 0.8 });
      });

      // Second identical pattern - should not crystallize (similarity = 1.0)
      shouldCrys = shouldCrystallize(patterns[1], result.current.getSkills());
      expect(shouldCrys).toBe(false);

      // Different pattern: similarity=0 < threshold, usageCount=1 < threshold(3), existing skills => false
      const differentPattern: QueryPattern = { language: 'Rust', sortKey: 'forks' };
      shouldCrys = shouldCrystallize(differentPattern, result.current.getSkills());
      // usageCount=1 < threshold(3), existing skills present => false
      // (different pattern but no skill with high enough usage to trigger crystallization)
      expect(shouldCrys).toBe(false);
    });

    it('should find matching skill for recommendation', () => {
      const { result } = renderHook(() => useMemory());

      // Create a skill
      act(() => {
        result.current.crystallizeSkill(
          { language: 'TypeScript', sortKey: 'stars' },
          { projectName: 'microsoft/TypeScript', reason: 'Official language', score: 0.95 }
        );
      });

      // Find matching skill
      const matched = findMatchingSkill(
        { language: 'TypeScript', sortKey: 'stars' },
        result.current.getSkills()
      );

      expect(matched).not.toBeNull();
      expect(matched?.recommendation.projectName).toBe('microsoft/TypeScript');
    });

    it('should not match skill below threshold', () => {
      const { result } = renderHook(() => useMemory());

      // Create a Python skill
      act(() => {
        result.current.crystallizeSkill(
          { language: 'Python', sortKey: 'stars' },
          { projectName: 'django/django', reason: 'Popular framework', score: 0.9 }
        );
      });

      // Try to match TypeScript query
      const matched = findMatchingSkill(
        { language: 'TypeScript', sortKey: 'stars' },
        result.current.getSkills()
      );

      expect(matched).toBeNull();
    });
  });

  describe('Data persistence across hooks', () => {
    it('should persist data in localStorage', () => {
      const { result: hook1 } = renderHook(() => useMemory());

      act(() => {
        hook1.current.setMetaRule('language', 'TypeScript');
        hook1.current.addInsight('React', 0.7);
      });

      // Simulate new hook instance (same localStorage)
      const { result: hook2 } = renderHook(() => useMemory());

      expect(hook2.current.getMetaRules()).toHaveLength(1);
      expect(hook2.current.getInsightIndex().tags['React']).toBe(0.7);
    });

    it('should clear all data on reset', () => {
      const { result } = renderHook(() => useMemory());

      act(() => {
        result.current.setMetaRule('language', 'TypeScript');
        result.current.addGlobalFact({ type: 'favorite', key: 'test', data: {} });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.getMetaRules()).toHaveLength(0);
      expect(result.current.getGlobalFacts()).toHaveLength(0);
      expect(memoryStore.getL0()).toEqual([]);
      expect(memoryStore.getL2()).toEqual([]);
    });
  });
});