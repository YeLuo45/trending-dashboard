import { useCallback, useMemo, useState } from 'react';
import { memoryStore } from './memoryStore';
import type { MetaRule, InsightIndex, GlobalFact, SkillSOP, SessionData, QueryPattern, Recommendation, AIMemory } from './types';
import { shouldCrystallize, findMatchingSkill } from './skillCrystallizer';
import { updateInsight } from './insightIndexer';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useMemory(): AIMemory {
  const [, setVersion] = useState(0);
  // L0: Meta Rules
  const getMetaRules = useCallback((): MetaRule[] => {
    return memoryStore.getL0();
  }, []);

  const setMetaRule = (key: string, value: any): void => {
    const rules = memoryStore.getL0();
    const existing = rules.findIndex(r => r.key === key);
    const updated: MetaRule = { key, value, updatedAt: new Date().toISOString() };

    if (existing >= 0) {
      rules[existing] = updated;
    } else {
      rules.push(updated);
    }
    memoryStore.setL0(rules);
    setVersion(v => v + 1);
  };

  // L1: Insight Index
  const getInsightIndex = useCallback((): InsightIndex => {
    return memoryStore.getL1();
  }, []);

  const addInsight = useCallback((tag: string, weight: number): void => {
    const index = memoryStore.getL1();
    const updated = updateInsight(index, tag, weight);
    memoryStore.setL1(updated);
  }, []);

  // L2: Global Facts
  const getGlobalFacts = useCallback((): GlobalFact[] => {
    return memoryStore.getL2();
  }, []);

  const addGlobalFact = useCallback((fact: Omit<GlobalFact, 'id' | 'createdAt'>): void => {
    const facts = memoryStore.getL2();
    const newFact: GlobalFact = {
      ...fact,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    facts.push(newFact);
    memoryStore.setL2(facts);
  }, []);

  const removeGlobalFact = useCallback((id: string): void => {
    const facts = memoryStore.getL2().filter(f => f.id !== id);
    memoryStore.setL2(facts);
  }, []);

  // L3: Skills
  const getSkills = useCallback((): SkillSOP[] => {
    return memoryStore.getL3();
  }, []);

  const crystallizeSkill = useCallback(
    (pattern: QueryPattern, recommendation: Recommendation): SkillSOP => {
      const skills = memoryStore.getL3();
      const skill: SkillSOP = {
        id: generateId(),
        pattern,
        recommendation,
        usageCount: 1,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      };
      skills.push(skill);
      memoryStore.setL3(skills);
      return skill;
    },
    []
  );

  const useSkill = useCallback((id: string): SkillSOP | null => {
    const skills = memoryStore.getL3();
    const skill = skills.find(s => s.id === id);
    if (skill) {
      skill.usageCount++;
      skill.lastUsed = new Date().toISOString();
      memoryStore.setL3(skills);
      return skill;
    }
    return null;
  }, []);

  // L4: Sessions
  const archiveSession = useCallback(
    (session: Omit<SessionData, 'id' | 'archivedAt'>): void => {
      const sessions = memoryStore.getL4();
      const archive: SessionData = {
        ...session,
        id: generateId(),
        archivedAt: new Date().toISOString(),
      };
      // 保留最近 30 天会话
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const filtered = sessions.filter(
        s => new Date(s.date) > thirtyDaysAgo
      );
      filtered.push(archive);
      memoryStore.setL4(filtered);
    },
    []
  );

  const getArchivedSessions = useCallback((): SessionData[] => {
    return memoryStore.getL4();
  }, []);

  const reset = useCallback((): void => {
    memoryStore.reset();
  }, []);

  return useMemo(() => ({
    getMetaRules, setMetaRule,
    getInsightIndex, addInsight,
    getGlobalFacts, addGlobalFact, removeGlobalFact,
    getSkills, crystallizeSkill, useSkill,
    archiveSession, getArchivedSessions,
    reset,
  }), [
    getMetaRules, setMetaRule,
    getInsightIndex, addInsight,
    getGlobalFacts, addGlobalFact, removeGlobalFact,
    getSkills, crystallizeSkill, useSkill,
    archiveSession, getArchivedSessions,
    reset,
  ]);
}