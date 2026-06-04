import { useMemo } from 'react';

interface PaginationProps {
  /** Total number of items */
  total: number;
  /** Current page (1-indexed) */
  currentPage: number;
  /** Items per page */
  pageSize: number;
  /** Called when page changes (1-indexed) */
  onPageChange: (page: number) => void;
  /** Called when page size changes */
  onPageSizeChange: (size: number) => void;
  /** Page size options to show. Defaults to [10, 20, 50] */
  pageSizeOptions?: number[];
  /** Optional starting index display (e.g. "1-10 / 247") */
  showRange?: boolean;
}

const DEFAULT_PAGE_SIZES = [10, 20, 50];

/**
 * Build a compact page-number list with ellipsis.
 * Example: 1 ... 4 5 [6] 7 8 ... 20
 */
function buildPageList(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 1) return total === 1 ? [1] : [];
  const pages: (number | 'ellipsis')[] = [];

  // Always show first
  pages.push(1);

  // Window around current
  const window = 1;
  const start = Math.max(2, current - window);
  const end = Math.min(total - 1, current + window);

  if (start > 2) pages.push('ellipsis');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push('ellipsis');

  // Always show last (if more than 1 page)
  if (total > 1) pages.push(total);

  return pages;
}

export function Pagination({
  total,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  showRange = true,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Clamp current page if data shrank
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const pageList = useMemo(() => buildPageList(safePage, totalPages), [safePage, totalPages]);

  const startItem = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, total);

  if (total === 0) {
    return null;
  }

  return (
    <nav
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-github-border/10"
      aria-label="分页导航"
    >
      {/* Left: range + page-size selector */}
      <div className="flex items-center gap-3 text-xs text-github-muted">
        {showRange && (
          <span className="font-mono-tabular">
            <span className="text-github-text font-semibold">{startItem}</span>
            <span> - </span>
            <span className="text-github-text font-semibold">{endItem}</span>
            <span> / </span>
            <span className="text-github-text font-semibold">{total}</span>
            <span> 项</span>
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <span>每页</span>
          <select
            value={pageSize}
            onChange={e => {
              const size = Number(e.target.value) || pageSizeOptions[0];
              onPageSizeChange(size);
              // Reset to page 1 when size changes
              onPageChange(1);
            }}
            className="bg-github-card border border-github-border rounded px-2 py-1 text-xs text-github-text focus:outline-none focus:border-github-purple/50 cursor-pointer"
            style={{ minHeight: '28px' }}
          >
            {pageSizeOptions.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>条</span>
        </div>
      </div>

      {/* Right: page buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="px-2.5 py-1 text-xs rounded-md bg-github-card border border-github-border text-github-text hover:border-github-purple/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          style={{ minHeight: '28px' }}
          aria-label="上一页"
        >
          ← 上一页
        </button>

        {pageList.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`e-${i}`}
              className="px-2 py-1 text-xs text-github-muted select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] px-2 py-1 text-xs rounded-md border transition-colors cursor-pointer font-mono-tabular ${
                p === safePage
                  ? 'bg-github-purple text-white border-github-purple shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                  : 'bg-github-card border-github-border text-github-muted hover:text-github-text hover:border-github-purple/50'
              }`}
              style={{ minHeight: '28px' }}
              aria-current={p === safePage ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="px-2.5 py-1 text-xs rounded-md bg-github-card border border-github-border text-github-text hover:border-github-purple/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          style={{ minHeight: '28px' }}
          aria-label="下一页"
        >
          下一页 →
        </button>
      </div>
    </nav>
  );
}
