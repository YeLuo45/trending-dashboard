import { useState, useEffect } from 'react';
import type { AppNotification } from '../types';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadNotificationCount,
} from '../utils/social';

interface NotificationCenterProps {
  onClose: () => void;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  comment: '💬',
  follow: '👁',
  fork: '⎈',
  mention: '@',
  system: '🔔',
};

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffSecs < 60) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN');
  } catch {
    return isoString;
  }
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    setNotifications(getNotifications());
  }, []);

  const unreadCount = getUnreadNotificationCount();

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    setNotifications(getNotifications());
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    setNotifications(getNotifications());
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    setNotifications(getNotifications());
  };

  const handleClearAll = () => {
    clearAllNotifications();
    setNotifications([]);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
      setNotifications(getNotifications());
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-end z-50" onClick={onClose}>
      <div
        className="bg-github-card border-l border-github-border w-[400px] max-w-[100vw] h-full overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.4)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-github-border">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-github-text">🔔 通知中心</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                {unreadCount} 未读
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-github-muted hover:text-github-text text-2xl leading-none">&times;</button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-github-border">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'text-github-purple border-b-2 border-github-purple'
                : 'text-github-muted hover:text-github-text'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'text-github-purple border-b-2 border-github-purple'
                : 'text-github-muted hover:text-github-text'
            }`}
          >
            未读 {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex gap-2 p-2 border-b border-github-border bg-github-dark/30">
            <button
              onClick={handleMarkAllRead}
              className="flex-1 py-1.5 text-xs text-github-muted hover:text-github-text bg-github-dark border border-github-border rounded hover:border-github-purple/50 transition-colors"
            >
              全部标为已读
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 py-1.5 text-xs text-github-muted hover:text-red-400 bg-github-dark border border-github-border rounded hover:border-red-500/50 transition-colors"
            >
              清空全部
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-5xl mb-4">🔔</div>
              <p className="text-github-muted text-sm">
                {filter === 'unread' ? '暂无未读通知' : '暂无通知'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-github-border">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`relative p-4 hover:bg-github-dark/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-github-purple/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Unread dot */}
                  {!notification.read && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-github-purple" />
                  )}

                  <div className="flex items-start gap-3 pl-3">
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-full bg-github-dark flex items-center justify-center text-lg flex-shrink-0">
                      {notification.avatar ? (
                        <img
                          src={notification.avatar}
                          alt=""
                          className="w-9 h-9 rounded-full"
                        />
                      ) : (
                        NOTIFICATION_ICONS[notification.type] || '🔔'
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-github-text font-medium text-sm leading-tight">
                          {notification.title}
                        </h4>
                        <span className="text-github-muted text-xs whitespace-nowrap">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-github-muted text-xs mt-1 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="text-github-muted hover:text-red-400 transition-colors p-1 flex-shrink-0"
                      title="删除通知"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Mark as read on hover */}
                  {!notification.read && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleMarkRead(notification.id);
                      }}
                      className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 text-github-muted hover:text-github-purple text-xs transition-opacity"
                    >
                      标为已读
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-github-border text-center">
            <span className="text-github-muted text-xs">
              共 {notifications.length} 条通知
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
