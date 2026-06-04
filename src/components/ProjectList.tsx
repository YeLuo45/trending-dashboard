import { useState, useMemo, useEffect } from 'react';
import type { TrendingProject, SortKey, SortDirection } from '../types';
import { ProjectCard } from './ProjectCard';
import { SortControls } from './SortControls';
import { ProjectDetailPanel } from './ProjectDetailPanel';
import { Pagination } from './Pagination';

interface ProjectListProps {
  projects: TrendingProject[];
  type: 'weekly' | 'monthly' | 'daily';
  selectedProjects: Set<string>;
  onToggleSelect: (name: string) => void;
  onFavoritesChange?: () => void;
  onShowComments?: (projectName: string) => void;
  /** Keyword to highlight in project names, descriptions, and tags */
  highlightKeyword?: string;
}

const TYPE_META = {
  weekly: { emoji: '📈', title: '本周增长最快' },
  monthly: { emoji: '🔥', title: '本月最热' },
  daily: { emoji: '⚡', title: '今日趋势' },
};

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

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

export function ProjectList({ projects, type, selectedProjects, onToggleSelect, onFavoritesChange, onShowComments, highlightKeyword }: ProjectListProps) {
  const meta = TYPE_META[type];
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [detailProject, setDetailProject] = useState<TrendingProject | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const sortedProjects = useMemo(
    () => (sortKey === 'rank' && sortDir === 'desc' ? projects : sortProjects(projects, sortKey, sortDir)),
    [projects, sortKey, sortDir]
  );

  // Reset to page 1 when the underlying project list changes
  // (e.g. tab change, filter applied, sort changed) so we never strand
  // the user on an empty page.
  useEffect(() => {
    setPage(1);
  }, [type, pageSize, projects.length]);

  // Clamp page if data shrank between renders (defensive)
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageProjects = sortedProjects.slice(startIndex, startIndex + pageSize);

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

      {sortedProjects.length === 0 ? (
        <div className="text-center py-12 text-github-muted">
          <div className="text-4xl mb-3">📭</div>
          <p>该分类下暂无项目</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {pageProjects.map((project, index) => (
              <div key={`${project.name}-${index}`} onClick={() => setDetailProject(project)} className="cursor-pointer">
                <ProjectCard
                  project={project}
                  selected={selectedProjects.has(project.name)}
                  onSelect={onToggleSelect}
                  onFavoritesChange={onFavoritesChange}
                  onShowComments={onShowComments}
                  highlightKeyword={highlightKeyword}
                />
              </div>
            ))}
          </div>

          <Pagination
            total={sortedProjects.length}
            currentPage={safePage}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </>
      )}

      {detailProject && (
        <ProjectDetailPanel
          project={detailProject}
          onClose={() => setDetailProject(null)}
        />
      )}
    </section>
  );
}
