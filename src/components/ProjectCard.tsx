import type { TrendingProject } from '../types';

interface ProjectCardProps {
  project: TrendingProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-gray-500';
  };

  return (
    <a
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-github-card border border-github-border rounded-lg p-4 hover:border-github-purple/50 transition-all duration-200 hover:shadow-lg hover:shadow-github-purple/10"
    >
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className={`text-2xl font-bold min-w-[2rem] ${getRankColor(project.rank)}`}>
          {project.rank}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Project Name */}
          <h3 className="text-lg font-semibold text-github-purple mb-1 truncate">
            {project.name}
          </h3>
          
          {/* Description */}
          <p className="text-github-muted text-sm mb-3 line-clamp-2">
            {project.description}
          </p>
          
          {/* Keywords */}
          <div className="flex flex-wrap gap-2 mb-3">
            {project.keywords.map((keyword, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs rounded-full bg-github-purple/20 text-github-purple"
              >
                {keyword}
              </span>
            ))}
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-github-orange">★</span>
              <span className="text-github-muted">{parseInt(project.totalStars).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-github-green">⬆</span>
              <span className="text-github-green font-medium">+{parseInt(project.growth).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
