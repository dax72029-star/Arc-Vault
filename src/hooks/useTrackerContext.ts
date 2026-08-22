import { createContext, useContext } from 'react';
import type { TrackerItem } from '../types';

export interface TrackerContextType {
  items: TrackerItem[];
  loading: boolean;
  refresh: () => void;
  addItem: (item: TrackerItem) => boolean;
  removeItem: (tmdbId: number, type: 'movie' | 'tv') => boolean;
  updateItem: (tmdbId: number, type: 'movie' | 'tv', updates: Partial<TrackerItem>) => TrackerItem | null;
  isTracked: (tmdbId: number, type: 'movie' | 'tv') => boolean;
  getItem: (tmdbId: number, type: 'movie' | 'tv') => TrackerItem | undefined;
}

export const TrackerContext = createContext<TrackerContextType | null>(null);

export function useTrackerContext(): TrackerContextType {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTrackerContext must be used within TrackerProvider');
  }
  return context;
}
