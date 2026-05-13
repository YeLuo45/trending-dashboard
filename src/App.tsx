import { useState, useEffect } from 'react';
import { Header, TabButton, ProjectList, FavoritesPanel, SharedListView, FollowedAuthorsPanel } from './components';
import { loadTrendingFromFiles, loadSampleData } from './utils/loadData';
import type { TrendingData } from './types';
import type { GhUser } from './types';
import { getGhToken, forkRepo, parseRepoInfo, syncForkHistory, type ForkHistoryRecord } from './utils/github';
import { translateDescriptions } from './utils/translation';
import { getFavorites, createSharedList, getNewProjectsFromFollowedAuthors } from './utils/social';

const FORK_HISTORY_KEY = 'fork_history';

export interface ForkHistoryItem extends ForkHistoryRecord {}

function getForkHistory(): ForkHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(FORK_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function addToForkHistory(item: Omit<ForkHistoryItem, 'forkedAt'>): void {
  const history = getForkHistory();
  if (!history.some(h => h.name === item.name)) {
    history.unshift({ ...item, forkedAt: new Date().toLocaleString() });
    localStorage.setItem(FORK_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'daily'>('weekly');
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ghUser, setGhUser] = useState<GhUser | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [batchForking, setBatchForking] = useState(false);
  const [batchResults, setBatchResults] = useState<{ name: string; success: boolean; url?: string; error?: string }[]>([]);
  const [forkHistory, setForkHistory] = useState<ForkHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Social features state
  const [showFavorites, setShowFavorites] = useState(false);
  const [showFollowedAuthors, setShowFollowedAuthors] = useState(false);
  const [shareModal, setShareModal] = useState<{ id: string; url: string } | null>(null);
  const [newProjectsMap, setNewProjectsMap] = useState<Map<string, { name: string; link: string }[]>>(new Map());

  // Check for share URL parameter on mount
  const shareId = new URLSearchParams(window.location.search).get('share');

  useEffect(() => {
    async function fetchData() {
      try {
        const trendingData = await loadTrendingFromFiles();
        const translatedWeekly = await translateDescriptions(trendingData.weekly);
        const translatedMonthly = await translateDescriptions(trendingData.monthly);
        const translatedDaily = trendingData.daily ? await translateDescriptions(trendingData.daily) : [];
        setData({
          ...trendingData,
          weekly: translatedWeekly,
          monthly: translatedMonthly,
          daily: translatedDaily,
        });
      } catch (error) {
        console.error('Failed to load data:', error);
        const sample = loadSampleData();
        const translatedWeekly = await translateDescriptions(sample.weekly);
        const translatedMonthly = await translateDescriptions(sample.monthly);
        const translatedDaily = sample.daily ? await translateDescriptions(sample.daily) : [];
        setData({
          ...sample,
          weekly: translatedWeekly,
          monthly: translatedMonthly,
          daily: translatedDaily,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const token = getGhToken();
    if (token) {
      // Load remote fork history and merge with local
      syncForkHistory(getForkHistory(), token).then(result => {
        if (result.updated) {
          setForkHistory(result.records);
          localStorage.setItem(FORK_HISTORY_KEY, JSON.stringify(result.records.slice(0, 50)));
        } else if (result.error) {
          console.warn('Fork history sync failed:', result.error);
          setForkHistory(getForkHistory());
        } else {
          setForkHistory(result.records);
        }
      }).catch(() => {
        setForkHistory(getForkHistory());
      });
    } else {
      setForkHistory(getForkHistory());
    }
  }, []);

  // Update new projects from followed authors when data changes
  useEffect(() => {
    if (data) {
      const allProjects = [
        ...data.weekly,
        ...data.monthly,
        ...(data.daily || []),
      ];
      const newProjects = getNewProjectsFromFollowedAuthors(allProjects);
      const map = new Map<string, { name: string; link: string }[]>();
      newProjects.forEach(({ username, projects }) => {
        map.set(username.toLowerCase(), projects);
      });
      setNewProjectsMap(map);
    }
  }, [data]);

  const handleToggleSelect = (name: string) => {
    setSelectedProjects(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!data) return;
    const projects = activeTab === 'weekly' ? data.weekly : activeTab === 'monthly' ? data.monthly : (data.daily || []);
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(projects.map(p => p.name)));
    }
  };

  const handleBatchFork = async () => {
    const token = getGhToken();
    if (!token) {
      setBatchResults([{ name: 'all', success: false, error: '请先在设置中配置 GitHub Token' }]);
      return;
    }
    if (selectedProjects.size === 0) return;

    const projects = activeTab === 'weekly' ? data!.weekly : activeTab === 'monthly' ? data!.monthly : (data!.daily || []);
    const selected = projects.filter(p => selectedProjects.has(p.name));

    setBatchForking(true);
    setBatchResults([]);

    const results: typeof batchResults = [];
    for (const project of selected) {
      const info = parseRepoInfo(project.link);
      if (!info) {
        results.push({ name: project.name, success: false, error: '无法解析仓库信息' });
        continue;
      }
      const result = await forkRepo(info.owner, info.repo, token);
      results.push({ name: project.name, ...result });
      if (result.success && result.url) {
        addToForkHistory({ name: project.name, link: project.link, description: project.description, url: result.url });
        window.open(result.url, '_blank');
      }
      await new Promise(r => setTimeout(r, 500));
    }

    setBatchForking(false);
    setBatchResults(results);

    // Sync to remote after batch fork
    if (token) {
      syncForkHistory(getForkHistory(), token).then(result => {
        if (result.updated) {
          setForkHistory(result.records);
          localStorage.setItem(FORK_HISTORY_KEY, JSON.stringify(result.records.slice(0, 50)));
        }
      });
    }
    setForkHistory(getForkHistory());
  };

  // Handle share from favorites panel
  const handleShareFromFavorites = (projectNames: string[]) => {
    const favorites = getFavorites();
    const selectedFavorites = favorites.filter(f => projectNames.includes(f.name));
    
    if (selectedFavorites.length === 0) {
      alert('请选择要分享的项目');
      return;
    }

    const id = createSharedList(selectedFavorites);
    const url = `${window.location.origin}${window.location.pathname}?share=${id}`;
    setShareModal({ id, url });
    setShowFavorites(false);
  };

  // Handle share from current selection
  const handleShareSelected = () => {
    if (selectedProjects.size === 0) return;

    const allProjects = [
      ...(data?.weekly || []),
      ...(data?.monthly || []),
      ...(data?.daily || []),
    ];
    const selected = allProjects.filter(p => selectedProjects.has(p.name));

    const favorites = getFavorites();
    const sharedProjects = selected.map(p => {
      const existing = favorites.find(f => f.name === p.name);
      return {
        name: p.name,
        link: p.link,
        description: p.description,
        starredAt: existing?.starredAt || new Date().toLocaleString(),
      };
    });

    const id = createSharedList(sharedProjects);
    const url = `${window.location.origin}${window.location.pathname}?share=${id}`;
    setShareModal({ id, url });
  };

  const handleFavoritesChange = () => {
    // Force re-render to update favorite counts in header
    setShowFavorites(prev => !prev || true);
  };

  // Render share view if URL has share parameter
  if (shareId) {
    return <SharedListView shareId={shareId} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-github-dark">
        <div className="text-github-purple text-lg">翻译中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-github-dark">
        <div className="text-github-muted">暂无数据</div>
      </div>
    );
  }

  const allProjects = activeTab === 'weekly' ? data.weekly : activeTab === 'monthly' ? data.monthly : (data.daily || []);

  // Filter projects by search query
  const filteredProjects = searchQuery.trim()
    ? allProjects.filter(p => {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.keywords.some(k => k.toLowerCase().includes(q))
        );
      })
    : allProjects;

  return (
    <div className="min-h-screen bg-github-dark">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Header
          lastUpdated={data.lastUpdated}
          ghUser={ghUser}
          onGhUserChange={setGhUser}
          forkHistoryCount={forkHistory.length}
          onShowHistory={() => setShowHistory(true)}
          projects={[...data.weekly, ...data.monthly, ...(data.daily || [])]}
          onShowFavorites={() => setShowFavorites(true)}
          onShowFollowedAuthors={() => setShowFollowedAuthors(true)}
        />

        {/* Tabs */}
        <div className="flex border-b border-github-border mb-4">
          <TabButton
            active={activeTab === 'weekly'}
            label="📈 本周增长"
            onClick={() => setActiveTab('weekly')}
          />
          <TabButton
            active={activeTab === 'monthly'}
            label="🔥 本月最热"
            onClick={() => setActiveTab('monthly')}
          />
          <TabButton
            active={activeTab === 'daily'}
            label="⚡ 今日趋势"
            onClick={() => setActiveTab('daily')}
          />
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索项目名称、描述或标签..."
            className="w-full px-4 py-2 bg-github-card border border-github-border rounded text-github-text text-sm placeholder-github-muted focus:outline-none focus:border-github-purple transition-colors"
          />
          {searchQuery && (
            <p className="text-github-muted text-xs mt-2">
              找到 <span className="text-github-purple">{filteredProjects.length}</span> 个结果
              <button onClick={() => setSearchQuery('')} className="ml-3 text-github-purple hover:underline">清除</button>
            </p>
          )}
        </div>

        {/* Batch Fork Bar */}
        <div className="mb-6 p-4 bg-github-card border border-github-border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSelectAll}
                className="text-sm text-github-purple hover:underline"
              >
                {selectedProjects.size === filteredProjects.length ? '取消全选' : '全选'}
              </button>
              <span className="text-github-muted text-sm">
                已选择 <span className="text-github-purple font-medium">{selectedProjects.size}</span> 个项目
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareSelected}
                disabled={selectedProjects.size === 0}
                className="px-4 py-2 text-sm rounded bg-github-card border border-github-border text-github-text hover:border-github-purple/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                🔗 生成分享
              </button>
              <button
                onClick={handleBatchFork}
                disabled={selectedProjects.size === 0 || batchForking}
                className="px-4 py-2 text-sm rounded bg-github-purple text-white hover:bg-github-purple/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {batchForking ? '批量 Forking...' : `⎈ 批量 Fork (${selectedProjects.size})`}
              </button>
            </div>
          </div>

          {/* Batch Results */}
          {batchResults.length > 0 && (
            <div className="mt-3 pt-3 border-t border-github-border">
              <div className="flex flex-wrap gap-2">
                {batchResults.map((r, i) => (
                  <span key={i} className={`text-xs px-2 py-1 rounded ${
                    r.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {r.name.split('/')[1] || r.name}: {r.success ? '✓' : '✗'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <ProjectList
          projects={filteredProjects}
          type={activeTab}
          selectedProjects={selectedProjects}
          onToggleSelect={handleToggleSelect}
          onFavoritesChange={handleFavoritesChange}
        />
      </div>

      {/* Favorites Panel */}
      {showFavorites && (
        <FavoritesPanel
          onClose={() => setShowFavorites(false)}
          onSelectProjects={handleShareFromFavorites}
        />
      )}

      {/* Followed Authors Panel */}
      {showFollowedAuthors && (
        <FollowedAuthorsPanel
          onClose={() => setShowFollowedAuthors(false)}
          newProjectsMap={newProjectsMap}
        />
      )}

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShareModal(null)}>
          <div className="bg-github-card border border-github-border rounded-lg p-6 w-[450px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-github-text">🔗 分享链接已生成</h2>
              <button onClick={() => setShareModal(null)} className="text-github-muted hover:text-github-text text-2xl leading-none">&times;</button>
            </div>
            <div className="mb-4">
              <p className="text-github-muted text-sm mb-2">复制以下链接分享给其他人：</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareModal.url}
                  readOnly
                  className="flex-1 px-3 py-2 bg-github-dark border border-github-border rounded text-github-text text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareModal.url);
                    alert('链接已复制到剪贴板');
                  }}
                  className="px-4 py-2 bg-github-purple text-white rounded hover:bg-github-purple/80 transition-colors"
                >
                  复制
                </button>
              </div>
            </div>
            <p className="text-github-muted text-xs text-center">
              分享数据存储在本地，接收方打开链接即可查看
            </p>
          </div>
        </div>
      )}

      {/* Fork History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowHistory(false)}>
          <div className="bg-github-card border border-github-border rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-github-text">📋 Fork 历史</h2>
              <button onClick={() => setShowHistory(false)} className="text-github-muted hover:text-github-text text-2xl leading-none">&times;</button>
            </div>
            {forkHistory.length === 0 ? (
              <p className="text-github-muted text-center py-8">暂无 Fork 记录</p>
            ) : (
              <div className="space-y-3">
                {forkHistory.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-github-dark rounded hover:bg-github-dark/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-github-purple font-medium">{item.name}</span>
                      <span className="text-github-muted text-xs">{item.forkedAt}</span>
                    </div>
                    <p className="text-github-muted text-sm mt-1 line-clamp-1">{item.description}</p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
