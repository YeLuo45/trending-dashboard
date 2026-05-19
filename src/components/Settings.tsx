import { useState, useEffect } from 'react';
import { getGhToken, setGhToken, clearGhToken, fetchGhUser, syncForkHistory, type GhUser, type ForkHistoryRecord } from '../utils/github';

const FORK_HISTORY_KEY = 'fork_history';

function getLocalForkHistory(): ForkHistoryRecord[] {
  try {
    return JSON.parse(localStorage.getItem(FORK_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

interface SettingsProps {
  onClose: () => void;
  onUserChange: (user: GhUser | null) => void;
  forkHistoryCount?: number;
  onForkHistorySync?: (records: ForkHistoryRecord[]) => void;
}

export function Settings({ onClose, onUserChange, forkHistoryCount = 0, onForkHistorySync }: SettingsProps) {
  const [token, setToken] = useState(getGhToken());
  const [ghUser, setGhUser] = useState<GhUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      validateToken(token);
    }
  }, []);

  const validateToken = async (t: string) => {
    setLoading(true);
    setError('');
    const user = await fetchGhUser(t);
    setLoading(false);
    if (user) {
      setGhUser(user);
      onUserChange(user);
    } else {
      setError('Token 无效');
      setGhUser(null);
      onUserChange(null);
    }
  };

  const handleSave = () => {
    if (token) {
      setGhToken(token);
      validateToken(token);
    } else {
      clearGhToken();
      setGhUser(null);
      onUserChange(null);
    }
  };

  const handleClear = () => {
    clearGhToken();
    setToken('');
    setGhUser(null);
    onUserChange(null);
    setError('');
    setLastSynced(null);
  };

  const handleSyncForkHistory = async () => {
    const t = getGhToken();
    if (!t) return;
    setSyncing(true);
    try {
      const result = await syncForkHistory(getLocalForkHistory(), t);
      if (result.updated) {
        setLastSynced(new Date().toLocaleTimeString('zh-CN'));
        onForkHistorySync?.(result.records);
        localStorage.setItem(FORK_HISTORY_KEY, JSON.stringify(result.records.slice(0, 50)));
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-github-card border border-github-border rounded-lg p-6 w-96 max-w-[90vw]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-github-text">⚙️ 设置</h2>
          <button onClick={onClose} className="text-github-muted hover:text-github-text text-2xl leading-none">&times;</button>
        </div>

        {/* GitHub Token */}
        <div className="mb-4">
          <label className="block text-github-text text-sm font-medium mb-2">
            GitHub Personal Access Token
          </label>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="w-full px-3 py-2 bg-github-dark border border-github-border rounded text-github-text text-sm focus:outline-none focus:border-github-purple"
          />
          <p className="text-github-muted text-xs mt-1">
            用于 Fork 功能，
            <a href="https://github.com/settings/tokens/new?scopes=repo&description=trending-dashboard" target="_blank" rel="noopener noreferrer" className="text-github-purple hover:underline">
              创建 Token
            </a>
          </p>
        </div>

        {/* User Info */}
        {ghUser && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-github-dark rounded">
            <img src={ghUser.avatar_url} alt={ghUser.login} className="w-10 h-10 rounded-full" />
            <div>
              <p className="text-github-text font-medium">{ghUser.name || ghUser.login}</p>
              <p className="text-github-muted text-xs">@{ghUser.login}</p>
            </div>
            <span className="ml-auto text-green-400 text-xs">✓ 已验证</span>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        {/* Gist Backup Status */}
        {ghUser && (
          <div className="mb-4 p-3 bg-github-dark rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-github-text text-sm font-medium">💬 评论云端备份</p>
                <p className="text-github-muted text-xs mt-0.5">通过 GitHub Gist 自动同步，换设备不丢失</p>
              </div>
              <span className="text-green-400 text-xs">✓ 已启用</span>
            </div>
          </div>
        )}

        {/* Fork History Sync */}
        {ghUser && (
          <div className="mb-4 p-3 bg-github-dark rounded">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-github-text text-sm font-medium">📋 Fork 历史同步</p>
                <p className="text-github-muted text-xs mt-0.5">
                  已同步 {forkHistoryCount} 条记录到云端
                  {lastSynced ? ` · 上次同步 ${lastSynced}` : ''}
                </p>
              </div>
              <button
                onClick={handleSyncForkHistory}
                disabled={syncing}
                className="px-3 py-1 text-xs border border-github-purple text-github-purple rounded hover:bg-github-purple/10 disabled:opacity-50 transition-colors"
              >
                {syncing ? '同步中...' : '立即同步'}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-github-purple text-white rounded hover:bg-github-purple/80 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading ? '验证中...' : '保存'}
          </button>
          {token && (
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-github-border text-github-muted rounded hover:text-github-text hover:border-github-text text-sm transition-colors"
            >
              清除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
