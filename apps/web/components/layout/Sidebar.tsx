'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ChevronLeft, ChevronRight, Clock, Globe, LayoutDashboard, Lock, Settings, Trophy, User } from 'lucide-react';
import { useSession } from 'next-auth/react';

const navItems = [
  { path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, gated: true },
  { path: '/app/profile', label: 'Profile', icon: User, gated: true },
  { path: '/app/leaderboard', label: 'Leaderboard', icon: Trophy, gated: false },
  { path: '/app/markets', label: 'Markets', icon: Globe, gated: false },
  { path: '/app/history', label: 'History', icon: Clock, gated: true },
  { path: '/app/settings', label: 'Settings', icon: Settings, gated: true },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isConnected = status === 'authenticated';
  const walletLabel = session?.user?.address
    ? `${session.user.address.slice(0, 6)}...${session.user.address.slice(-4)}`
    : 'Guest';

  return (
    <>
      {mobileOpen ? <button className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onMobileClose} aria-label="Close menu" /> : null}
      <aside
        className={[
          'h-screen bg-sidebar border-r border-border transition-[width,transform] duration-200 z-40',
          'fixed left-0 top-0 md:sticky md:translate-x-0',
          mobileOpen ? 'translate-x-0 w-60' : '-translate-x-full w-60',
          collapsed ? 'md:w-[72px]' : 'md:w-60',
        ].join(' ')}
      >
        <div className="h-full flex flex-col">
        <div className="h-16 px-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#6366f1] flex items-center justify-center shrink-0">
              <Activity size={16} className="text-white" />
            </div>
            {!collapsed && <span className="text-sm font-medium tracking-tight whitespace-nowrap">PolyPlot</span>}
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon, gated }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                href={path}
                onClick={onMobileClose}
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-[#00d4aa]/10 text-[#00d4aa]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80',
                ].join(' ')}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
                {gated && !isConnected && !collapsed ? <Lock size={10} className="text-muted-foreground/50 ml-auto" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-3 border-t border-border">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('polyplot:open-onboarding'))}
            className="w-full text-left rounded-lg bg-secondary/60 px-3 py-2 hover:bg-secondary transition-colors"
          >
            <p className={['text-xs text-muted-foreground', collapsed ? 'hidden' : 'block'].join(' ')}>Signed in as</p>
            <p className={['text-sm font-medium truncate', collapsed ? 'hidden' : 'block'].join(' ')}>
              {isConnected ? walletLabel : 'Guest'}
            </p>
            {collapsed && <User size={16} className="mx-auto text-muted-foreground" />}
          </button>
        </div>
        </div>
      </aside>
    </>
  );
}
