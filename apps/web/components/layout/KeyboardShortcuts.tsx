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
          '1': '/app/dashboard',
          '2': '/app/profile',
          '3': '/app/leaderboard',
          '4': '/app/markets',
          '5': '/app/history',
          '6': '/app/settings',
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
