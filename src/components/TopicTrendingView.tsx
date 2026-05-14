import { useState, useMemo } from 'react';
import type { TrendingProject } from '../types';
import { ProjectCard } from './ProjectCard';

interface TopicTrendingViewProps {
  projects: TrendingProject[];
  selectedProjects: Set<string>;
  onToggleSelect: (name: string) => void;
  onFavoritesChange?: () => void;
  onShowComments?: (projectName: string) => void;
}

const LANGUAGE_TABS_LIMIT = 12;

export function TopicTrendingView({
  projects,
  selectedProjects,
  onToggleSelect,
  onFavoritesChange,
  onShowComments,
}: TopicTrendingViewProps) {
  // Get all unique languages from projects
  const allLanguages = useMemo(() => {
    const langSet = new Set<string>();
    for (const p of projects) {
      const lang = p.keywords?.[0] || 'Unknown';
      langSet.add(lang);
    }
    return Array.from(langSet).sort();
  }, [projects]);

  const [activeLangTab, setActiveLangTab] = useState<string>('全部');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  // Filter languages for tabs (most common ones)
  const langTabs = useMemo(() => {
    const langCounts = new Map<string, number>();
    for (const p of projects) {
      const lang = p.keywords?.[0] || 'Unknown';
      langCounts.set(lang, (langCounts.get(lang) || 0) + 1);
    }
    return ['全部', ...allLanguages.slice(0, LANGUAGE_TABS_LIMIT - 1)].filter(Boolean);
  }, [projects, allLanguages]);

  // Filter projects by active language tab
  const filteredByLang = useMemo(() => {
    if (activeLangTab === '全部') return projects;
    return projects.filter(p => (p.keywords?.[0] || 'Unknown') === activeLangTab);
  }, [projects, activeLangTab]);

  // Group projects by topic (first keyword that is a known topic)
  const topicGroups = useMemo(() => {
    const groups = new Map<string, TrendingProject[]>();
    for (const p of filteredByLang) {
      const topic = p.keywords?.[1] || p.keywords?.[0] || 'Other';
      if (!groups.has(topic)) groups.set(topic, []);
      groups.get(topic)!.push(p);
    }
    // Sort topics by total project count
    return Array.from(groups.entries())
      .sort((a, b) => b[1].length - a[1].length);
  }, [filteredByLang]);

  // When a topic is selected, show projects for that topic
  const displayProjects = useMemo(() => {
    if (activeTopic) {
      return filteredByLang.filter(p => {
        const topic = p.keywords?.[1] || p.keywords?.[0] || 'Other';
        return topic === activeTopic;
      });
    }
    // Show top projects across all topics
    return [...filteredByLang].sort((a, b) => b.growthValue - a.growthValue);
  }, [filteredByLang, activeTopic]);

  // Topic color
  const TOPIC_COLORS = [
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-green-500/20 text-green-400 border-green-500/30',
    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'bg-red-500/20 text-red-400 border-red-500/30',
  ];
  const getTopicColor = (topic: string) => {
    let hash = 0;
    for (let i = 0; i < topic.length; i++) {
      hash = (hash * 31 + topic.charCodeAt(i)) % TOPIC_COLORS.length;
    }
    return TOPIC_COLORS[Math.abs(hash) % TOPIC_COLORS.length];
  };

  return (
    <div>
      {/* Language Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {langTabs.map(lang => {
          const count = projects.filter(p => (p.keywords?.[0] || 'Unknown') === lang).length;
          return (
            <button
              key={lang}
              onClick={() => {
                setActiveLangTab(lang);
                setActiveTopic(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-sm whitespace-nowrap transition-colors ${
                activeLangTab === lang && !activeTopic
                  ? 'bg-github-purple/20 text-github-purple border-b-2 border-github-purple'
                  : 'text-github-muted hover:text-github-text hover:bg-github-card'
              }`}
            >
              <span>{lang}</span>
              <span className="text-xs opacity-60">({lang === '全部' ? projects.length : count})</span>
            </button>
          );
        })}
      </div>

      {/* Topic pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {topicGroups.map(([topic, topicProjects]) => (
          <button
            key={topic}
            onClick={() => setActiveTopic(activeTopic === topic ? null : topic)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition-all ${
              activeTopic === topic
                ? getTopicColor(topic) + ' border-current'
                : 'bg-github-card border-github-border text-github-muted hover:text-github-text hover:border-github-purple/50'
            }`}
          >
            <span className="font-medium">{topic}</span>
            <span className="opacity-60">({topicProjects.length})</span>
            {activeTopic === topic && (
              <span className="ml-1 text-github-purple">✕</span>
            )}
          </button>
        ))}
      </div>

      {/* Active topic label */}
      {activeTopic && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-github-muted text-sm">话题:</span>
          <span className={`px-2 py-0.5 rounded text-xs border ${getTopicColor(activeTopic)}`}>
            {activeTopic}
          </span>
          <span className="text-github-muted text-xs">
            {displayProjects.length} 个项目
          </span>
          <button
            onClick={() => setActiveTopic(null)}
            className="text-xs text-github-purple hover:underline ml-2"
          >
            查看全部
          </button>
        </div>
      )}

      {/* Project Grid */}
      <div className="grid gap-4">
        {displayProjects.length === 0 ? (
          <div className="text-center py-12 text-github-muted">
            <div className="text-4xl mb-3">📭</div>
            <p>该分类下暂无项目</p>
          </div>
        ) : (
          displayProjects.map((project, index) => (
            <ProjectCard
              key={`${project.name}-${index}`}
              project={project}
              selected={selectedProjects.has(project.name)}
              onSelect={onToggleSelect}
              onFavoritesChange={onFavoritesChange}
              onShowComments={onShowComments}
            />
          ))
        )}
      </div>
    </div>
  );
}
