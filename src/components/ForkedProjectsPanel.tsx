import { useState, useEffect, useRef, useCallback } from 'react';
import type { ForkedRepo } from '../types';
import { fetchUserForks, getGhToken, forkRepo } from '../utils/github';
import { ProjectCardSkeleton } from './Skeleton';
import { addFavorite, removeFavorite, isFavorited } from '../utils/social';
import { addNotification } from '../utils/social';

interface ForkedProjectsPanelProps {
  ghUser: { login: string } | null;
  initialUsername?: string;
}

type SortKey = 'stargazers_count' | 'forks_count' | 'fork_time';

export default function ForkedProjectsPanel({ ghUser, initialUsername }: ForkedProjectsPanelProps) {
  const [username, setUsername] = useState(initialUsername || ghUser?.login || '');
  const [inputValue, setInputValue] = useState(initialUsername || ghUser?.login || '');
  const [repos, setRepos] = useState<ForkedRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('fork_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [forkingMap, setForkingMap] = useState<Record<string, boolean>>({});
  const [forkedSet, setForkedSet] = useState<Set<string>>(new Set());

  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Check if current user's forked repos
  const currentUserLogin = ghUser?.login;

  // Load initial username from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUsername = params.get('forked');
    if (urlUsername) {
      setUsername(urlUsername);
      setInputValue(urlUsername);
    }
  }, []);

  // Update URL params
  useEffect(() => {
    if (username) {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', 'forked');
      params.set('forked', username);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [username]);

  const fetchForks = useCallback(async (user: string, pageNum: number, append: boolean) => {
    if (!user.trim()) {
      setError('请输入 GitHub 用户名');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getGhToken();
      const result = await fetchUserForks(user, pageNum, token || undefined);

      if (append) {
        setRepos(prev => [...prev, ...result.repos]);
      } else {
        setRepos(result.repos);
      }
      setHasMore(result.hasMore);
      setPage(pageNum);

      // Check which repos are already forked by current user
      if (currentUserLogin && token) {
        // We'll check each repo's fork status by checking if current user has forked it
        checkForkedRepos(result.repos, user, token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败');
      if (!append) setRepos([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserLogin]);

  const checkForkedRepos = async (repoList: ForkedRepo[], _targetUser: string, token: string) => {
    // For each repo, check if the current user has forked the parent
    // This is a simplified check - we just mark repos as "forked by this user" if they appear in their fork list
    // Since we're fetching the target user's forks, we can check if current user also has a fork of the same parent
    const forked = new Set<string>();
    for (const repo of repoList) {
      // Check if the current user has already forked this repo
      try {
        const res = await fetch(
          `https://api.github.com/repos/${currentUserLogin}/${repo.source_full_name.split('/')[1]}`,
          { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.fork && data.parent?.full_name === repo.source_full_name) {
            forked.add(repo.full_name);
          }
        }
      } catch {
        // Ignore errors in checking
      }
    }
    setForkedSet(forked);
  };

  const handleSearch = () => {
    if (inputValue.trim()) {
      setUsername(inputValue.trim());
      setRepos([]);
      setPage(1);
      fetchForks(inputValue.trim(), 1, false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Load more when scrolling to bottom
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          loadingRef.current = true;
          fetchForks(username, page + 1, true).finally(() => {
            loadingRef.current = false;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, username, page, fetchForks]);

  // Sort repos
  const sortedRepos = [...repos].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;

    if (sortKey === 'fork_time') {
      aVal = new Date(a.fork_time).getTime();
      bVal = new Date(b.fork_time).getTime();
    } else if (sortKey === 'stargazers_count') {
      aVal = a.stargazers_count;
      bVal = b.stargazers_count;
    } else {
      aVal = a.forks_count;
      bVal = b.forks_count;
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const handleFork = async (repo: ForkedRepo, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = getGhToken();
    if (!token) {
      addNotification({ type: 'fork', title: '⎈ Fork 失败', message: '请先在设置中配置 GitHub Token' });
      return;
    }

    // Fork from source repo
    const sourceInfo = repo.source_full_name.split('/');
    if (sourceInfo.length !== 2) {
      addNotification({ type: 'fork', title: '⎈ Fork 失败', message: '无法解析上游仓库信息' });
      return;
    }

    setForkingMap(prev => ({ ...prev, [repo.full_name]: true }));

    try {
      const result = await forkRepo(sourceInfo[0], sourceInfo[1], token);
      if (result.success && result.url) {
        setForkedSet(prev => new Set([...prev, repo.full_name]));
        addNotification({ type: 'fork', title: '⎈ Fork 成功', message: `成功 Fork ${repo.source_full_name}`, link: result.url });
        window.open(result.url, '_blank');
      } else {
        addNotification({ type: 'fork', title: '⎈ Fork 失败', message: `${repo.source_full_name}: ${result.error || '未知错误'}` });
      }
    } finally {
      setForkingMap(prev => ({ ...prev, [repo.full_name]: false }));
    }
  };

  const handleToggleFavorite = (repo: ForkedRepo, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFavorited(repo.full_name)) {
      removeFavorite(repo.full_name);
    } else {
      addFavorite({
        name: repo.full_name,
        link: repo.html_url,
        description: repo.description || '',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const languageColors: Record<string, string> = {
    Python: 'bg-yellow-400',
    TypeScript: 'bg-blue-400',
    JavaScript: 'bg-yellow-300',
    Go: 'bg-cyan-400',
    Rust: 'bg-orange-500',
    Java: 'bg-red-500',
    'Jupyter Notebook': 'bg-orange-400',
    Swift: 'bg-orange-300',
    Kotlin: 'bg-purple-500',
    Dart: 'bg-blue-300',
    Ruby: 'bg-red-400',
    PHP: 'bg-purple-400',
    'C++': 'bg-pink-400',
    C: 'bg-gray-400',
    Shell: 'bg-green-500',
  };
  const langColor = (lang: string | null) => languageColors[lang || ''] || 'bg-gray-400';

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="p-4 bg-github-card border border-github-border rounded-lg">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入 GitHub 用户名..."
            className="flex-1 px-4 py-2 bg-github-dark border border-github-border rounded-lg text-github-text placeholder-github-muted focus:outline-none focus:border-github-purple"
          />
          {ghUser && (
            <button
              onClick={() => {
                setInputValue(ghUser.login);
                setUsername(ghUser.login);
                setRepos([]);
                setPage(1);
                fetchForks(ghUser.login, 1, false);
              }}
              className="px-3 py-2 text-sm bg-github-purple/20 text-github-purple border border-github-purple/50 rounded-lg hover:bg-github-purple/30 transition-colors"
            >
              我的账号 ({ghUser.login})
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={loading || !inputValue.trim()}
            className="px-6 py-2 bg-github-purple text-white rounded-lg hover:bg-github-purple/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '查询中...' : '查询'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && repos.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && repos.length > 0 && (
        <>
          {/* Sort Controls */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-github-muted">排序：</span>
            {[
              { key: 'fork_time' as SortKey, label: 'Fork 时间' },
              { key: 'stargazers_count' as SortKey, label: 'Stars' },
              { key: 'forks_count' as SortKey, label: 'Forks' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => handleSort(item.key)}
                className={`px-3 py-1 rounded transition-colors ${
                  sortKey === item.key
                    ? 'bg-github-purple/20 text-github-purple border border-github-purple/50'
                    : 'bg-github-card border border-github-border text-github-muted hover:text-github-text'
                }`}
              >
                {item.label} {sortKey === item.key && (sortDirection === 'desc' ? '↓' : '↑')}
              </button>
            ))}
            <span className="text-github-muted ml-2">共 {repos.length} 个</span>
          </div>

          {/* Repo List */}
          <div className="space-y-3">
            {sortedRepos.map(repo => (
              <div
                key={repo.full_name}
                className="bg-github-card border border-github-border rounded-lg p-4 hover:border-github-purple/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Repo Name & Link */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-github-purple hover:underline"
                      >
                        {repo.source_full_name.split('/')[1]}
                      </a>
                      <span className="text-github-muted">/</span>
                      <span className="text-github-muted text-sm">{repo.source_full_name.split('/')[0]}</span>
                      {forkedSet.has(repo.full_name) && (
                        <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                          已 Fork
                        </span>
                      )}
                      {/* Language Badge */}
                      {repo.language && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-github-dark">
                          <span className={`w-2 h-2 rounded-full ${langColor(repo.language)}`}></span>
                          <span className="text-github-muted">{repo.language}</span>
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {repo.description && (
                      <p className="text-github-muted text-sm mb-3 line-clamp-2">
                        {repo.description}
                      </p>
                    )}

                    {/* Source Repo Link */}
                    {repo.source_url && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-github-muted text-xs">上游：</span>
                        <a
                          href={repo.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-github-purple hover:underline flex items-center gap-1"
                        >
                          ↗ {repo.source_full_name}
                        </a>
                      </div>
                    )}

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-github-orange">★</span>
                        <span className="text-github-muted">{repo.stargazers_count.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-github-blue">⑂</span>
                        <span className="text-github-muted">{repo.forks_count.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-github-green">🍴</span>
                        <span className="text-github-muted">{formatDate(repo.fork_time)}</span>
                      </div>

                      {/* Actions */}
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={(e) => handleToggleFavorite(repo, e)}
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            isFavorited(repo.full_name)
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                              : 'bg-github-dark text-github-muted hover:text-yellow-400'
                          }`}
                        >
                          {isFavorited(repo.full_name) ? '★ 已收藏' : '☆ 收藏'}
                        </button>
                        {!forkedSet.has(repo.full_name) && (
                          <button
                            onClick={(e) => handleFork(repo, e)}
                            disabled={forkingMap[repo.full_name]}
                            className="px-3 py-1 text-xs rounded bg-github-purple/20 text-github-purple hover:bg-github-purple/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {forkingMap[repo.full_name] ? 'Forking...' : '⎈ Fork'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Trigger */}
          {hasMore && (
            <div ref={observerRef} className="py-4 text-center">
              {loading && <span className="text-github-muted">加载更多...</span>}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && repos.length === 0 && !error && username && (
        <div className="text-center py-12 text-github-muted">
          该用户没有公开的 Fork 项目
        </div>
      )}

      {/* Initial State */}
      {!loading && repos.length === 0 && !error && !username && (
        <div className="text-center py-12 text-github-muted">
          输入 GitHub 用户名查看其 Fork 的项目列表
        </div>
      )}
    </div>
  );
}
