'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications, Notification } from '@/lib/notification-context';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const ref = useRef<HTMLDivElement>(null);
  const hasUnread = unreadCount > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', key);
    };
  }, []);

  // "All" tab shows everything; "unread" shows only those with read=false
  const displayed = tab === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/30 transition-colors"
        title="Notifications"
      >
        <span
          className={`${hasUnread ? 'material-icons' : 'material-icons-outlined'} text-foreground`}
          style={{ fontSize: 20 }}
        >
          notifications
        </span>
        {hasUnread && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-84 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          style={{ width: 340 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {hasUnread && (
              <button onClick={markAllAsRead} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Mark all read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {(['all', 'unread'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-medium transition-colors capitalize ${
                  tab === t ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {t === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-80 dropdown-scroll">
            {displayed.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                {tab === 'unread' ? 'No unread notifications' : 'No notifications'}
              </p>
            ) : (
              displayed.map((n) => (
                <NotificationItem key={n.id} notification={n} onMarkRead={() => markAsRead(n.id)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification, onMarkRead }: { notification: Notification; onMarkRead: () => void }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors border-b border-border/40 last:border-b-0 ${!notification.read ? 'bg-muted/10' : ''}`}>
      {/* Unread dot */}
      {!notification.read
        ? <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
        : <span className="w-2 flex-shrink-0" />
      }

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${!notification.read ? 'font-medium' : 'text-muted-foreground'}`}>
          {notification.title}
        </p>
        {notification.description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight line-clamp-2">{notification.description}</p>
        )}
        <p className="text-xs text-muted-foreground/60 mt-1">{notification.time}</p>
      </div>

      {/* Mark as read button — always visible, icon + text */}
      <button
        onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
        title="Mark as read"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5 whitespace-nowrap"
      >
        <span className="material-icons-outlined" style={{ fontSize: 13 }}>done_all</span>
        <span>Mark as read</span>
      </button>
    </div>
  );
}
