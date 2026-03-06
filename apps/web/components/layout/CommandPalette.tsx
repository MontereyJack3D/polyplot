'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Clock,
  Globe,
  LayoutDashboard,
  Search,
  Settings as SettingsIcon,
  Trophy,
  User,
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);

    window.addEventListener('polyplot:open-search', openHandler);
    window.addEventListener('polyplot:close-panels', closeHandler);

    return () => {
      window.removeEventListener('polyplot:open-search', openHandler);
      window.removeEventListener('polyplot:close-panels', closeHandler);
    };
  }, []);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
          <div className="flex items-center border-b border-border px-4">
            <Search size={16} className="text-muted-foreground mr-3" />
            <Command.Input
              placeholder="Search pages, markets, users..."
              className="flex h-12 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="text-muted-foreground text-sm text-center py-6">
              No results found.
            </Command.Empty>
            <Command.Group heading="Pages">
              {[
                { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { label: 'Profile', path: '/profile', icon: User },
                { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
                { label: 'Markets', path: '/markets', icon: Globe },
                { label: 'History', path: '/history', icon: Clock },
                { label: 'Settings', path: '/settings', icon: SettingsIcon },
              ].map((item) => (
                <Command.Item
                  key={item.path}
                  value={item.label}
                  onSelect={() => navigate(item.path)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-foreground data-[selected=true]:bg-secondary"
                >
                  <item.icon size={16} className="text-muted-foreground" />
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
          <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[11px] text-muted-foreground">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>esc Close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
