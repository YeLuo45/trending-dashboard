import type { SortKey, SortDirection } from '../types';

interface SortControlsProps {
  sortKey: SortKey;
  sortDir: SortDirection;
  onSortChange: (key: SortKey) => void;
  onDirChange: (dir: SortDirection) => void;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'rank', label: '排名' },
  { key: 'growth', label: '增长' },
  { key: 'forks', label: 'Fork数' },
  { key: 'activity', label: '活跃度' },
  { key: 'stars', label: '总星数' },
];

export function SortControls({ sortKey, sortDir, onSortChange, onDirChange }: SortControlsProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-github-muted">排序:</span>
      <div className="flex items-center gap-1 bg-github-card border border-github-border rounded overflow-hidden">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => onSortChange(opt.key)}
            className={`px-3 py-1.5 transition-colors ${
              sortKey === opt.key
                ? 'bg-github-purple text-white'
                : 'text-github-muted hover:text-github-text hover:bg-github-dark'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => onDirChange(sortDir === 'desc' ? 'asc' : 'desc')}
        className="p-1.5 rounded bg-github-card border border-github-border text-github-muted hover:text-github-text transition-colors"
        title={sortDir === 'desc' ? '降序 → 升序' : '升序 → 降序'}
      >
        {sortDir === 'desc' ? '↓' : '↑'}
      </button>
    </div>
  );
}