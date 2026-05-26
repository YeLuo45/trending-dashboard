import type { MetaRule, InsightIndex, GlobalFact, SkillSOP, SessionData } from './types';

const STORAGE_KEYS = {
  L0: 'td_memory_L0',
  L1: 'td_memory_L1',
  L2: 'td_memory_L2',
  L3: 'td_memory_L3',
  L4: 'td_memory_L4',
} as const;

function safeJSONParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export const memoryStore = {
  getL0(): MetaRule[] {
    return safeJSONParse(localStorage.getItem(STORAGE_KEYS.L0), []);
  },

  setL0(rules: MetaRule[]): void {
    localStorage.setItem(STORAGE_KEYS.L0, JSON.stringify(rules));
  },

  getL1(): InsightIndex {
    return safeJSONParse(localStorage.getItem(STORAGE_KEYS.L1), { tags: {}, lastUpdate: '' });
  },

  setL1(index: InsightIndex): void {
    localStorage.setItem(STORAGE_KEYS.L1, JSON.stringify(index));
  },

  getL2(): GlobalFact[] {
    return safeJSONParse(localStorage.getItem(STORAGE_KEYS.L2), []);
  },

  setL2(facts: GlobalFact[]): void {
    localStorage.setItem(STORAGE_KEYS.L2, JSON.stringify(facts));
  },

  getL3(): SkillSOP[] {
    return safeJSONParse(localStorage.getItem(STORAGE_KEYS.L3), []);
  },

  setL3(skills: SkillSOP[]): void {
    localStorage.setItem(STORAGE_KEYS.L3, JSON.stringify(skills));
  },

  getL4(): SessionData[] {
    return safeJSONParse(localStorage.getItem(STORAGE_KEYS.L4), []);
  },

  setL4(sessions: SessionData[]): void {
    localStorage.setItem(STORAGE_KEYS.L4, JSON.stringify(sessions));
  },

  reset(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
};