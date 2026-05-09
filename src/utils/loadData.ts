import type { TrendingData, TrendingProject } from '../types';

// Load data from JSON file in public folder
export async function loadTrendingFromFiles(): Promise<TrendingData> {
  try {
    const response = await fetch('/data/trending.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to load trending.json, using fallback:', error);
    return loadSampleData();
  }
}

// Fallback sample data (embedded)
const SAMPLE_WEEKLY: TrendingProject[] = [
  { rank: 1, name: 'anthropics/financial-services', link: 'https://github.com/anthropics/financial-services', description: 'Anthropic\'s financial services reference implementation', keywords: ['Finance', 'Python'], totalStars: '16,687', growth: '5,848', growthValue: 5848 },
  { rank: 2, name: 'ruvnet/ruflo', link: 'https://github.com/ruvnet/ruflo', description: 'The leading agent orchestration platform for Claude', keywords: ['AI Agent', 'Claude', 'TypeScript'], totalStars: '47,379', growth: '12,226', growthValue: 12226 },
  { rank: 3, name: 'TauricResearch/TradingAgents', link: 'https://github.com/TauricResearch/TradingAgents', description: 'TradingAgents: Multi-Agents LLM Financial Trading', keywords: ['AI Agent', 'Trading', 'Finance', 'Python'], totalStars: '72,239', growth: '12,981', growthValue: 12981 },
  { rank: 4, name: 'docusealco/docuseal', link: 'https://github.com/docusealco/docuseal', description: 'Open source DocuSign alternative', keywords: ['Ruby'], totalStars: '15,995', growth: '4,069', growthValue: 4069 },
  { rank: 5, name: 'virattt/dexter', link: 'https://github.com/virattt/dexter', description: 'An autonomous agent for deep financial research', keywords: ['AI Agent', 'Finance', 'TypeScript'], totalStars: '24,979', growth: '3,278', growthValue: 3278 },
  { rank: 6, name: 'soxoj/maigret', link: 'https://github.com/soxoj/maigret', description: 'Collect a dossier on a person by username', keywords: ['Python'], totalStars: '26,861', growth: '5,398', growthValue: 5398 },
  { rank: 7, name: '1jehuang/jcode', link: 'https://github.com/1jehuang/jcode', description: 'Coding Agent Harness', keywords: ['AI Agent', 'Rust'], totalStars: '5,239', growth: '2,925', growthValue: 2925 },
  { rank: 8, name: 'cocoindex-io/cocoindex', link: 'https://github.com/cocoindex-io/cocoindex', description: 'Incremental engine for long horizon agents', keywords: ['AI Agent', 'Python'], totalStars: '9,248', growth: '1,909', growthValue: 1909 },
  { rank: 9, name: 'AIDC-AI/Pixelle-Video', link: 'https://github.com/AIDC-AI/Pixelle-Video', description: 'AI全自动短视频引擎', keywords: ['AI', 'Python'], totalStars: '14,042', growth: '5,136', growthValue: 5136 },
  { rank: 10, name: 'mattpocock/skills', link: 'https://github.com/mattpocock/skills', description: 'Skills for Real Engineers', keywords: ['Claude', 'Shell'], totalStars: '67,500', growth: '14,928', growthValue: 14928 },
];

const SAMPLE_MONTHLY: TrendingProject[] = [
  { rank: 1, name: 'forrestchang/andrej-karpathy-skills', link: 'https://github.com/forrestchang/andrej-karpathy-skills', description: 'A single CLAUDE.md file to improve Claude', keywords: ['Claude'], totalStars: '121,750', growth: '112,013', growthValue: 112013 },
  { rank: 2, name: 'mattpocock/skills', link: 'https://github.com/mattpocock/skills', description: 'Skills for Real Engineers', keywords: ['Claude', 'Shell'], totalStars: '67,502', growth: '53,203', growthValue: 53203 },
  { rank: 3, name: 'NousResearch/hermes-agent', link: 'https://github.com/NousResearch/hermes-agent', description: 'The agent that grows with you', keywords: ['AI Agent', 'Python'], totalStars: '140,284', growth: '104,052', growthValue: 104052 },
  { rank: 4, name: 'Alishahryar1/free-claude-code', link: 'https://github.com/Alishahryar1/free-claude-code', description: 'Use claude-code for free in the terminal', keywords: ['Claude', 'Python'], totalStars: '23,083', growth: '20,993', growthValue: 20993 },
  { rank: 5, name: 'multica-ai/multica', link: 'https://github.com/multica-ai/multica', description: 'The open-source managed agents platform', keywords: ['AI Agent', 'TypeScript'], totalStars: '26,485', growth: '23,942', growthValue: 23942 },
  { rank: 6, name: 'addyosmani/agent-skills', link: 'https://github.com/addyosmani/agent-skills', description: 'Production-grade engineering skills for AI coding', keywords: ['AI Agent', 'Shell'], totalStars: '36,879', growth: '25,346', growthValue: 25346 },
  { rank: 7, name: 'AIDC-AI/Pixelle-Video', link: 'https://github.com/AIDC-AI/Pixelle-Video', description: 'AI全自动短视频引擎', keywords: ['AI', 'Python'], totalStars: '14,042', growth: '10,269', growthValue: 10269 },
  { rank: 8, name: 'lsdefine/GenericAgent', link: 'https://github.com/lsdefine/GenericAgent', description: 'Self-evolving agent: grows skill tree', keywords: ['AI Agent', 'Python'], totalStars: '10,221', growth: '8,855', growthValue: 8855 },
  { rank: 9, name: 'shiyu-coder/Kronos', link: 'https://github.com/shiyu-coder/Kronos', description: 'Kronos: A Foundation Model for Finance', keywords: ['Finance', 'Python'], totalStars: '23,747', growth: '12,092', growthValue: 12092 },
  { rank: 10, name: 'ComposioHQ/awesome-codex-skills', link: 'https://github.com/ComposioHQ/awesome-codex-skills', description: 'A curated list of practical Codex skills', keywords: ['Python'], totalStars: '7,754', growth: '6,940', growthValue: 6940 },
];

export function loadSampleData(): TrendingData {
  return {
    weekly: SAMPLE_WEEKLY,
    monthly: SAMPLE_MONTHLY,
    lastUpdated: '2026-05-09 21:02'
  };
}
