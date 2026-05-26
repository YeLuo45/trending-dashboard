import type { QueryPattern, SkillSOP } from './types';

const CRYSTALLIZATION_THRESHOLD = 0.8; // 模式匹配度 > 0.8 触发结晶

export function calculatePatternSimilarity(a: QueryPattern, b: QueryPattern): number {
  let matches = 0;
  let total = 0;

  if (a.language !== undefined && b.language !== undefined) {
    total++;
    if (a.language === b.language) matches++;
  }
  if (a.topic !== undefined && b.topic !== undefined) {
    total++;
    if (a.topic === b.topic) matches++;
  }
  if (a.sortKey !== undefined && b.sortKey !== undefined) {
    total++;
    if (a.sortKey === b.sortKey) matches++;
  }
  if (a.dateRange !== undefined && b.dateRange !== undefined) {
    total++;
    if (a.dateRange === b.dateRange) matches++;
  }

  return total > 0 ? matches / total : 0;
}

export function shouldCrystallize(
  currentPattern: QueryPattern,
  existingSkills: SkillSOP[],
  usageCountThreshold = 3
): boolean {
  if (existingSkills.some(s => s.usageCount >= usageCountThreshold)) {
    const maxSimilarity = Math.max(
      ...existingSkills.map(s => calculatePatternSimilarity(currentPattern, s.pattern)),
      0
    );
    return maxSimilarity < CRYSTALLIZATION_THRESHOLD;
  }
  return existingSkills.length === 0;
}

export function findMatchingSkill(
  pattern: QueryPattern,
  skills: SkillSOP[]
): SkillSOP | null {
  if (skills.length === 0) return null;

  let bestMatch: SkillSOP | null = null;
  let bestScore = 0;

  for (const skill of skills) {
    const score = calculatePatternSimilarity(pattern, skill.pattern);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = skill;
    }
  }

  return bestScore >= CRYSTALLIZATION_THRESHOLD ? bestMatch : null;
}