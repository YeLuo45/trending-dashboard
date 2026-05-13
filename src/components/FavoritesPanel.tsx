import { useState, useEffect } from 'react';
import type { FavoriteItem } from '../types';
import { getFavorites, removeFavorite, updateFavoriteCategory } from '../utils/social';

interface FavoritesPanelProps {
  onClose: () => void;
  onSelectProjects: (names: string[]) => void;
}

const CATEGORIES = ['全部', '学习', '工作', '调研'];

export function FavoritesPanel({ onClose, onSelectProjects }: FavoritesPanelProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [filter, setFilter] = useState('全部');
  const [selectedForShare, setSelectedForShare] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const filteredFavorites = filter === '全部' 
    ? favorites 
    : favorites.filter(f => f.category === filter);

  const handleRemove = (name: string) => {
    removeFavorite(name);
    setFavorites(getFavorites());
    setConfirmDelete(null);
  };

  const handleCategoryChange = (name: string, category: string) => {
    updateFavoriteCategory(name, category === '无分类' ? '' : category);
    setFavorites(getFavorites());
  };

  const handleToggleSelectForShare = (name: string) => {
    setSelectedForShare(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleShareSelected = () => {
    const selectedFavs = favorites.filter(f => selectedForShare.has(f.name));
    onSelectProjects(selectedFavs.map(f => f.name));
    setSelectedForShare(new Set());
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-github-card border border-github-border rounded-lg w-[700px] max-w-[90vw] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-github-border">
          <h2 className="text-xl font-semibold text-github-text flex items-center gap-2">
            ⭐ 我的收藏 ({favorites.length})
          </h2>
          <button 
            onClick={onClose}
            className="text-github-muted hover:text-github-text text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-4 border-b border-github-border">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                filter === cat 
                  ? 'bg-github-purple text-white' 
                  : 'bg-github-dark text-github-muted hover:text-github-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Actions */}
        {selectedForShare.size > 0 && (
          <div className="p-4 bg-github-purple/10 border-b border-github-border">
            <div className="flex items-center justify-between">
              <span className="text-github-purple text-sm">
                已选择 {selectedForShare.size} 个项目
              </span>
              <button
                onClick={handleShareSelected}
                className="px-4 py-2 text-sm rounded bg-github-purple text-white hover:bg-github-purple/80 transition-colors"
              >
                生成分享链接
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-auto p-4">
          {filteredFavorites.length === 0 ? (
            <div className="text-center py-12 text-github-muted">
              {filter === '全部' ? '暂无收藏项目' : `暂无「${filter}」分类的项目`}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFavorites.map(fav => (
                <div 
                  key={fav.name}
                  className="p-3 bg-github-dark rounded hover:bg-github-dark/80 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {/* Share Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedForShare.has(fav.name)}
                      onChange={() => handleToggleSelectForShare(fav.name)}
                      className="mt-1 w-4 h-4 rounded border-github-border text-github-purple focus:ring-github-purple cursor-pointer"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <a
                          href={fav.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-github-purple font-medium hover:underline truncate"
                        >
                          {fav.name}
                        </a>
                        
                        {/* Category Selector */}
                        <select
                          value={fav.category || '无分类'}
                          onChange={e => handleCategoryChange(fav.name, e.target.value)}
                          className="text-xs bg-github-card border border-github-border rounded px-2 py-1 text-github-muted cursor-pointer"
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="无分类">无分类</option>
                          {CATEGORIES.filter(c => c !== '全部').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      
                      <p className="text-github-muted text-sm mt-1 line-clamp-2">
                        {fav.description}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-github-muted text-xs">
                          收藏于 {fav.starredAt}
                        </span>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {confirmDelete === fav.name ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRemove(fav.name)}
                            className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          >
                            确认
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs px-2 py-1 rounded bg-github-card text-github-muted hover:text-github-text"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(fav.name)}
                          className="text-github-muted hover:text-red-400 text-sm"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
