import { useState, useEffect, lazy, Suspense } from 'react';
import { Header, TabButton, ProjectList, AdvancedFilterBar, applyFilters, TopicTrendingView, ExportPanel, ErrorBoundary, FullPageSkeleton, SharePoster, NotificationCenter, MobileBottomDock, BottomSheet } from './components';
import type { FilterState } from './components/AdvancedFilterBar';
import { loadTrendingFromFiles, loadSampleData } from './utils/loadData';
import type { TrendingData, FavoriteItem } from './types';
import type { GhUser } from './types';
import { getGhToken, forkRepo, parseRepoInfo, syncForkHistory, type ForkHistoryRecord } from './utils/github';
import { translateDescriptions } from './utils/translation';
import { getFavorites, getFollowedAuthors, createSharedList, getNewProjectsFromFollowedAuthors, addNotification } from './utils/social';

// Lazy-loaded heavy panels (code-split)
const FavoritesPanel = lazy(() => import('./components/FavoritesPanel'));
const SharedListView = lazy(() => import('./components/SharedListView'));
const FollowedAuthorsPanel = lazy(() => import('./components/FollowedAuthorsPanel'));
const RecommendationsPanel = lazy(() => import('./components/RecommendationsPanel'));
const TopicTrackingPanel = lazy(() => import('./components/TopicTrackingPanel'));
const ReportsPanel = lazy(() => import('./components/ReportsPanel'));
const CommentsPanel = lazy(() => import('./components/CommentsPanel'));
const ForkedProjectsPanel = lazy(() => import('./components/ForkedProjectsPanel'));

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
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'daily' | 'forked'>('weekly');
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ghUser, setGhUser] = useState<GhUser | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [batchForking, setBatchForking] = useState(false);
  const [batchResults, setBatchResults] = useState<{ name: string; success: boolean; url?: string; error?: string }[]>([]);
  const [forkHistory, setForkHistory] = useState<ForkHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Social features state
  const [showFavorites, setShowFavorites] = useState(false);
  const [showFollowedAuthors, setShowFollowedAuthors] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showTopicTracking, setShowTopicTracking] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [shareModal, setShareModal] = useState<{ id: string; url: string } | null>(null);
  const [newProjectsMap, setNewProjectsMap] = useState<Map<string, { name: string; link: string }[]>>(new Map());
  const [commentsProject, setCommentsProject] = useState<string | null>(null);
  const [sharePosterProjects, setSharePosterProjects] = useState<FavoriteItem[] | null>(null);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Mobile navigation overlay and filtering states
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Social counts for mobile drawer (mirror Header logic)
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [followedCount, setFollowedCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Update social counts dynamically
  useEffect(() => {
    setFavoritesCount(getFavorites().length);
    setFollowedCount(getFollowedAuthors().length);
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      setUnreadNotifications(notifications.filter((n: { read?: boolean }) => !n.read).length);
    } catch {
      setUnreadNotifications(0);
    }
  }, [showFavorites, showFollowedAuthors, data]);

  // Advanced filtering & view modes
  const [viewMode, setViewMode] = useState<'list' | 'topic'>('list');
  const [filters, setFilters] = useState<FilterState>({
    language: '',
    minStars: 0,
    minGrowth: 0,
    timeRange: 'all',
    keyword: '',
  });

  // Check for share URL parameter on mount
  const shareId = new URLSearchParams(window.location.search).get('share');

  useEffect(() => {
    // Check for tab and forked URL params
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const reposParam = params.get('repos');
    if (tabParam === 'repos') {
      setActiveTab('forked');
    }
    if (reposParam) {
      setForkedUsername(reposParam);
    }
  }, []);

  const [forkedUsername, setForkedUsername] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchData() {
      try {
        const trendingData = await loadTrendingFromFiles();
        const translatedWeekly = await translateDescriptions(trendingData.weekly ?? []);
        const translatedMonthly = await translateDescriptions(trendingData.monthly ?? []);
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
        const translatedWeekly = await translateDescriptions(sample.weekly ?? []);
        const translatedMonthly = await translateDescriptions(sample.monthly ?? []);
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

  useEffect(() => {
    if (data) {
      const allProjects = [
        ...safeData.weekly,
        ...safeData.monthly,
        ...(safeData.daily || []),
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
        addNotification({ type: 'fork', title: '⎈ Fork 失败', message: `${project.name}: 无法解析仓库信息` });
        continue;
      }
      const result = await forkRepo(info.owner, info.repo, token);
      results.push({ name: project.name, ...result });
      if (result.success && result.url) {
        addToForkHistory({ name: project.name, link: project.link, description: project.description, url: result.url });
        addNotification({ type: 'fork', title: '⎈ Fork 成功', message: `成功 Fork ${project.name}`, link: result.url });
        window.open(result.url, '_blank');
      } else {
        addNotification({ type: 'fork', title: '⎈ Fork 失败', message: `${project.name}: ${result.error || '未知错误'}` });
      }
      await new Promise(r => setTimeout(r, 500));
    }

    setBatchForking(false);
    setBatchResults(results);

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
    setFavoritesCount(getFavorites().length);
  };

  if (shareId) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-github-dark flex items-center justify-center"><div className="text-github-text">加载中...</div></div>}>
        <SharedListView shareId={shareId} />
      </Suspense>
    );
  }

  const safeData = data ?? { weekly: [], monthly: [], daily: [], lastUpdated: '' };
  const allProjects = activeTab === 'weekly' ? safeData.weekly : activeTab === 'monthly' ? safeData.monthly : (safeData.daily || []);
  const filteredProjects = applyFilters(allProjects, filters);

  // Mobile Bottom Dock Buttons Definition
  const mobileDockItems = [
    {
      icon: '📈',
      label: '周趋势',
      active: activeTab === 'weekly' && viewMode === 'list',
      onClick: () => { setActiveTab('weekly'); setViewMode('list'); }
    },
    {
      icon: '⚡',
      label: '今日趋势',
      active: activeTab === 'daily' && viewMode === 'list',
      onClick: () => { setActiveTab('daily'); setViewMode('list'); }
    },
    {
      icon: '🔍',
      label: '筛选',
      active: showMobileFilter,
      onClick: () => setShowMobileFilter(true)
    },
    {
      icon: '⭐',
      label: '收藏夹',
      badge: favoritesCount,
      onClick: () => setShowFavorites(true)
    },
    {
      icon: '🪄',
      label: '智能套件',
      onClick: () => setShowMobileMore(true)
    }
  ];

  return (
    <>
      {loading ? (
        <FullPageSkeleton />
      ) : (
        <ErrorBoundary>
          <div className="min-h-screen bg-github-dark pb-24 md:pb-8">
            <div className="max-w-4xl mx-auto px-4 py-8">
              <Header
                lastUpdated={safeData.lastUpdated}
                ghUser={ghUser}
                onGhUserChange={setGhUser}
                forkHistoryCount={forkHistory.length}
                onForkHistorySync={setForkHistory}
                onShowHistory={() => setShowHistory(true)}
                projects={[...safeData.weekly, ...safeData.monthly, ...(safeData.daily || [])]}
                onShowFavorites={() => setShowFavorites(true)}
                onShowFollowedAuthors={() => setShowFollowedAuthors(true)}
                onShowRecommendations={() => setShowRecommendations(true)}
                onShowTopicTracking={() => setShowTopicTracking(true)}
                onShowReports={() => setShowReports(true)}
                onShowNotificationCenter={() => setShowNotificationCenter(true)}
                onShowExport={() => setShowExport(true)}
              />

              {/* Tabs Section - Desktop and Tablet Only */}
              <div className="flex items-center justify-between border-b border-github-border/10 mb-6 pb-2 hide-mobile">
                <div className="flex gap-2">
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
                  <TabButton
                    active={activeTab === 'forked'}
                    label="📦 Repositories"
                    onClick={() => setActiveTab('forked')}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-github-purple/15 text-github-purple border border-github-purple/30'
                        : 'text-github-muted hover:text-github-text'
                    }`}
                  >
                    📋 列表
                  </button>
                  <button
                    onClick={() => setViewMode('topic')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'topic'
                        ? 'bg-github-purple/15 text-github-purple border border-github-purple/30'
                        : 'text-github-muted hover:text-github-text'
                    }`}
                  >
                    🏷 话题趋势
                  </button>
                </div>
              </div>

              {/* Advanced Filter Bar - Desktop Only */}
              <div className="hide-mobile">
                <AdvancedFilterBar
                  projects={allProjects}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>

              {/* Batch Fork Bar - Sleek Glass Panel */}
              <div className="mb-6 p-4 glass-panel rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm font-semibold text-github-purple hover:underline"
                    >
                      {selectedProjects.size === filteredProjects.length ? '取消全选' : '全选'}
                    </button>
                    <span className="text-github-muted text-sm font-mono-tabular">
                      已选择 <span className="text-github-purple font-bold">{selectedProjects.size}</span> 个项目
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleShareSelected}
                      disabled={selectedProjects.size === 0}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-github-dark border border-github-border/60 text-github-text hover:border-github-purple/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      🔗 分享列表
                    </button>
                    {selectedProjects.size > 0 && (
                      <button
                        onClick={() => {
                          const allProjects = [
                            ...(data?.weekly || []),
                            ...(data?.monthly || []),
                            ...(data?.daily || []),
                          ];
                          const selected = allProjects.filter(p => selectedProjects.has(p.name));
                          const favorites = getFavorites();
                          const posterProjects = selected.map(p => {
                            const existing = favorites.find(f => f.name === p.name);
                            return {
                              name: p.name,
                              link: p.link,
                              description: p.description,
                              starredAt: existing?.starredAt || new Date().toLocaleString(),
                            };
                          });
                          setSharePosterProjects(posterProjects);
                        }}
                        className="px-4 py-2 text-xs font-bold rounded-lg bg-github-dark border border-github-border/60 text-github-text hover:border-github-purple/50 transition-all cursor-pointer"
                      >
                        🖼️ 生成海报
                      </button>
                    )}
                    <button
                      onClick={handleBatchFork}
                      disabled={selectedProjects.size === 0 || batchForking}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-github-purple text-white hover:bg-github-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {batchForking ? '批量 Forking...' : `⎈ 批量 Fork (${selectedProjects.size})`}
                    </button>
                  </div>
                </div>

                {/* Batch Results */}
                {batchResults.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-github-border/10">
                    <div className="flex flex-wrap gap-2">
                      {batchResults.map((r, i) => (
                        <span key={i} className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                          r.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {r.name.split('/')[1] || r.name}: {r.success ? '✓' : '✗'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Core Content Feed */}
              {activeTab === 'forked' ? (
                <Suspense fallback={<div className="text-github-text text-center py-12">加载中...</div>}>
                  <ForkedProjectsPanel ghUser={ghUser} initialUsername={forkedUsername} />
                </Suspense>
              ) : viewMode === 'list' ? (
                <ProjectList
                  projects={filteredProjects}
                  type={activeTab}
                  selectedProjects={selectedProjects}
                  onToggleSelect={handleToggleSelect}
                  onFavoritesChange={handleFavoritesChange}
                  onShowComments={(projectName) => setCommentsProject(projectName)}
                  highlightKeyword={filters.keyword}
                />
              ) : (
                <TopicTrendingView
                  projects={filteredProjects}
                  selectedProjects={selectedProjects}
                  onToggleSelect={handleToggleSelect}
                  onFavoritesChange={handleFavoritesChange}
                  onShowComments={(projectName) => setCommentsProject(projectName)}
                />
              )}
            </div>

            {/* Mobile Navigation Dock */}
            <MobileBottomDock items={mobileDockItems} />

            {/* Mobile Bottom Sheet: Advanced Filter */}
            <BottomSheet
              isOpen={showMobileFilter}
              onClose={() => setShowMobileFilter(false)}
              title="高级筛选过滤器"
            >
              <AdvancedFilterBar
                projects={allProjects}
                filters={filters}
                onFiltersChange={setFilters}
              />
            </BottomSheet>

            {/* Mobile Bottom Sheet: Toolkit Panel */}
            <BottomSheet
              isOpen={showMobileMore}
              onClose={() => setShowMobileMore(false)}
              title="极客智能分析套件"
            >
              <div className="grid grid-cols-2 gap-3 pb-8">
                <button
                  onClick={() => { setShowMobileMore(false); setShowHistory(true); }}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 cursor-pointer"
                  style={{ minHeight: '80px' }}
                >
                  <span className="text-2xl mb-1">📋</span>
                  <span className="text-xs font-semibold text-github-text">Fork 历史</span>
                  <span className="text-[10px] text-github-muted mt-1 font-mono-tabular">{forkHistory.length} 项记录</span>
                </button>
                <button
                  onClick={() => { setShowMobileMore(false); setShowFollowedAuthors(true); }}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 cursor-pointer"
                  style={{ minHeight: '80px' }}
                >
                  <span className="text-2xl mb-1">👁</span>
                  <span className="text-xs font-semibold text-github-text">关注作者</span>
                  <span className="text-[10px] text-github-muted mt-1 font-mono-tabular">{followedCount} 人已关注</span>
                </button>
                <button
                  onClick={() => { setShowMobileMore(false); setShowTopicTracking(true); }}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 cursor-pointer"
                  style={{ minHeight: '80px' }}
                >
                  <span className="text-2xl mb-1">🏷</span>
                  <span className="text-xs font-semibold text-github-text">话题追踪</span>
                </button>
                <button
                  onClick={() => { setShowMobileMore(false); setShowReports(true); }}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 cursor-pointer"
                  style={{ minHeight: '80px' }}
                >
                  <span className="text-2xl mb-1">📊</span>
                  <span className="text-xs font-semibold text-github-text">报告中心</span>
                </button>
                <button
                  onClick={() => { setShowMobileMore(false); setShowRecommendations(true); }}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 cursor-pointer"
                  style={{ minHeight: '80px' }}
                >
                  <span className="text-2xl mb-1">🎯</span>
                  <span className="text-xs font-semibold text-github-text">智能推荐</span>
                </button>
                <button
                  onClick={() => { setShowMobileMore(false); setShowNotificationCenter(true); }}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 cursor-pointer"
                  style={{ minHeight: '80px' }}
                >
                  <span className="text-2xl mb-1">🔔</span>
                  <span className="text-xs font-semibold text-github-text">通知中心</span>
                  {unreadNotifications > 0 && <span className="text-[9px] bg-red-500 text-white px-1.5 rounded-full mt-1 font-mono-tabular">{unreadNotifications} 未读</span>}
                </button>
                <button
                  onClick={() => { setShowMobileMore(false); setShowExport(true); }}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 cursor-pointer"
                  style={{ minHeight: '80px' }}
                >
                  <span className="text-2xl mb-1">📥</span>
                  <span className="text-xs font-semibold text-github-text">导出数据</span>
                </button>
              </div>
            </BottomSheet>

            {/* Desktop Panels & Modals */}
            {showFavorites && (
              <Suspense fallback={<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div className="text-github-text">加载中...</div></div>}>
                <FavoritesPanel
                  onClose={() => setShowFavorites(false)}
                  onSelectProjects={handleShareFromFavorites}
                />
              </Suspense>
            )}

            {showFollowedAuthors && (
              <Suspense fallback={<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div className="text-github-text">加载中...</div></div>}>
                <FollowedAuthorsPanel
                  onClose={() => setShowFollowedAuthors(false)}
                  newProjectsMap={newProjectsMap}
                />
              </Suspense>
            )}

            {showRecommendations && (
              <Suspense fallback={<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div className="text-github-text">加载中...</div></div>}>
                <RecommendationsPanel
                  allProjects={[...safeData.weekly, ...safeData.monthly, ...(safeData.daily || []).map(p => ({ ...p, starredAt: new Date().toLocaleString() }))]}
                  onClose={() => setShowRecommendations(false)}
                />
              </Suspense>
            )}

            {showTopicTracking && (
              <Suspense fallback={<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div className="text-github-text">加载中...</div></div>}>
                <TopicTrackingPanel
                  allProjects={[...safeData.weekly, ...safeData.monthly, ...(safeData.daily || [])]}
                  onClose={() => setShowTopicTracking(false)}
                  onShowRecommendations={() => {
                    setShowTopicTracking(false);
                    setShowRecommendations(true);
                  }}
                />
              </Suspense>
            )}

            {showReports && (
              <Suspense fallback={<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div className="text-github-text">加载中...</div></div>}>
                <ReportsPanel
                  weeklyProjects={safeData.weekly}
                  dailyProjects={safeData.daily || []}
                  onClose={() => setShowReports(false)}
                />
              </Suspense>
            )}

            {commentsProject && (
              <Suspense fallback={<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div className="text-github-text">加载中...</div></div>}>
                <CommentsPanel
                  projectName={commentsProject}
                  onClose={() => setCommentsProject(null)}
                />
              </Suspense>
            )}

            {sharePosterProjects && (
              <SharePoster
                projects={sharePosterProjects}
                onClose={() => setSharePosterProjects(null)}
              />
            )}

            {showNotificationCenter && (
              <NotificationCenter onClose={() => setShowNotificationCenter(false)} />
            )}

            {shareModal && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShareModal(null)}>
                <div className="bg-github-card border border-github-border rounded-xl p-6 w-[450px] max-w-[90vw] shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-github-text">🔗 分享链接已生成</h2>
                    <button onClick={() => setShareModal(null)} className="text-github-muted hover:text-github-text text-2xl leading-none cursor-pointer">&times;</button>
                  </div>
                  <div className="mb-4">
                    <p className="text-github-muted text-xs mb-2">复制以下链接分享给其他人：</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareModal.url}
                        readOnly
                        className="flex-1 px-3 py-2 bg-github-dark border border-github-border rounded-lg text-github-text text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareModal.url);
                          alert('链接已复制到剪贴板');
                        }}
                        className="px-4 py-2 bg-github-purple text-white text-xs font-bold rounded-lg hover:bg-github-purple/80 transition-colors cursor-pointer"
                      >
                        复制
                      </button>
                    </div>
                  </div>
                  <p className="text-github-muted text-[10px] text-center">
                    分享数据存储在本地，接收方打开链接即可查看
                  </p>
                </div>
              </div>
            )}

            {showHistory && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowHistory(false)}>
                <div className="bg-github-card border border-github-border rounded-xl p-6 w-[600px] max-w-[90vw] max-h-[80vh] overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-github-text">📋 Fork 历史</h2>
                    <button onClick={() => setShowHistory(false)} className="text-github-muted hover:text-github-text text-2xl leading-none cursor-pointer">&times;</button>
                  </div>
                  {forkHistory.length === 0 ? (
                    <p className="text-github-muted text-center py-8 text-sm">暂无 Fork 记录</p>
                  ) : (
                    <div className="space-y-3">
                      {forkHistory.map((item, i) => (
                        <a
                          key={i}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3.5 bg-github-dark border border-github-border/40 rounded-xl hover:border-github-purple/30 hover:bg-zinc-900 transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-github-purple font-bold text-sm">{item.name}</span>
                            <span className="text-github-muted text-[10px] font-mono font-bold">{item.forkedAt}</span>
                          </div>
                          <p className="text-github-muted text-xs line-clamp-1">{item.description}</p>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {showExport && data && (
              <ExportPanel
                projects={filteredProjects}
                onClose={() => setShowExport(false)}
              />
            )}
          </div>
        </ErrorBoundary>
      )}
    </>
  );
}

export default App;
