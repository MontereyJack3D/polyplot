import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchlistState {
  watchedMarketIds: string[];
  addToWatchlist: (marketId: string) => void;
  removeFromWatchlist: (marketId: string) => void;
  isWatched: (marketId: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchedMarketIds: [],
      addToWatchlist: (marketId) =>
        set((state) => ({
          watchedMarketIds: [...new Set([...state.watchedMarketIds, marketId])],
        })),
      removeFromWatchlist: (marketId) =>
        set((state) => ({
          watchedMarketIds: state.watchedMarketIds.filter((id) => id !== marketId),
        })),
      isWatched: (marketId) => get().watchedMarketIds.includes(marketId),
    }),
    { name: 'polyplot-watchlist' }
  )
);
