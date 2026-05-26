import { describe, it, expect } from 'vitest';
import { calculatePatternSimilarity, shouldCrystallize, findMatchingSkill } from '../skillCrystallizer';
import type { QueryPattern, SkillSOP } from '../types';

describe('skillCrystallizer', () => {
  describe('calculatePatternSimilarity', () => {
    it('should return 1 for identical patterns', () => {
      const pattern: QueryPattern = { language: 'TypeScript', topic: 'react', sortKey: 'stars', dateRange: 'weekly' };
      expect(calculatePatternSimilarity(pattern, pattern)).toBe(1);
    });

    it('should return 0 for completely different patterns', () => {
      const a: QueryPattern = { language: 'TypeScript', sortKey: 'stars' };
      const b: QueryPattern = { language: 'Python', sortKey: 'forks' };
      expect(calculatePatternSimilarity(a, b)).toBe(0);
    });

    it('should calculate partial similarity', () => {
      const a: QueryPattern = { language: 'TypeScript', sortKey: 'stars' };
      const b: QueryPattern = { language: 'TypeScript', sortKey: 'forks' };
      expect(calculatePatternSimilarity(a, b)).toBe(0.5);
    });

    it('should handle undefined fields', () => {
      const a: QueryPattern = { language: 'TypeScript' };
      const b: QueryPattern = { language: 'TypeScript', topic: 'react' };
      expect(calculatePatternSimilarity(a, b)).toBe(1);
    });

    it('should return 0 for empty patterns', () => {
      expect(calculatePatternSimilarity({}, {})).toBe(0);
    });

    it('should handle dateRange similarity', () => {
      const a: QueryPattern = { dateRange: 'weekly' };
      const b: QueryPattern = { dateRange: 'weekly' };
      expect(calculatePatternSimilarity(a, b)).toBe(1);
    });
  });

  describe('shouldCrystallize', () => {
    it('should return true when no existing skills', () => {
      const pattern: QueryPattern = { language: 'TypeScript' };
      expect(shouldCrystallize(pattern, [])).toBe(true);
    });

    it('should return true when skill has high usage but low similarity', () => {
      const pattern: QueryPattern = { language: 'TypeScript', sortKey: 'stars' };
      const existingSkills: SkillSOP[] = [
        { id: '1', pattern: { language: 'Python' }, recommendation: { projectName: 'django', reason: 'test', score: 0.5 }, usageCount: 3, createdAt: '2024-01-01T00:00:00.000Z', lastUsed: '2024-01-01T00:00:00.000Z' },
      ];
      expect(shouldCrystallize(pattern, existingSkills)).toBe(true);
    });

    it('should return false when pattern is similar to existing skill', () => {
      const pattern: QueryPattern = { language: 'TypeScript', sortKey: 'stars' };
      const existingSkills: SkillSOP[] = [
        { id: '1', pattern: { language: 'TypeScript', sortKey: 'stars' }, recommendation: { projectName: 'react', reason: 'test', score: 0.8 }, usageCount: 3, createdAt: '2024-01-01T00:00:00.000Z', lastUsed: '2024-01-01T00:00:00.000Z' },
      ];
      expect(shouldCrystallize(pattern, existingSkills)).toBe(false);
    });
  });

  describe('findMatchingSkill', () => {
    it('should return null when no skills', () => {
      const pattern: QueryPattern = { language: 'TypeScript' };
      expect(findMatchingSkill(pattern, [])).toBeNull();
    });

    it('should return best matching skill above threshold', () => {
      const pattern: QueryPattern = { language: 'TypeScript', sortKey: 'stars' };
      const skills: SkillSOP[] = [
        { id: '1', pattern: { language: 'Python' }, recommendation: { projectName: 'django', reason: 'test', score: 0.3 }, usageCount: 1, createdAt: '2024-01-01T00:00:00.000Z', lastUsed: '2024-01-01T00:00:00.000Z' },
        { id: '2', pattern: { language: 'TypeScript' }, recommendation: { projectName: 'react', reason: 'test', score: 0.6 }, usageCount: 2, createdAt: '2024-01-01T00:00:00.000Z', lastUsed: '2024-01-01T00:00:00.000Z' },
      ];
      const result = findMatchingSkill(pattern, skills);
      expect(result?.id).toBe('2');
    });

    it('should return null when no skill meets threshold', () => {
      const pattern: QueryPattern = { language: 'Rust' };
      const skills: SkillSOP[] = [
        { id: '1', pattern: { language: 'Python' }, recommendation: { projectName: 'django', reason: 'test', score: 0.3 }, usageCount: 1, createdAt: '2024-01-01T00:00:00.000Z', lastUsed: '2024-01-01T00:00:00.000Z' },
      ];
      expect(findMatchingSkill(pattern, skills)).toBeNull();
    });

    it('should return exact match when similarity is 1', () => {
      const pattern: QueryPattern = { language: 'TypeScript', sortKey: 'stars' };
      const skills: SkillSOP[] = [
        { id: '1', pattern: { language: 'TypeScript', sortKey: 'stars' }, recommendation: { projectName: 'react', reason: 'test', score: 0.9 }, usageCount: 5, createdAt: '2024-01-01T00:00:00.000Z', lastUsed: '2024-01-01T00:00:00.000Z' },
      ];
      const result = findMatchingSkill(pattern, skills);
      expect(result?.id).toBe('1');
    });
  });
});