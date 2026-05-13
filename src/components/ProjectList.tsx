import type { TrendingProject } from '../types';
import { ProjectCard } from './ProjectCard';

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

export function ProjectList({ projects, type, selectedProjects, onToggleSelect, onFavoritesChange }: ProjectListProps) {
  const meta = TYPE_META[type];

  return (
    <section>
      <h2 className="text-xl font-semibold text-github-text mb-4 flex items-center gap-2">
        <span className="text-github-purple">{meta.emoji}</span>
        {meta.title}
      </h2>
      <div className="grid gap-4">
        {projects.map((project, index) => (
          <ProjectCard
            key={`${project.name}-${index}`}
            project={project}
            selected={selectedProjects.has(project.name)}
            onSelect={onToggleSelect}
            onFavoritesChange={onFavoritesChange}
          />
        ))}
      </div>
    </section>
  );
}
