import { useState } from 'react';
import type { TrendingProject, SortKey, SortDirection } from '../types';
import { ProjectCard } from './ProjectCard';
import { SortControls } from './SortControls';
import { ProjectDetailPanel } from './ProjectDetailPanel';

interface ProjectListProps {
  projects: TrendingProject[];
  type: 'weekly' | 'monthly' | 'daily';
  selectedProjects: Set<string>;
  onToggleSelect: (name: string) => void;
  onFavoritesChange?: () => void;
}

const TYPE_META = {
  weekly: { emoji: '📈', title: '本周增长最快 Top 10' },
  monthly: { emoji: '🔥', title: '本月最热 Top 10' },
  daily: { emoji: '⚡', title: '今日趋势 Top 10' },
};

function sortProjects(projects: TrendingProject[], key: SortKey, dir: SortDirection): TrendingProject[] {
  const sorted = [...projects].sort((a, b) => {
    switch (key) {
      case 'rank': return a.rank - b.rank;
      case 'growth': return (b.growthValue || 0) - (a.growthValue || 0);
      case 'forks': return (b.forksValue || 0) - (a.forksValue || 0);
      case 'activity': return (b.activity || 0) - (a.activity || 0);
      case 'stars': return parseInt(b.totalStars.replace(/,/g, '')) - parseInt(a.totalStars.replace(/,/g, ''));
      default: return 0;
    }
  });
  return dir === 'asc' ? sorted.reverse() : sorted;
}

export function ProjectList({ projects, type, selectedProjects, onToggleSelect, onFavoritesChange }: ProjectListProps) {
  const meta = TYPE_META[type];
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [detailProject, setDetailProject] = useState<TrendingProject | null>(null);

  const sortedProjects = sortKey === 'rank' && sortDir === 'desc' ? projects : sortProjects(projects, sortKey, sortDir);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-github-text flex items-center gap-2">
          <span className="text-github-purple">{meta.emoji}</span>
          {meta.title}
        </h2>
        <SortControls
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={setSortKey}
          onDirChange={setSortDir}
        />
      </div>
      <div className="grid gap-4">
        {sortedProjects.map((project, index) => (
          <div key={`${project.name}-${index}`} onClick={() => setDetailProject(project)} className="cursor-pointer">
            <ProjectCard
              project={project}
              selected={selectedProjects.has(project.name)}
              onSelect={onToggleSelect}
              onFavoritesChange={onFavoritesChange}
            />
          </div>
        ))}
      </div>

      {detailProject && (
        <ProjectDetailPanel
          project={detailProject}
          onClose={() => setDetailProject(null)}
        />
      )}
    </section>
  );
}