import type { TrendingProject } from '../types';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
  projects: TrendingProject[];
  type: 'weekly' | 'monthly';
  selectedProjects: Set<string>;
  onToggleSelect: (name: string) => void;
}

export function ProjectList({ projects, type, selectedProjects, onToggleSelect }: ProjectListProps) {
  const title = type === 'weekly' ? '本周增长最快 Top 10' : '本月最热 Top 10';

  return (
    <section>
      <h2 className="text-xl font-semibold text-github-text mb-4 flex items-center gap-2">
        <span className="text-github-purple">{type === 'weekly' ? '📈' : '🔥'}</span>
        {title}
      </h2>
      <div className="grid gap-4">
        {projects.map((project, index) => (
          <ProjectCard
            key={`${project.name}-${index}`}
            project={project}
            selected={selectedProjects.has(project.name)}
            onSelect={onToggleSelect}
          />
        ))}
      </div>
    </section>
  );
}
