import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMemory } from '../useMemory';
import { memoryStore } from '../memoryStore';

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

describe('useMemory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('L0 MetaRules', () => {
    it('should get and set meta rules', () => {
      const { result } = renderHook(() => useMemory());

      act(() => {
        result.current.setMetaRule('language', 'TypeScript');
      });

      const rules = result.current.getMetaRules();
      expect(rules).toHaveLength(1);
      expect(rules[0].key).toBe('language');
      expect(rules[0].value).toBe('TypeScript');
    });

    it('should update existing meta rule', () => {
      const { result } = renderHook(() => useMemory());

      act(() => {
        result.current.setMetaRule('language', 'TypeScript');
      });

      act(() => {
        result.current.setMetaRule('language', 'Python');
      });

      const rules = result.current.getMetaRules();
      expect(rules).toHaveLength(1);
      expect(rules[0].value).toBe('Python');
    });
  });

  describe('L1 InsightIndex', () => {
    it('should get insight index', () => {
      const { result } = renderHook(() => useMemory());
      const index = result.current.getInsightIndex();
      expect(index.tags).toEqual({});
    });

    it('should add insight', () => {
      const { result } = renderHook(() => useMemory());

      act(() => {
        result.current.addInsight('TypeScript', 0.5);
      });

      const index = result.current.getInsightIndex();
      expect(index.tags['TypeScript']).toBe(0.5);
    });
  });

  describe('L2 GlobalFacts', () => {
    it('should add global fact', () => {
      const { result } = renderHook(() => useMemory());

      act(() => {
        result.current.addGlobalFact({ type: 'favorite', key: 'facebook/react', data: {} });
      });

      const facts = result.current.getGlobalFacts();
      expect(facts).toHaveLength(1);
      expect(facts[0].type).toBe('favorite');
      expect(facts[0].key).toBe('facebook/react');
    });

    it('should remove global fact', () => {
      const { result } = renderHook(() => useMemory());

      let factId: string = '';
      act(() => {
        result.current.addGlobalFact({ type: 'favorite', key: 'facebook/react', data: {} });
        factId = result.current.getGlobalFacts()[0].id;
      });

      act(() => {
        result.current.removeGlobalFact(factId);
      });

      expect(result.current.getGlobalFacts()).toHaveLength(0);
    });
  });

  describe('L3 Skills', () => {
    it('should crystallize skill', () => {
      const { result } = renderHook(() => useMemory());

      act(() => {
        result.current.crystallizeSkill(
          { language: 'TypeScript' },
          { projectName: 'react', reason: 'popular', score: 0.9 }
        );
      });

      const skills = result.current.getSkills();
      expect(skills).toHaveLength(1);
      expect(skills[0].pattern.language).toBe('TypeScript');
      expect(skills[0].recommendation.projectName).toBe('react');
    });

    it('should use skill and increment usage count', () => {
      const { result } = renderHook(() => useMemory());

      let skillId: string = '';
      act(() => {
        const skill = result.current.crystallizeSkill(
          { language: 'TypeScript' },
          { projectName: 'react', reason: 'popular', score: 0.9 }
        );
        skillId = skill.id;
      });

      const skillBefore = result.current.useSkill(skillId);
      expect(skillBefore?.usageCount).toBe(2);

      const skillAfter = result.current.useSkill(skillId);
      expect(skillAfter?.usageCount).toBe(3);
    });

    it('should return null for non-existent skill', () => {
      const { result } = renderHook(() => useMemory());
      const skill = result.current.useSkill('non-existent-id');
      expect(skill).toBeNull();
    });
  });

  describe('L4 Sessions', () => {
    it('should archive session', () => {
      const { result } = renderHook(() => useMemory());

      act(() => {
        result.current.archiveSession({
          date: '2024-01-01',
          queries: [{ language: 'TypeScript' }],
          views: ['facebook/react'],
          starsAdded: 5,
        });
      });

      const sessions = result.current.getArchivedSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].date).toBe('2024-01-01');
    });

    it('should filter out sessions older than 30 days', () => {
      const { result } = renderHook(() => useMemory());

      // Add old session directly
      const oldSessions = [{
        id: 'old-session',
        date: '2024-01-01',
        queries: [],
        views: [],
        starsAdded: 0,
        archivedAt: '2024-01-01T00:00:00.000Z',
      }];
      memoryStore.setL4(oldSessions);

      act(() => {
        result.current.archiveSession({
          date: new Date().toISOString().split('T')[0],
          queries: [],
          views: [],
          starsAdded: 0,
        });
      });

      const sessions = result.current.getArchivedSessions();
      expect(sessions.some(s => s.id === 'old-session')).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all layers', () => {
      const { result } = renderHook(() => useMemory());

      act(() => {
        result.current.setMetaRule('language', 'TypeScript');
        result.current.addInsight('TypeScript', 0.5);
        result.current.addGlobalFact({ type: 'favorite', key: 'test', data: {} });
        result.current.crystallizeSkill({ language: 'TypeScript' }, { projectName: 'test', reason: 'test', score: 0.5 });
        result.current.archiveSession({ date: '2024-01-01', queries: [], views: [], starsAdded: 0 });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.getMetaRules()).toHaveLength(0);
      expect(result.current.getInsightIndex().tags).toEqual({});
      expect(result.current.getGlobalFacts()).toHaveLength(0);
      expect(result.current.getSkills()).toHaveLength(0);
      expect(result.current.getArchivedSessions()).toHaveLength(0);
    });
  });
});