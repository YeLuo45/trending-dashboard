import type { TrendingProject, Report, TrackedTopic } from '../types';

const REPORTS_KEY = 'trend_reports';
const TRACKED_TOPICS_KEY = 'tracked_topics';
const MAX_REPORTS = 30;
const MAX_TOPICS = 20;

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// ============ Tracked Topics ============

export function getTrackedTopics(): TrackedTopic[] {
  try {
    return JSON.parse(localStorage.getItem(TRACKED_TOPICS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addTrackedTopic(name: string): TrackedTopic | null {
  const topics = getTrackedTopics();
  const id = name.toLowerCase().trim();
  if (topics.length >= MAX_TOPICS) return null;
  if (topics.some(t => t.id === id)) return null;

  const topic: TrackedTopic = {
    id,
    name: name.trim(),
    addedAt: new Date().toLocaleString(),
  };
  topics.unshift(topic);
  localStorage.setItem(TRACKED_TOPICS_KEY, JSON.stringify(topics));
  return topic;
}

export function removeTrackedTopic(id: string): void {
  const topics = getTrackedTopics().filter(t => t.id !== id);
  localStorage.setItem(TRACKED_TOPICS_KEY, JSON.stringify(topics));
}

export function updateTrackedTopicColor(id: string, color: string): void {
  const topics = getTrackedTopics().map(t =>
    t.id === id ? { ...t, color } : t
  );
  localStorage.setItem(TRACKED_TOPICS_KEY, JSON.stringify(topics));
}

export function isTopicTracked(id: string): boolean {
  return getTrackedTopics().some(t => t.id === id);
}

// ============ Reports ============

export function getReports(): Report[] {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveReport(report: Report): void {
  const reports = getReports();
  // Avoid duplicates for same period
  const exists = reports.some(
    r => r.type === report.type && r.periodStart === report.periodStart
  );
  if (!exists) {
    reports.unshift(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports.slice(0, MAX_REPORTS)));
  }
}

export function deleteReport(id: string): void {
  const reports = getReports().filter(r => r.id !== id);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

// Aggregate topic counts from projects
function aggregateTopics(projects: TrendingProject[]): { topic: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of projects) {
    for (const kw of p.keywords) {
      const key = kw.toLowerCase().trim();
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// Generate a daily report
export function generateDailyReport(
  dailyProjects: TrendingProject[],
  weeklyProjects: TrendingProject[]
): Report {
  const now = new Date();
  const today = formatDate(now);

  // Top projects: sorted by growthValue
  const topProjects = [...dailyProjects]
    .sort((a, b) => b.growthValue - a.growthValue)
    .slice(0, 10);

  // New in trend: projects in daily but not in yesterday (simplified: just daily projects)
  const newInTrend = dailyProjects.slice(0, 5);

  // Rising: projects flagged as risingPrediction
  const risingProjects = dailyProjects.filter(p => p.risingPrediction).slice(0, 5);

  const summary = `今日趋势共 ${dailyProjects.length} 个项目上榜，`
    + `周榜项目 ${weeklyProjects.length} 个，`
    + `其中国星项目 ${weeklyProjects.filter(p => p.risingPrediction).length} 个`;

  return {
    id: generateId(),
    type: 'daily',
    title: `${today} 日趋势报告`,
    createdAt: new Date().toLocaleString(),
    periodStart: today,
    periodEnd: today,
    summary,
    topProjects,
    newInTrend,
    risingProjects,
    topicSummaries: aggregateTopics(dailyProjects),
  };
}

// Generate a weekly report
export function generateWeeklyReport(
  weeklyProjects: TrendingProject[],
  dailyProjects: TrendingProject[]
): Report {
  const now = new Date();
  const today = formatDate(now);
  const weekAgo = formatDate(new Date(now.getTime() - 7 * 86400000));

  // Top projects: sorted by growthValue
  const topProjects = [...weeklyProjects]
    .sort((a, b) => b.growthValue - a.growthValue)
    .slice(0, 10);

  // New in trend: top daily projects
  const newInTrend = dailyProjects.slice(0, 5);

  // Rising: weekly projects flagged as risingPrediction
  const risingProjects = weeklyProjects.filter(p => p.risingPrediction).slice(0, 5);

  const totalGrowth = weeklyProjects.reduce((sum, p) => sum + p.growthValue, 0);
  const summary = `本周趋势共 ${weeklyProjects.length} 个项目上榜，`
    + `总增长 ${totalGrowth.toLocaleString()} stars，`
    + `其中国星预测 ${weeklyProjects.filter(p => p.risingPrediction).length} 个`;

  return {
    id: generateId(),
    type: 'weekly',
    title: `第 ${today} 周趋势报告`,
    createdAt: new Date().toLocaleString(),
    periodStart: weekAgo,
    periodEnd: today,
    summary,
    topProjects,
    newInTrend,
    risingProjects,
    topicSummaries: aggregateTopics(weeklyProjects),
  };
}

/**
 * Check whether a daily or weekly report should be auto-generated.
 * Returns true if no report exists for the current date/week.
 */
export function shouldGenerateReport(
  type: 'daily' | 'weekly'
): boolean {
  const reports = getReports();
  const today = formatDate(new Date());

  if (type === 'daily') {
    return !reports.some(r => r.type === 'daily' && r.periodStart === today);
  } else {
    // Weekly: check if a report exists for the current week (ISO week number)
    const now = new Date();
    const year = now.getFullYear();
    const weekNum = getISOWeekNumber(now);
    return !reports.some(r => {
      if (r.type !== 'weekly') return false;
      const reportDate = new Date(r.periodStart);
      return reportDate.getFullYear() === year && getISOWeekNumber(reportDate) === weekNum;
    });
  }
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}