import { useState, useEffect } from 'react';
import { Header, TabButton, ProjectList } from './components';
import { loadTrendingFromFiles, loadSampleData } from './utils/loadData';
import type { TrendingData } from './types';
import type { GhUser } from './types';
import { getGhToken, forkRepo, parseRepoInfo } from './utils/github';
import { translateDescriptions } from './utils/translation';

const FORK_HISTORY_KEY = 'fork_history';

export interface ForkHistoryItem {
  name: string;
  link: string;
  description: string;
  forkedAt: string;
  url: string;
}

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
    setForkHistory(getForkHistory());
  }, []);

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
    setSelectedProjects(new Set());
    setForkHistory(getForkHistory());
  };

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
        />
      </div>

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
