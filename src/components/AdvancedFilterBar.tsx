import { useState } from 'react';
import type { TrendingProject } from '../types';

export interface FilterState {
  language: string;
  minStars: number;
  minGrowth: number;
  timeRange: 'all' | 'day' | 'week' | 'month';
  keyword: string;
}

interface AdvancedFilterBarProps {
  projects: TrendingProject[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const LANGUAGE_OPTIONS = [
  'Python', 'TypeScript', 'JavaScript', 'Go', 'Rust',
  'Java', 'Swift', 'Kotlin', 'Dart', 'Ruby', 'PHP', 'C++', 'C', 'Shell',
  'Jupyter Notebook',
];

const STAR_OPTIONS = [
  { label: '不限', value: 0 },
  { label: '≥ 1K', value: 1000 },
  { label: '≥ 5K', value: 5000 },
  { label: '≥ 10K', value: 10000 },
  { label: '≥ 50K', value: 50000 },
];

const GROWTH_OPTIONS = [
  { label: '不限', value: 0 },
  { label: '≥ 100', value: 100 },
  { label: '≥ 500', value: 500 },
  { label: '≥ 1K', value: 1000 },
  { label: '≥ 5K', value: 5000 },
];

export function AdvancedFilterBar({ projects, filters, onFiltersChange }: AdvancedFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [activeLanguages, setActiveLanguages] = useState<string[]>([]);

  // Extract unique languages from projects
  const availableLanguages = LANGUAGE_OPTIONS.filter(lang =>
    projects.some(p => (p.keywords?.[0] || 'Unknown').toLowerCase() === lang.toLowerCase())
  );

  const hasActiveFilters =
    filters.language !== '' ||
    filters.minStars > 0 ||
    filters.minGrowth > 0 ||
    filters.timeRange !== 'all' ||
    filters.keyword.trim() !== '';

  const clearFilters = () => {
    setActiveLanguages([]);
    onFiltersChange({
      language: '',
      minStars: 0,
      minGrowth: 0,
      timeRange: 'all',
      keyword: '',
    });
  };

  return (
    <div className="mb-4">
      {/* Filter Toggle Bar */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-github-purple/20 text-github-purple border border-github-purple/50'
              : 'bg-github-card border border-github-border text-github-muted hover:text-github-text hover:border-github-purple/50'
          }`}
        >
          <span>🔍</span>
          <span>高级筛选</span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-github-purple text-white">
             !
            </span>
          )}
        </button>

        {/* Quick keyword monitoring input */}
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-github-muted text-sm">🔑</span>
            <input
              type="text"
              value={filters.keyword}
              onChange={e => onFiltersChange({ ...filters, keyword: e.target.value })}
              placeholder="监控关键词..."
              className="w-full pl-8 pr-3 py-1.5 bg-github-card border border-github-border rounded text-github-text text-sm placeholder-github-muted focus:outline-none focus:border-github-purple transition-colors"
            />
            {filters.keyword && (
              <button
                onClick={() => onFiltersChange({ ...filters, keyword: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-github-muted hover:text-github-text text-sm"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-github-purple hover:underline"
          >
            清除全部
          </button>
        )}
      </div>

      {/* Expanded Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-github-card border border-github-border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Language Filter */}
            <div>
              <label className="block text-github-muted text-xs mb-2 uppercase tracking-wider">语言</label>
              <select
                value={filters.language}
                onChange={e => onFiltersChange({ ...filters, language: e.target.value })}
                className="w-full px-3 py-2 bg-github-dark border border-github-border rounded text-github-text text-sm focus:outline-none focus:border-github-purple transition-colors"
              >
                <option value="">全部语言</option>
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Stars Filter */}
            <div>
              <label className="block text-github-muted text-xs mb-2 uppercase tracking-wider">最低 Stars</label>
              <select
                value={filters.minStars}
                onChange={e => onFiltersChange({ ...filters, minStars: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-github-dark border border-github-border rounded text-github-text text-sm focus:outline-none focus:border-github-purple transition-colors"
              >
                {STAR_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Growth Filter */}
            <div>
              <label className="block text-github-muted text-xs mb-2 uppercase tracking-wider">最低增长</label>
              <select
                value={filters.minGrowth}
                onChange={e => onFiltersChange({ ...filters, minGrowth: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-github-dark border border-github-border rounded text-github-text text-sm focus:outline-none focus:border-github-purple transition-colors"
              >
                {GROWTH_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-github-muted text-xs mb-2 uppercase tracking-wider">时间范围</label>
              <select
                value={filters.timeRange}
                onChange={e => onFiltersChange({ ...filters, timeRange: e.target.value as FilterState['timeRange'] })}
                className="w-full px-3 py-2 bg-github-dark border border-github-border rounded text-github-text text-sm focus:outline-none focus:border-github-purple transition-colors"
              >
                <option value="all">全部时间</option>
                <option value="day">今日</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
              </select>
            </div>
          </div>

          {/* Multi-language quick toggle */}
          {availableLanguages.length > 0 && (
            <div className="mt-4">
              <label className="block text-github-muted text-xs mb-2 uppercase tracking-wider">快速语言标签</label>
              <div className="flex flex-wrap gap-1.5">
                {availableLanguages.map(lang => {
                  const count = projects.filter(p => (p.keywords?.[0] || 'Unknown') === lang).length;
                  return (
                    <button
                      key={lang}
                      onClick={() => {
                        const newFilters = { ...filters };
                        const langs = activeLanguages.includes(lang)
                          ? activeLanguages.filter(l => l !== lang)
                          : [...activeLanguages, lang];
                        newFilters.language = langs.join(',');
                        onFiltersChange(newFilters);
                        setActiveLanguages(langs);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        activeLanguages.includes(lang)
                          ? 'bg-github-purple/20 text-github-purple border border-github-purple/50'
                          : 'bg-github-dark text-github-muted border border-github-border hover:text-github-purple hover:border-github-purple/50'
                      }`}
                    >
                      <span>{lang}</span>
                      <span className="opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Utility function to apply filters to projects
export function applyFilters(projects: TrendingProject[], filters: FilterState): TrendingProject[] {
  return projects.filter(p => {
    // Language filter (comma-separated multi-language support)
    if (filters.language) {
      const langs = filters.language.split(',').map(l => l.trim().toLowerCase());
      const projectLang = (p.keywords?.[0] || 'Unknown').toLowerCase();
      if (!langs.includes(projectLang)) return false;
    }

    // Stars filter
    if (filters.minStars > 0) {
      const stars = parseInt(p.totalStars.replace(/,/g, '')) || 0;
      if (stars < filters.minStars) return false;
    }

    // Growth filter
    if (filters.minGrowth > 0) {
      if ((p.growthValue || 0) < filters.minGrowth) return false;
    }

    // Keyword filter (search in name, description, and keywords)
    if (filters.keyword.trim()) {
      const q = filters.keyword.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(q);
      const matchesDesc = p.description.toLowerCase().includes(q);
      const matchesKw = p.keywords.some(k => k.toLowerCase().includes(q));
      if (!matchesName && !matchesDesc && !matchesKw) return false;
    }

    return true;
  });
}
