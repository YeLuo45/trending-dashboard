// L0: Meta Rules - 用户硬性约束
export interface MetaRule {
  key: string;          // e.g., 'language', 'sortKey'
  value: any;           // e.g., 'TypeScript', 'growth'
  updatedAt: string;    // ISO timestamp
}

// L1: Insight Index - 快速路由索引
export interface InsightIndex {
  tags: Record<string, number>;  // tag → weight (0-1)
  lastUpdate: string;
}

// L2: Global Facts - 稳定知识
export interface GlobalFact {
  id: string;
  type: 'favorite' | 'author' | 'topic';
  key: string;         // "owner/repo" or "username"
  data: any;
  createdAt: string;
}

// L3: Skills SOP - 可复用技能
export interface SkillSOP {
  id: string;
  pattern: QueryPattern;
  recommendation: Recommendation;
  usageCount: number;
  createdAt: string;
  lastUsed: string;
}

export type SortKey = 'stars' | 'growth' | 'forks';

export interface QueryPattern {
  language?: string;
  topic?: string;
  sortKey?: SortKey;
  dateRange?: 'daily' | 'weekly' | 'monthly';
}

export interface Recommendation {
  projectName: string;
  reason: string;       // 为什么推荐这条
  score: number;        // 0-1
}

// L4: Session Archive - 会话归档
export interface SessionData {
  id: string;
  date: string;         // YYYY-MM-DD
  queries: QueryPattern[];
  views: string[];      // 浏览的项目名列表
  starsAdded: number;
  archivedAt: string;
}

// 导出联合类型
export type LayerType = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

export interface AIMemory {
  // L0
  getMetaRules(): MetaRule[];
  setMetaRule(key: string, value: any): void;
  
  // L1
  getInsightIndex(): InsightIndex;
  addInsight(tag: string, weight: number): void;
  
  // L2
  getGlobalFacts(): GlobalFact[];
  addGlobalFact(fact: Omit<GlobalFact, 'id' | 'createdAt'>): void;
  removeGlobalFact(id: string): void;
  
  // L3
  getSkills(): SkillSOP[];
  crystallizeSkill(pattern: QueryPattern, recommendation: Recommendation): SkillSOP;
  useSkill(id: string): SkillSOP | null;
  
  // L4
  archiveSession(session: Omit<SessionData, 'id' | 'archivedAt'>): void;
  getArchivedSessions(): SessionData[];
  
  // 工具
  reset(): void;
}