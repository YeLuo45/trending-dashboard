import { useState, useEffect } from 'react';
import { getGhToken, setGhToken, clearGhToken, fetchGhUser, type GhUser } from '../utils/github';

interface SettingsProps {
  onClose: () => void;
  onUserChange: (user: GhUser | null) => void;
}

export function Settings({ onClose, onUserChange }: SettingsProps) {
  const [token, setToken] = useState(getGhToken());
  const [ghUser, setGhUser] = useState<GhUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
