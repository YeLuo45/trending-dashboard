import { describe, it, expect, beforeEach, vi } from 'vitest';
import { memoryStore } from '../memoryStore';
import type { MetaRule, InsightIndex, GlobalFact, SkillSOP, SessionData } from '../types';

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

describe('memoryStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('L0 MetaRules', () => {
    it('should return empty array when no L0 data', () => {
      expect(memoryStore.getL0()).toEqual([]);
    });

    it('should set and get L0 meta rules', () => {
      const rules: MetaRule[] = [
        { key: 'language', value: 'TypeScript', updatedAt: '2024-01-01T00:00:00.000Z' },
        { key: 'sortKey', value: 'stars', updatedAt: '2024-01-01T00:00:00.000Z' },
      ];
      memoryStore.setL0(rules);
      expect(memoryStore.getL0()).toEqual(rules);
    });
  });

  describe('L1 InsightIndex', () => {
    it('should return default index when no L1 data', () => {
      const index = memoryStore.getL1();
      expect(index.tags).toEqual({});
      expect(index.lastUpdate).toBe('');
    });

    it('should set and get L1 insight index', () => {
      const index: InsightIndex = {
        tags: { TypeScript: 0.8, React: 0.6 },
        lastUpdate: '2024-01-01T00:00:00.000Z',
      };
      memoryStore.setL1(index);
      expect(memoryStore.getL1()).toEqual(index);
    });
  });

  describe('L2 GlobalFacts', () => {
    it('should return empty array when no L2 data', () => {
      expect(memoryStore.getL2()).toEqual([]);
    });

    it('should set and get L2 global facts', () => {
      const facts: GlobalFact[] = [
        { id: '1', type: 'favorite', key: 'facebook/react', data: {}, createdAt: '2024-01-01T00:00:00.000Z' },
      ];
      memoryStore.setL2(facts);
      expect(memoryStore.getL2()).toEqual(facts);
    });
  });

  describe('L3 Skills', () => {
    it('should return empty array when no L3 data', () => {
      expect(memoryStore.getL3()).toEqual([]);
    });

    it('should set and get L3 skills', () => {
      const skills: SkillSOP[] = [
        { id: '1', pattern: { language: 'TypeScript' }, recommendation: { projectName: 'react', reason: 'test', score: 0.8 }, usageCount: 1, createdAt: '2024-01-01T00:00:00.000Z', lastUsed: '2024-01-01T00:00:00.000Z' },
      ];
      memoryStore.setL3(skills);
      expect(memoryStore.getL3()).toEqual(skills);
    });
  });

  describe('L4 Sessions', () => {
    it('should return empty array when no L4 data', () => {
      expect(memoryStore.getL4()).toEqual([]);
    });

    it('should set and get L4 sessions', () => {
      const sessions: SessionData[] = [
        { id: '1', date: '2024-01-01', queries: [], views: [], starsAdded: 0, archivedAt: '2024-01-01T00:00:00.000Z' },
      ];
      memoryStore.setL4(sessions);
      expect(memoryStore.getL4()).toEqual(sessions);
    });
  });

  describe('reset', () => {
    it('should clear all memory layers', () => {
      memoryStore.setL0([{ key: 'test', value: 'value', updatedAt: '2024-01-01T00:00:00.000Z' }]);
      memoryStore.setL1({ tags: { test: 1 }, lastUpdate: '2024-01-01T00:00:00.000Z' });
      memoryStore.setL2([{ id: '1', type: 'favorite', key: 'test', data: {}, createdAt: '2024-01-01T00:00:00.000Z' }]);
      memoryStore.setL3([{ id: '1', pattern: {}, recommendation: { projectName: 'test', reason: 'test', score: 0.5 }, usageCount: 1, createdAt: '2024-01-01T00:00:00.000Z', lastUsed: '2024-01-01T00:00:00.000Z' }]);
      memoryStore.setL4([{ id: '1', date: '2024-01-01', queries: [], views: [], starsAdded: 0, archivedAt: '2024-01-01T00:00:00.000Z' }]);

      memoryStore.reset();

      expect(memoryStore.getL0()).toEqual([]);
      expect(memoryStore.getL1()).toEqual({ tags: {}, lastUpdate: '' });
      expect(memoryStore.getL2()).toEqual([]);
      expect(memoryStore.getL3()).toEqual([]);
      expect(memoryStore.getL4()).toEqual([]);
    });
  });

  describe('safeJSONParse', () => {
    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('td_memory_L0', 'invalid json');
      expect(memoryStore.getL0()).toEqual([]);
    });

    it('should handle null values', () => {
      localStorage.removeItem('td_memory_L0');
      expect(memoryStore.getL0()).toEqual([]);
    });
  });
});