import type { AppMode, StandardTimeframe, VenueScope } from './enums';

export interface FilterState {
  timeframe: StandardTimeframe | 'custom';
  venue: VenueScope;
  category: string | null;
  customRange: { start: string; end: string } | null;
}

export interface AppState extends FilterState {
  mode: AppMode;
}
