import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimeframeFilter = '7D' | '30D' | 'YTD' | '1Y' | 'ALL' | 'custom';
export type VenueFilter = 'combined' | 'polymarket' | 'kalshi';
export type AppMode = 'normal' | 'pro';

interface FilterState {
  timeframe: TimeframeFilter;
  venue: VenueFilter;
  category: string | null;
  mode: AppMode;
  customRange: { start: string; end: string } | null;

  setTimeframe: (t: TimeframeFilter) => void;
  setVenue: (v: VenueFilter) => void;
  setCategory: (c: string | null) => void;
  setMode: (m: AppMode) => void;
  setCustomRange: (r: { start: string; end: string } | null) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      timeframe: 'ALL',
      venue: 'combined',
      category: null,
      mode: 'normal',
      customRange: null,

      setTimeframe: (timeframe) => set({ timeframe }),
      setVenue: (venue) => set({ venue }),
      setCategory: (category) => set({ category }),
      setMode: (mode) => set({ mode }),
      setCustomRange: (customRange) => set({ customRange }),
      resetFilters: () =>
        set({
          timeframe: 'ALL',
          venue: 'combined',
          category: null,
          customRange: null,
        }),
    }),
    { name: 'polyplot-filters' }
  )
);
