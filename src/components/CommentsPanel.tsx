import { useState, useEffect } from 'react';
import type { Comment } from '../types';
import { getComments, addComment, deleteComment, loadCommentsWithRemote } from '../utils/social';

interface CommentsPanelProps {
  projectName: string;
  onClose: () => void;
}

export function CommentsPanel({ projectName, onClose }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);

  useEffect(() => {
    async function load() {
      setLoadingRemote(true);
      try {
        const merged = await loadCommentsWithRemote();
        setComments(merged[projectName] || []);
      } catch {
        setComments(getComments(projectName));
      } finally {
        setLoadingRemote(false);
      }
    }
    load();
  }, [projectName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !commentText.trim()) return;

    setSubmitting(true);
    try {
      await addComment(projectName, authorName.trim(), commentText.trim());
      const merged = await loadCommentsWithRemote();
      setComments(merged[projectName] || []);
      setCommentText('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(projectName, commentId);
    const merged = await loadCommentsWithRemote();
    setComments(merged[projectName] || []);
    setConfirmDelete(null);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return '刚刚';
      if (diffMins < 60) return `${diffMins} 分钟前`;
      if (diffHours < 24) return `${diffHours} 小时前`;
      if (diffDays < 7) return `${diffDays} 天前`;
      return date.toLocaleDateString('zh-CN');
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-github-card border border-github-border rounded-lg w-[650px] max-w-[90vw] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-github-border">
          <div>
            <h2 className="text-lg font-semibold text-github-text">💬 评论</h2>
            <p className="text-github-muted text-xs mt-0.5">{projectName}</p>
          </div>
          <button onClick={onClose} className="text-github-muted hover:text-github-text text-2xl leading-none">&times;</button>
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="p-4 border-b border-github-border">
          <div className="mb-3">
            <input
              type="text"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="你的昵称（必填）"
              maxLength={50}
              className="w-full px-3 py-2 bg-github-dark border border-github-border rounded text-github-text text-sm placeholder-github-muted focus:outline-none focus:border-github-purple transition-colors"
            />
          </div>
          <div className="mb-3">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="写下你的评论...（必填，最多 500 字）"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 bg-github-dark border border-github-border rounded text-github-text text-sm placeholder-github-muted focus:outline-none focus:border-github-purple transition-colors resize-none"
            />
            <div className="text-github-muted text-xs text-right mt-1">
              {commentText.length}/500
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || !authorName.trim() || !commentText.trim()}
            className="px-4 py-2 bg-github-purple text-white rounded hover:bg-github-purple/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {submitting ? '发布中...' : '发表评论'}
          </button>
        </form>

        {/* Comments List */}
        <div className="flex-1 overflow-auto p-4">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-github-muted text-sm">暂无评论，来发表第一篇吧！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="group relative">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-github-purple/30 flex items-center justify-center text-sm flex-shrink-0">
                      {comment.avatar ? (
                        <img src={comment.avatar} alt={comment.author} className="w-8 h-8 rounded-full" />
                      ) : (
                        <span className="text-github-purple text-sm">
                          {comment.author.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-github-text font-medium text-sm">{comment.author}</span>
                        <span className="text-github-muted text-xs">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-github-text text-sm whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => setConfirmDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-github-muted hover:text-red-400 transition-opacity text-xs px-2 py-1"
                      title="删除评论"
                    >
                      🗑
                    </button>
                  </div>

                  {/* Confirm Delete */}
                  {confirmDelete === comment.id && (
                    <div className="mt-2 p-2 bg-github-dark rounded border border-github-border">
                      <p className="text-github-muted text-xs mb-2">确定删除这条评论？</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                        >
                          确定删除
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1 bg-github-dark border border-github-border text-github-muted rounded text-xs hover:text-github-text transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-github-border flex items-center justify-between">
          <span className="text-github-muted text-xs">
            共 {comments.length} 条评论
          </span>
          {loadingRemote && (
            <span className="text-github-muted text-xs animate-pulse">同步中...</span>
          )}
        </div>
      </div>
    </div>
  );
}
