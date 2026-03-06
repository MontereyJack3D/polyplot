'use client';

import { Bell } from 'lucide-react';

import { SlidePanel } from './SlidePanel';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  ts: string;
  unread?: boolean;
  type: 'resolution' | 'achievement' | 'milestone';
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
}

export function NotificationPanel({ isOpen, onClose, notifications }: NotificationPanelProps) {
  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications"
      subtitle="Recent resolutions, achievements, and edge milestones"
      icon={<Bell size={16} />}
      width="md"
    >
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-xl border border-border bg-secondary/40 p-4 flex items-start gap-3"
            >
              <div
                className={[
                  'mt-1 h-2.5 w-2.5 rounded-full',
                  notification.unread ? 'bg-primary' : 'bg-muted-foreground/40',
                ].join(' ')}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{notification.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{notification.body}</p>
                <p className="mt-2 text-[11px] text-muted-foreground/80">{new Date(notification.ts).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </SlidePanel>
  );
}
