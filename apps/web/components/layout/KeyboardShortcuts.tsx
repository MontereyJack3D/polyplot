'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === 'Escape') {
          window.dispatchEvent(new CustomEvent('polyplot:close-panels'));
        }
      }

      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('polyplot:open-search'));
        }
      }

      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const navMap: Record<string, string> = {
          '1': '/dashboard',
          '2': '/profile',
          '3': '/leaderboard',
          '4': '/markets',
          '5': '/history',
          '6': '/settings',
        };

        if (navMap[e.key]) {
          router.push(navMap[e.key]);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return null;
}
